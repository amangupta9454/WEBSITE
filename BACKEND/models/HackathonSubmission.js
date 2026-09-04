const mongoose = require('mongoose');

const hackathonSubmissionSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: String,
      default: 'can-hackathon-2026',
      index: true,
      trim: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HackathonTeam',
      required: true,
      index: true,
    },
    teamId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submitterEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    submitterName: {
      type: String,
      default: '',
      trim: true,
    },
    projectName: {
      type: String,
      trim: true,
      default: '',
    },
    projectDescription: {
      type: String,
      default: '',
    },
    problemStatement: {
      type: String,
      default: '',
    },
    proposedSolution: {
      type: String,
      default: '',
    },
    techStack: {
      type: [String],
      default: [],
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    hostedProjectUrl: {
      type: String,
      trim: true,
      default: '',
    },
    linkedInUrl: {
      type: String,
      trim: true,
      default: '',
    },
    demoVideoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    otherLinks: {
      type: [String],
      default: [],
    },
    additionalNotes: {
      type: String,
      default: '',
    },
    additionalFiles: [
      {
        fileName: { type: String, default: '' },
        fileUrl: { type: String, default: '' },
        fileType: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['NOT_STARTED', 'DRAFT', 'SUBMITTED', 'LOCKED'],
      default: 'NOT_STARTED',
      index: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    draftSavedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for judging assignment and submission statistics lookups
hackathonSubmissionSchema.index({ hackathonId: 1, status: 1 });
hackathonSubmissionSchema.index({ hackathonId: 1, isLocked: 1 });
hackathonSubmissionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('HackathonSubmission', hackathonSubmissionSchema);
