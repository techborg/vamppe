const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:   { type: String, required: true },
    likes:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const pollOptionSchema = new mongoose.Schema({
  text:  { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const postSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content:  { type: String, default: '' },
    image:    { type: String, default: '' },
    hashtags: [{ type: String }],
    likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: {
      heart:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      fire:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      laugh:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      sad:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      wow:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      angry:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    comments: [commentSchema],
    poll: {
      question: { type: String, default: '' },
      options:  [pollOptionSchema],
      endsAt:   { type: Date },
    },
    pinned:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index hashtags for fast trending queries
postSchema.index({ hashtags: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
