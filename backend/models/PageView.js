const mongoose = require('mongoose');

const pageViewSchema = new mongoose.Schema({
  path:        { type: String, required: true },
  ip:          { type: String },           // hashed for privacy
  rawIp:       { type: String },           // real IP for geo lookup, not stored long-term
  userAgent:   { type: String },
  device:      { type: String, enum: ['desktop', 'mobile', 'tablet'], default: 'desktop' },
  country:     { type: String, default: '' },
  countryCode: { type: String, default: '' },
  city:        { type: String, default: '' },
  lat:         { type: Number, default: null },
  lon:         { type: Number, default: null },
  createdAt:   { type: Date, default: Date.now, index: true },
});

// Auto-expire after 90 days
pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('PageView', pageViewSchema);
