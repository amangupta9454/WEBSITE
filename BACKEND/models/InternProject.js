const mongoose = require('mongoose');

const internProjectSchema = new mongoose.Schema(
  {
    internId: { type: mongoose.Schema.Types.ObjectId, required: true }, // References internship ID
    studentId: { type: String, required: true },
    monthNumber: { type: Number, required: true },
    projectNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    resources: { type: String },
    githubRepo: { type: String },
    submission: {
      githubLink: { type: String },
      liveLink: { type: String },
      files: [{ type: String }],
      remarks: { type: String }
    },
    feedback: { type: String },
    marks: { type: Number },
    status: {
      type: String,
      enum: ['Available', 'Submitted', 'Under Review', 'Approved', 'Rejected'],
      default: 'Available'
    },
    visibleFrom: { type: Date, required: true },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    reviewedBy: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('InternProject', internProjectSchema);
