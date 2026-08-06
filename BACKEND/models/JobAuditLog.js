const mongoose = require('mongoose');

const jobAuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  email: { type: String, default: 'Anonymous / Guest' },
  ip: { type: String, required: true, default: 'Unknown IP' },
  action: { type: String, required: true }, // e.g., "Visited Job Portal", "Clicked Apply URL", "Saved Job", "Unsaved Job", "Applied to Job"
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: false },
  jobTitle: { type: String, default: '' },
  company: { type: String, default: '' },
  details: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobAuditLog', jobAuditLogSchema);
