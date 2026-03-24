const router = require('express').Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { checkBanned } = require('../middleware/security');

// POST /api/messages/send
router.post('/send', auth, checkBanned, async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    if (!receiverId || !message)
      return res.status(400).json({ message: 'receiverId and message are required' });

    const msg = await Message.create({ senderId: req.userId, receiverId, message });
    const populated = await msg.populate('senderId', 'username profilePicture');

    // Targeted delivery — only emit to the receiver's socket
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const receiverSocketId = onlineUsers?.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', populated.toObject());
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/history/:userId
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.userId, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.userId },
      ],
    })
      .populate('senderId', 'username profilePicture')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.userId }, { receiverId: req.userId }],
    }).sort({ createdAt: -1 });

    const seen = new Set();
    const conversations = [];

    for (const msg of messages) {
      const otherId =
        msg.senderId.toString() === req.userId
          ? msg.receiverId.toString()
          : msg.senderId.toString();
      if (!seen.has(otherId)) {
        seen.add(otherId);
        const user = await User.findById(otherId).select('username profilePicture');
        conversations.push({ user, lastMessage: msg });
      }
    }
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/unread-count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiverId: req.userId, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
