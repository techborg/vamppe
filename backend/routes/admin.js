const router = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const PageView = require('../models/PageView');
const auth = require('../middleware/auth');
const audit = require('../middleware/audit');
const AuditLog = require('../models/AuditLog');

// Middleware — admin only
const adminOnly = async (req, res, next) => {
  const user = await User.findById(req.userId).select('isAdmin');
  if (!user?.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  next();
};

// ── Stats ─────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const [users, posts, messages, verifiedUsers, newUsersToday, newPostsToday] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Message.countDocuments(),
      User.countDocuments({ verified: true }),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
      Post.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
    ]);
    res.json({ users, posts, messages, verifiedUsers, newUsersToday, newPostsToday });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Users ─────────────────────────────────────────────────────────────────────
// GET /api/admin/users?page=1&limit=20&q=search
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;
    const q     = req.query.q?.trim();
    const filter = q ? { $or: [{ username: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }] } : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ users, total, page, hasMore: skip + users.length < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/users/:id  — toggle verified / isAdmin / banned / verifiedType
router.patch('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.isAdmin === 'boolean') updates.isAdmin = req.body.isAdmin;
    if (typeof req.body.banned === 'boolean') updates.banned = req.body.banned;
    
    // Add audit only if these change
    if (typeof req.body.banned === 'boolean' || typeof req.body.isAdmin === 'boolean') {
      const actor = await User.findById(req.userId).select('username');
      const target = await User.findById(req.params.id).select('username');
      AuditLog.create({
        userId: req.userId,
        action: req.body.banned ? 'ban_user' : req.body.isAdmin ? 'promote_admin' : 'update_user_flags',
        targetType: 'User',
        targetId: req.params.id,
        details: { body: req.body, targetUsername: target?.username, actorUsername: actor?.username }
      }).catch(() => {});
    }

    // verifiedType drives both verifiedType and the legacy verified bool
    if (req.body.verifiedType !== undefined) {
      const valid = ['none', 'blue', 'gold', 'purple', 'red'];
      if (!valid.includes(req.body.verifiedType))
        return res.status(400).json({ message: 'Invalid verifiedType' });
      updates.verifiedType = req.body.verifiedType;
      updates.verified = req.body.verifiedType !== 'none';
    } else if (typeof req.body.verified === 'boolean') {
      updates.verified = req.body.verified;
      if (!req.body.verified) updates.verifiedType = 'none';
      else updates.verifiedType = 'blue'; // default to blue when toggling on
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', auth, adminOnly, audit('delete_user', 'User'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Post.deleteMany({ userId: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Verification Requests ─────────────────────────────────────────────────────
// GET /api/admin/verification-requests?status=pending
router.get('/verification-requests', auth, adminOnly, async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const users = await User.find({ 'verificationRequest.status': status })
      .select('username displayName email profilePicture verified verifiedType verificationRequest createdAt')
      .sort({ 'verificationRequest.submittedAt': -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/verification-requests/:id/approve
router.post('/verification-requests/:id/approve', auth, adminOnly, audit('approve_verification', 'User'), async (req, res) => {
  try {
    const { badgeType = 'blue' } = req.body;
    const valid = ['blue', 'gold', 'purple', 'red'];
    if (!valid.includes(badgeType)) return res.status(400).json({ message: 'Invalid badge type' });

    const user = await User.findByIdAndUpdate(req.params.id, {
      verified: true,
      verifiedType: badgeType,
      'verificationRequest.status': 'approved',
      'verificationRequest.reviewedAt': new Date(),
    }, { new: true }).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/verification-requests/:id/reject
router.post('/verification-requests/:id/reject', auth, adminOnly, async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, {
      'verificationRequest.status': 'rejected',
      'verificationRequest.reviewedAt': new Date(),
      'verificationRequest.rejectionReason': reason.trim(),
    }, { new: true }).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Posts ─────────────────────────────────────────────────────────────────────
// GET /api/admin/posts?page=1&limit=20&q=search
router.get('/posts', auth, adminOnly, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;
    const q     = req.query.q?.trim();
    const filter = q ? { content: { $regex: q, $options: 'i' } } : {};

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('userId', 'username profilePicture verified verifiedType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter),
    ]);
    res.json({ posts, total, page, hasMore: skip + posts.length < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', auth, adminOnly, audit('delete_post', 'Post'), async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Audit Logs ──────────────────────────────────────────────────────────────
// GET /api/admin/audit-logs?page=1&limit=50
router.get('/audit-logs', auth, adminOnly, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('userId', 'username profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments()
    ]);
    res.json({ logs, total, page, hasMore: skip + logs.length < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Analytics ─────────────────────────────────────────────────────────────────
// GET /api/admin/analytics?days=30
router.get('/analytics', auth, adminOnly, async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalViews,
      uniqueVisitors,
      dailyViews,
      topPages,
      deviceBreakdown,
      hourlyActivity,
      geoBreakdown,
      geoPoints,
      ipBreakdown,
    ] = await Promise.all([
      PageView.countDocuments({ createdAt: { $gte: since } }),
      PageView.distinct('ip', { createdAt: { $gte: since } }).then((r) => r.length),

      PageView.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          views: { $sum: 1 },
          unique: { $addToSet: '$ip' },
        }},
        { $project: { date: '$_id', views: 1, unique: { $size: '$unique' }, _id: 0 } },
        { $sort: { date: 1 } },
      ]),

      PageView.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$path', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        { $project: { path: '$_id', views: 1, _id: 0 } },
      ]),

      PageView.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $project: { device: '$_id', count: 1, _id: 0 } },
      ]),

      PageView.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } },
        { $project: { hour: '$_id', count: 1, _id: 0 } },
      ]),

      // Country breakdown
      PageView.aggregate([
        { $match: { createdAt: { $gte: since }, countryCode: { $ne: '' } } },
        { $group: { _id: { country: '$country', countryCode: '$countryCode' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 },
        { $project: { country: '$_id.country', countryCode: '$_id.countryCode', count: 1, _id: 0 } },
      ]),

      // Geo points for heatmap (lat/lon with count)
      PageView.aggregate([
        { $match: { createdAt: { $gte: since }, lat: { $ne: null }, lon: { $ne: null } } },
        { $group: { _id: { lat: '$lat', lon: '$lon', country: '$country', city: '$city' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1000 },
        { $project: { lat: '$_id.lat', lon: '$_id.lon', country: '$_id.country', city: '$_id.city', count: 1, _id: 0 } },
      ]),

      // IP breakdown
      PageView.aggregate([
        { $match: { createdAt: { $gte: since }, ip: { $ne: null } } },
        { $group: { _id: { ip: '$ip', country: '$country', city: '$city', countryCode: '$countryCode' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 25 },
        { $project: { ip: '$_id.ip', country: '$_id.country', city: '$_id.city', countryCode: '$_id.countryCode', count: 1, _id: 0 } },
      ]),
    ]);

    // Fill missing days
    const dayMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { date: key, views: 0, unique: 0 };
    }
    dailyViews.forEach((d) => { if (dayMap[d.date]) dayMap[d.date] = d; });

    // Fill missing hours
    const hourMap = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    hourlyActivity.forEach(({ hour, count }) => { hourMap[hour].count = count; });

    res.json({
      totalViews, uniqueVisitors,
      dailyViews: Object.values(dayMap),
      topPages, deviceBreakdown,
      hourlyActivity: hourMap,
      geoBreakdown, geoPoints, ipBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
