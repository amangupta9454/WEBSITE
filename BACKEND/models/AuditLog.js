const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional, in case of anonymous actions or system events
  },
  userEmail: {
    type: String,
    required: false
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Can store any JSON object
    default: {}
  },
  ipAddress: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // TTL index: 7 days (7 * 24 * 60 * 60 seconds)
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
