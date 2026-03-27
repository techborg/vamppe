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
    if (receiverId === req.userId)
      return res.status(400).json({ message: "You can't message yourself" });
    const receiver = await User.findById(receiverId).select('_id');
    if (!receiver) return res.status(404).json({ message: 'Recipient not found' });

    const msg = await Message.create({ senderId: req.userId, receiverId, message });
    const populated = await msg.populate('senderId', 'username profilePicture');

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
      deleted: { $ne: true },
    })
      .populate('senderId', 'username profilePicture')
      .sort({ createdAt: 1 });

    // Mark received messages as read
    await Message.updateMany(
      { senderId: req.params.userId, receiverId: req.userId, read: false },
      { read: true, readAt: new Date() }
    );

    // Emit read receipt to sender
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const senderSocket = onlineUsers?.get(req.params.userId);
    if (senderSocket) io.to(senderSocket).emit('messages_read', { by: req.userId });

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
      const otherId = msg.senderId.toString() === req.userId
        ? msg.receiverId.toString()
        : msg.senderId.toString();
      if (!seen.has(otherId)) {
        seen.add(otherId);
        const user = await User.findById(otherId).select('username profilePicture verified verifiedType');
        const unread = await Message.countDocuments({ senderId: otherId, receiverId: req.userId, read: false });
        conversations.push({ user, lastMessage: msg, unread });
      }
    }
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages/react/:id — react to a message
router.post('/react/:id', auth, async (req, res) => {
  try {
    const { reaction } = req.body;
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.receiverId.toString() !== req.userId && msg.senderId.toString() !== req.userId)
      return res.status(403).json({ message: 'Forbidden' });

    msg.reaction = msg.reaction === reaction ? '' : reaction;
    await msg.save();

    // Notify the other party
    const otherId = msg.senderId.toString() === req.userId
      ? msg.receiverId.toString()
      : msg.senderId.toString();
    const io = req.app.get('io');
    const sid = req.app.get('onlineUsers')?.get(otherId);
    if (sid) io.to(sid).emit('message_reaction', { messageId: msg._id, reaction: msg.reaction });

    res.json({ reaction: msg.reaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/messages/:id — delete own message
router.delete('/:id', auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (msg.senderId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
    msg.deleted = true;
    msg.message = 'This message was deleted';
    await msg.save();
    res.json({ deleted: true });
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
