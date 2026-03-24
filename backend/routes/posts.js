const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadLimiter, checkBanned } = require('../middleware/security');

// Helper — send notification to a specific user via socket
const emitNotification = (req, receiverId, notification) => {
  const onlineUsers = req.app.get('onlineUsers');
  const io = req.app.get('io');
  const sid = onlineUsers?.get(receiverId.toString());
  if (sid) io.to(sid).emit('receive_notification', { notification });
};

// POST /api/posts/create
router.post('/create', auth, checkBanned, uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim() && !req.file)
      return res.status(400).json({ message: 'Post must have content or an image' });

    const post = await Post.create({
      userId: req.userId,
      content: content?.trim() || '',
      image: req.file ? `/uploads/${req.file.filename}` : '',
    });
    const populated = await post.populate('userId', 'username profilePicture verified verifiedType');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/feed?page=1&limit=20
router.get('/feed', auth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const me = await User.findById(req.userId).select('following');
    const posts = await Post.find({ userId: { $in: [...me.following, req.userId] } })
      .populate('userId', 'username profilePicture verified verifiedType')
      .populate('comments.userId', 'username profilePicture verified verifiedType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ userId: { $in: [...me.following, req.userId] } });
    res.json({ posts, page, hasMore: skip + posts.length < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/explore?page=1&limit=20&q=search
router.get('/explore', auth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;
    const q     = req.query.q?.trim();

    const filter = q ? { content: { $regex: q, $options: 'i' } } : {};
    const posts = await Post.find(filter)
      .populate('userId', 'username profilePicture verified verifiedType')
      .populate('comments.userId', 'username profilePicture verified verifiedType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);
    res.json({ posts, page, hasMore: skip + posts.length < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/liked/:userId
router.get('/liked/:userId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ likes: req.params.userId })
      .populate('userId', 'username profilePicture verified verifiedType')
      .populate('comments.userId', 'username profilePicture verified verifiedType')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/user/:id?page=1
router.get('/user/:id', auth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const posts = await Post.find({ userId: req.params.id })
      .populate('userId', 'username profilePicture verified verifiedType')
      .populate('comments.userId', 'username profilePicture verified verifiedType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ userId: req.params.id });
    res.json({ posts, page, hasMore: skip + posts.length < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/like/:id
router.post('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const liked = post.likes.includes(req.userId);
    if (liked) {
      post.likes.pull(req.userId);
    } else {
      post.likes.push(req.userId);
      if (post.userId.toString() !== req.userId) {
        const notif = await Notification.create({
          userId: post.userId,
          fromUser: req.userId,
          type: 'like',
          postId: post._id,
        });
        const populated = await notif.populate('fromUser', 'username profilePicture');
        emitNotification(req, post.userId, populated);
      }
    }
    await post.save();
    res.json({ likes: post.likes, liked: !liked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/comment/:id
router.post('/comment/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ userId: req.userId, text: text.trim() });
    await post.save();

    if (post.userId.toString() !== req.userId) {
      const notif = await Notification.create({
        userId: post.userId,
        fromUser: req.userId,
        type: 'comment',
        postId: post._id,
      });
      const populated = await notif.populate('fromUser', 'username profilePicture');
      emitNotification(req, post.userId, populated);
    }

    const updated = await Post.findById(req.params.id)
      .populate('userId', 'username profilePicture verified verifiedType')
      .populate('comments.userId', 'username profilePicture verified verifiedType');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/posts/comment/:postId/:commentId
router.delete('/comment/:postId/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== req.userId)
      return res.status(403).json({ message: 'Unauthorized' });

    post.comments.pull({ _id: req.params.commentId });
    await post.save();

    const updated = await Post.findById(req.params.postId)
      .populate('userId', 'username profilePicture verified verifiedType')
      .populate('comments.userId', 'username profilePicture verified verifiedType');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.userId.toString() !== req.userId)
      return res.status(403).json({ message: 'Unauthorized' });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
