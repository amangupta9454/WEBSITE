const mongoose = require('mongoose');

const candidateMatchSchema = new mongoose.Schema(
  {
    teamId: {
      type: String,
      required: true,
      trim: true,
    },
    teamName: {
      type: String,
      default: '',
      trim: true,
    },
    leaderName: {
      type: String,
      default: '',
      trim: true,
    },
    leaderEmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    matchSignals: {
      exactLeaderEmailMatch: { type: Boolean, default: false },
      memberOverlapCount: { type: Number, default: 0 },
      totalIncomingMembers: { type: Number, default: 0 },
      totalExistingMembers: { type: Number, default: 0 },
      overlapRatio: { type: Number, default: 0 },
      sameTeamName: { type: Boolean, default: false },
    },
    matchScore: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const hackathonDuplicateQueueSchema = new mongoose.Schema(
  {
    queueId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    hackathonId: {
      type: String,
      default: 'can-hackathon-2026',
      index: true,
      trim: true,
    },
    incomingSource: {
      type: String,
      enum: ['WEBSITE', 'UNSTOP', 'MANUAL'],
      required: true,
      index: true,
    },
    incomingSourceId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    incomingRecord: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    candidateMatches: [candidateMatchSchema],
    confidence: {
      type: String,
      enum: ['AMBIGUOUS', 'UNCERTAIN', 'SUSPECTED_DUPLICATE'],
      default: 'AMBIGUOUS',
    },
    status: {
      type: String,
      enum: ['PENDING', 'MERGED', 'KEPT_SEPARATE', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    resolution: {
      action: {
        type: String,
        enum: ['MERGE', 'KEEP_SEPARATE', 'REJECT', null],
        default: null,
      },
      targetTeamId: {
        type: String,
        default: '',
      },
      resolvedBy: {
        id: { type: String, default: '' },
        name: { type: String, default: '' },
        email: { type: String, default: '' },
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
      notes: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

hackathonDuplicateQueueSchema.index({ status: 1, createdAt: -1 });
hackathonDuplicateQueueSchema.index({ incomingSourceId: 1, status: 1 });

module.exports = mongoose.model('HackathonDuplicateQueue', hackathonDuplicateQueueSchema);
