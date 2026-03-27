const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadLimiter, checkBanned } = require('../middleware/security');

const REACTIONS = ['heart', 'fire', 'laugh', 'sad', 'wow', 'angry'];

const emitNotification = (req, receiverId, notification) => {
  const sid = req.app.get('onlineUsers')?.get(receiverId.toString());
  if (sid) req.app.get('io').to(sid).emit('receive_notification', { notification });
};

// Extract hashtags from content
const extractHashtags = (text = '') =>
  [...text.matchAll(/#([a-zA-Z0-9_]+)/g)].map((m) => m[1].toLowerCase());

const populatePost = (q) =>
  q.populate('userId', 'username profilePicture verified verifiedType')
   .populate('comments.userId', 'username profilePicture verified verifiedType');

// POST /api/posts/create
router.post('/create', auth, checkBanned, uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    const { content, pollQuestion, pollOptions, pollDuration } = req.body;
    if (!content?.trim() && !req.file && !pollQuestion)
      return res.status(400).json({ message: 'Post must have content, image, or poll' });

    const postData = {
      userId: req.userId,
      content: content?.trim() || '',
      image: req.file ? `/uploads/${req.file.filename}` : '',
      hashtags: extractHashtags(content),
    };

    // Poll support
    if (pollQuestion && pollOptions) {
      const opts = Array.isArray(pollOptions) ? pollOptions : JSON.parse(pollOptions);
      if (opts.length >= 2 && opts.length <= 4) {
        postData.poll = {
          question: pollQuestion.trim(),
          options: opts.map((o) => ({ text: o.trim(), votes: [] })),
          endsAt: new Date(Date.now() + (parseInt(pollDuration) || 24) * 60 * 60 * 1000),
        };
      }
    }

    const post = await Post.create(postData);
    const populated = await populatePost(Post.findById(post._id));
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
    const filter = { userId: { $in: [...me.following, req.userId] } };
    const [posts, total] = await Promise.all([
      populatePost(Post.find(filter)).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);
    res.json({ posts, page, hasMore: skip + posts.length < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/trending?limit=20 — posts sorted by engagement
router.get('/trending', auth, async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await populatePost(
      Post.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $addFields: { score: { $add: [{ $size: '$likes' }, { $multiply: [{ $size: '$comments' }, 2] }] } } },
        { $sort: { score: -1, createdAt: -1 } },
        { $limit: limit },
      ])
    );
    // Re-populate after aggregate
    const ids = posts.map ? posts.map((p) => p._id) : [];
    const result = await populatePost(Post.find({ _id: { $in: ids } })).sort({ createdAt: -1 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/hashtag/:tag
router.get('/hashtag/:tag', auth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip  = (page - 1) * limit;
    const tag   = req.params.tag.toLowerCase();
    const [posts, total] = await Promise.all([
      populatePost(Post.find({ hashtags: tag })).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments({ hashtags: tag }),
    ]);
    res.json({ posts, tag, total, page, hasMore: skip + posts.length < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/trending-hashtags
router.get('/trending-hashtags', auth, async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tags = await Post.aggregate([
      { $match: { createdAt: { $gte: since }, hashtags: { $exists: true, $ne: [] } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { tag: '$_id', count: 1, _id: 0 } },
    ]);
    res.json(tags);
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
    const filter = q
      ? { $or: [{ content: { $regex: q, $options: 'i' } }, { hashtags: q.replace(/^#/, '').toLowerCase() }] }
      : {};
    const [posts, total] = await Promise.all([
      populatePost(Post.find(filter)).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);
    res.json({ posts, page, hasMore: skip + posts.length < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/liked/:userId
router.get('/liked/:userId', auth, async (req, res) => {
  try {
    const posts = await populatePost(Post.find({ likes: req.params.userId }))
      .sort({ createdAt: -1 }).limit(50);
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
    const [posts, total] = await Promise.all([
      populatePost(Post.find({ userId: req.params.id })).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments({ userId: req.params.id }),
    ]);
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
    if (liked) post.likes.pull(req.userId);
    else {
      post.likes.push(req.userId);
      if (post.userId.toString() !== req.userId) {
        const notif = await Notification.create({ userId: post.userId, fromUser: req.userId, type: 'like', postId: post._id });
        emitNotification(req, post.userId, await notif.populate('fromUser', 'username profilePicture'));
      }
    }
    await post.save();
    res.json({ likes: post.likes, liked: !liked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/react/:id — add/remove emoji reaction
router.post('/react/:id', auth, async (req, res) => {
  try {
    const { reaction } = req.body;
    if (!REACTIONS.includes(reaction)) return res.status(400).json({ message: 'Invalid reaction' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Remove from all reactions first
    for (const r of REACTIONS) post.reactions[r].pull(req.userId);

    // Toggle: if same reaction, just remove; else add new
    const alreadyHad = post.reactions[reaction].includes(req.userId);
    if (!alreadyHad) post.reactions[reaction].push(req.userId);

    await post.save();
    res.json({ reactions: post.reactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/poll/:id/vote — vote on a poll option
router.post('/poll/:id/vote', auth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post?.poll?.question) return res.status(400).json({ message: 'No poll on this post' });
    if (post.poll.endsAt && new Date() > post.poll.endsAt)
      return res.status(400).json({ message: 'Poll has ended' });

    // Remove existing vote
    post.poll.options.forEach((o) => o.votes.pull(req.userId));
    // Add new vote
    if (post.poll.options[optionIndex]) post.poll.options[optionIndex].votes.push(req.userId);
    await post.save();
    res.json({ poll: post.poll });
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
      const notif = await Notification.create({ userId: post.userId, fromUser: req.userId, type: 'comment', postId: post._id });
      emitNotification(req, post.userId, await notif.populate('fromUser', 'username profilePicture'));
    }
    const updated = await populatePost(Post.findById(req.params.id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/comment/:postId/:commentId/like — like a comment
router.post('/comment/:postId/:commentId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const liked = comment.likes.includes(req.userId);
    if (liked) comment.likes.pull(req.userId);
    else comment.likes.push(req.userId);
    await post.save();
    res.json({ liked: !liked, count: comment.likes.length });
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
    if (comment.userId.toString() !== req.userId) return res.status(403).json({ message: 'Unauthorized' });
    post.comments.pull({ _id: req.params.commentId });
    await post.save();
    const updated = await populatePost(Post.findById(req.params.postId));
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
    if (post.userId.toString() !== req.userId) return res.status(403).json({ message: 'Unauthorized' });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
