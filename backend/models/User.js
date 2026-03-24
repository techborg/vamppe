const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    displayName: { type: String, default: '' },
    bio: { type: String, default: '' },
    website: { type: String, default: '' },
    location: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    coverPicture: { type: String, default: '' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    verified: { type: Boolean, default: false },
    verifiedType: { type: String, enum: ['none', 'blue', 'gold', 'purple', 'red'], default: 'none' },
    isAdmin: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, default: null },
    emailVerifyExpires: { type: Date, default: null },
    verificationRequest: {
      status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
      fullName: { type: String, default: '' },
      category: { type: String, default: '' },
      reason: { type: String, default: '' },
      links: { type: String, default: '' },
      submittedAt: { type: Date },
      reviewedAt: { type: Date },
      rejectionReason: { type: String, default: '' },
    },
    settings: {
      // Privacy
      privateAccount:       { type: Boolean, default: false },
      showOnlineStatus:     { type: Boolean, default: true  },
      allowMessagesFrom:    { type: String, enum: ['everyone', 'following', 'none'], default: 'everyone' },
      // Notifications
      notifyLikes:          { type: Boolean, default: true  },
      notifyComments:       { type: Boolean, default: true  },
      notifyFollows:        { type: Boolean, default: true  },
      notifyMessages:       { type: Boolean, default: true  },
      // Appearance
      accentColor:          { type: String, default: 'orange' }, // orange | violet | rose | cyan
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
