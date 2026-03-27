const router = require('express').Router();
const Story = require('../models/Story');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/stories — create a story (expires in 24h)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image is required' });
    const story = await Story.create({
      userId: req.userId,
      image: `/uploads/${req.file.filename}`,
      caption: req.body.caption?.trim() || '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const populated = await story.populate('userId', 'username profilePicture verified verifiedType');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/stories/feed — stories from people you follow + your own
router.get('/feed', auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).select('following');
    const ids = [...(me.following || []), req.userId];
    const stories = await Story.find({
      userId: { $in: ids },
      expiresAt: { $gt: new Date() },
    })
      .populate('userId', 'username profilePicture verified verifiedType')
      .sort({ createdAt: -1 });

    // Group by user
    const grouped = {};
    for (const s of stories) {
      const uid = s.userId._id.toString();
      if (!grouped[uid]) grouped[uid] = { user: s.userId, stories: [] };
      grouped[uid].stories.push(s);
    }
    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/stories/:id/view — mark story as viewed
router.post('/:id/view', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    if (!story.viewers.includes(req.userId)) {
      story.viewers.push(req.userId);
      await story.save();
    }
    res.json({ viewed: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/stories/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Not found' });
    if (story.userId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
    await story.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
