// backend/models/ProjectSubmission.js

const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  projectName: { type: String },
  github: { type: String },
  hosted: { type: String },
  aiStatus: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  aiFeedback: { type: String, default: '' },
  spAwarded: { type: Number, default: 0 },
  emailSent: { type: Boolean, default: false }
});

const projectSubmissionSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  domain: { type: String, required: true },
  duration: { type: Number, required: true }, // 1,2,3
  assignments: [assignmentSchema], // Array of up to 3
  month: { type: Number, required: true }, // 1,2,3
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProjectSubmission', projectSubmissionSchema);