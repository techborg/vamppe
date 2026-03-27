const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message:    { type: String, required: true },
    read:       { type: Boolean, default: false },
    readAt:     { type: Date, default: null },
    reaction:   { type: String, default: '' }, // emoji reaction on message
    deleted:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
