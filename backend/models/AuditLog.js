const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g., 'approve_verification', 'delete_post'
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetType: { type: String }, // 'User', 'Post', etc.
  details: { type: mongoose.Schema.Types.Mixed }, // JSON of what changed
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
