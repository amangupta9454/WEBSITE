const mongoose = require('mongoose');

const appliedJobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  status: {
    type: String,
    default: 'Applied'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// A user can mark a specific job as applied only once
appliedJobSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('AppliedJob', appliedJobSchema);
