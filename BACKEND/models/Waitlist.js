const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  createdAt: { type: Date, default: Date.now }
});

// Prevent duplicate emails
waitlistSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Waitlist', waitlistSchema);
