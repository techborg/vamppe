const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image:    { type: String, required: true },
  caption:  { type: String, default: '' },
  viewers:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt:{ type: Date, required: true },
}, { timestamps: true });

// Auto-expire after 24h
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);
