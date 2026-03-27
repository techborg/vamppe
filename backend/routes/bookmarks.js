const router = require('express').Router();
const Bookmark = require('../models/Bookmark');
const auth = require('../middleware/auth');

// GET /api/bookmarks/ids — must be BEFORE /:postId to avoid route conflict
router.get('/ids', auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.userId }).select('postId');
    res.json(bookmarks.map((b) => b.postId.toString()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bookmarks/:postId — toggle bookmark
router.post('/:postId', auth, async (req, res) => {
  try {
    const existing = await Bookmark.findOne({ userId: req.userId, postId: req.params.postId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ bookmarked: false });
    }
    await Bookmark.create({ userId: req.userId, postId: req.params.postId });
    res.json({ bookmarked: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookmarks — get all bookmarked posts
router.get('/', auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.userId })
      .populate({
        path: 'postId',
        populate: { path: 'userId', select: 'username profilePicture verified verifiedType' },
      })
      .sort({ createdAt: -1 });
    const posts = bookmarks.map((b) => b.postId).filter(Boolean);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
