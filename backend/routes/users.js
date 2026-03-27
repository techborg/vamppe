const router = require('express').Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/users/by-username/:username
router.get('/by-username/:username', auth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/profile/:id
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', auth, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'coverPicture', maxCount: 1 },
]), async (req, res) => {
  try {
    const updates = {};
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.username) updates.username = req.body.username;
    if (req.body.displayName !== undefined) updates.displayName = req.body.displayName;
    if (req.body.website !== undefined) updates.website = req.body.website;
    if (req.body.location !== undefined) updates.location = req.body.location;
    if (req.files?.profilePicture?.[0]) updates.profilePicture = `/uploads/${req.files.profilePicture[0].filename}`;
    if (req.files?.coverPicture?.[0]) updates.coverPicture = `/uploads/${req.files.coverPicture[0].filename}`;
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/follow/:id
router.post('/follow/:id', auth, async (req, res) => {
  try {
    if (req.params.id === req.userId)
      return res.status(400).json({ message: "You can't follow yourself" });

    const target = await User.findById(req.params.id);
    const me = await User.findById(req.userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const isFollowing = me.following.includes(req.params.id);

    if (isFollowing) {
      await User.findByIdAndUpdate(req.userId, { $pull: { following: req.params.id } });
      await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.userId } });
      return res.json({ message: 'Unfollowed' });
    } else {
      await User.findByIdAndUpdate(req.userId, { $push: { following: req.params.id } });
      await User.findByIdAndUpdate(req.params.id, { $push: { followers: req.userId } });

      const notif = await Notification.create({
        userId: req.params.id,
        fromUser: req.userId,
        type: 'follow',
      });
      const populated = await notif.populate('fromUser', 'username profilePicture');
      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers');
      const targetSocketId = onlineUsers?.get(req.params.id);
      if (targetSocketId) {
        io.to(targetSocketId).emit('send_notification', { notification: populated });
      }

      return res.json({ message: 'Followed' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/search?q=
router.get('/search', auth, async (req, res) => {
  try {
    const users = await User.find({
      username: { $regex: req.query.q || '', $options: 'i' },
      _id: { $ne: req.userId },
    })
      .select('username profilePicture bio followers verified')
      .limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/suggestions
router.get('/suggestions', auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const users = await User.find({
      _id: { $ne: req.userId, $nin: me.following },
    })
      .select('username profilePicture bio followers verified')
      .limit(5);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/verify/:id  (admin only — toggle verified badge)
router.post('/verify/:id', auth, async (req, res) => {
  try {
    const admin = await User.findById(req.userId);
    if (!admin?.isAdmin) return res.status(403).json({ message: 'Forbidden' });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    target.verified = !target.verified;
    await target.save();
    res.json({ verified: target.verified, message: target.verified ? 'User verified' : 'Verification removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/verification-request  — submit a verification request
router.post('/verification-request', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.verified) return res.status(400).json({ message: 'Your account is already verified.' });
    if (user.verificationRequest?.status === 'pending')
      return res.status(400).json({ message: 'You already have a pending request.' });

    const { fullName, category, reason, links } = req.body;
    if (!fullName || !category || !reason)
      return res.status(400).json({ message: 'Full name, category, and reason are required.' });

    user.verificationRequest = {
      status: 'pending',
      fullName: fullName.trim(),
      category: category.trim(),
      reason: reason.trim(),
      links: (links || '').trim(),
      submittedAt: new Date(),
      reviewedAt: null,
      rejectionReason: '',
    };
    await user.save();
    res.json({ message: 'Verification request submitted.', request: user.verificationRequest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/verification-request  — get own request status
router.get('/verification-request', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('verificationRequest verified verifiedType');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('username email displayName bio website location settings');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/settings  — update settings, email, username, displayName etc.
router.patch('/settings', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, email, username, displayName, bio, website, location, settings } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updates = {};

    // Profile fields
    if (username !== undefined && username !== user.username) {
      if (username.length < 3 || username.length > 30)
        return res.status(400).json({ message: 'Username must be 3–30 characters' });
      if (!/^[a-zA-Z0-9_]+$/.test(username))
        return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
      const taken = await User.findOne({ username, _id: { $ne: req.userId } });
      if (taken) return res.status(400).json({ message: 'Username already taken' });
      updates.username = username;
    }
    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (website !== undefined) updates.website = website;
    if (location !== undefined) updates.location = location;

    // Email change
    if (email !== undefined && email !== user.email) {
      const taken = await User.findOne({ email, _id: { $ne: req.userId } });
      if (taken) return res.status(400).json({ message: 'Email already in use' });
      updates.email = email.toLowerCase();
    }

    // Password change
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password is required' });
      const match = await require('bcryptjs').compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
      updates.password = await require('bcryptjs').hash(newPassword, 12);
    }

    // Settings object (merge)
    if (settings && typeof settings === 'object') {
      const allowed = ['privateAccount','showOnlineStatus','allowMessagesFrom','notifyLikes','notifyComments','notifyFollows','notifyMessages','accentColor'];
      for (const key of allowed) {
        if (settings[key] !== undefined) updates[`settings.${key}`] = settings[key];
      }
    }

    const updated = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/account  — delete own account
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const match = await require('bcryptjs').compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Incorrect password' });

    await User.findByIdAndDelete(req.userId);
    // Clean up posts, messages, notifications
    await require('../models/Post').deleteMany({ userId: req.userId });
    await require('../models/Message').deleteMany({ $or: [{ senderId: req.userId }, { receiverId: req.userId }] });
    await require('../models/Notification').deleteMany({ $or: [{ userId: req.userId }, { fromUser: req.userId }] });
    // Remove from followers/following
    await User.updateMany({ followers: req.userId }, { $pull: { followers: req.userId } });
    await User.updateMany({ following: req.userId }, { $pull: { following: req.userId } });

    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/block/:id — block or unblock a user
router.post('/block/:id', auth, async (req, res) => {
  try {
    if (req.params.id === req.userId) return res.status(400).json({ message: "Can't block yourself" });
    const me = await User.findById(req.userId);
    const isBlocked = me.blockedUsers?.includes(req.params.id);
    if (isBlocked) {
      await User.findByIdAndUpdate(req.userId, { $pull: { blockedUsers: req.params.id } });
      return res.json({ blocked: false });
    }
    await User.findByIdAndUpdate(req.userId, { $addToSet: { blockedUsers: req.params.id } });
    await User.findByIdAndUpdate(req.userId, { $pull: { following: req.params.id } });
    await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.userId } });
    res.json({ blocked: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/blocked — get blocked users list
router.get('/blocked', auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).populate('blockedUsers', 'username profilePicture');
    res.json(me.blockedUsers || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
