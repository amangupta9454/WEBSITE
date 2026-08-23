const mongoose = require('mongoose');

const uniqueIpSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstSeenAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UniqueIP', uniqueIpSchema);
