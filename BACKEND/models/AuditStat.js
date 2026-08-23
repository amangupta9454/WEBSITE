const mongoose = require('mongoose');

const auditStatSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  count: {
    type: Number,
    default: 0
  }
});

// Compound index to ensure uniqueness per date and action
auditStatSchema.index({ date: 1, action: 1 }, { unique: true });

module.exports = mongoose.model('AuditStat', auditStatSchema);
