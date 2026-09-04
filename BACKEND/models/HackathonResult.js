const mongoose = require('mongoose');

const scoreSnapshotItemSchema = new mongoose.Schema(
  {
    judgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HackathonEditorialMember',
    },
    judgeName: { type: String, default: '' },
    judgeEmail: { type: String, default: '' },
    criteriaScores: [
      {
        criterionId: { type: String, default: '' },
        criterionName: { type: String, default: '' },
        score: { type: Number, default: 0 },
        maxScore: { type: Number, default: 25 },
      },
    ],
    totalScore: { type: Number, default: 0 },
    comments: { type: String, default: '' },
    finalizedAt: { type: Date, default: null },
  },
  { _id: false }
);

const historyItemSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    actor: { type: String, default: 'admin' },
    timestamp: { type: Date, default: Date.now },
    previousState: { type: mongoose.Schema.Types.Mixed, default: null },
    newState: { type: mongoose.Schema.Types.Mixed, default: null },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const hackathonResultSchema = new mongoose.Schema(
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
      trim: true,
      uppercase: true,
      index: true,
    },
    teamName: {
      type: String,
      default: '',
    },
    track: {
      type: String,
      default: 'General Track',
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HackathonSubmission',
      default: null,
    },
    rank: {
      type: Number,
      default: null,
      index: true,
    },
    finalScore: {
      type: Number,
      default: 0,
      index: true,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    judgeCount: {
      type: Number,
      default: 0,
    },
    finalizedJudgeCount: {
      type: Number,
      default: 0,
    },
    pendingJudgeCount: {
      type: Number,
      default: 0,
    },
    rankingStatus: {
      type: String,
      enum: ['READY', 'PENDING_EVALUATIONS', 'INELIGIBLE', 'DISQUALIFIED', 'TIE'],
      default: 'READY',
      index: true,
    },
    statusReason: {
      type: String,
      default: '',
    },
    resultStatus: {
      type: String,
      enum: ['DRAFT', 'CALCULATED', 'APPROVED', 'PUBLISHED', 'LOCKED'],
      default: 'DRAFT',
      index: true,
    },
    category: {
      type: String,
      default: null,
      index: true,
    },
    prize: {
      type: String,
      default: null,
    },
    isWinner: {
      type: Boolean,
      default: false,
      index: true,
    },
    isRunnerUp: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    tieDetails: {
      isTie: { type: Boolean, default: false },
      tiedWithTeamIds: { type: [String], default: [] },
      resolvedBy: { type: String, default: null },
      resolvedAt: { type: Date, default: null },
      tieBreakReason: { type: String, default: '' },
      tieMethod: { type: String, default: '' },
    },
    approvedBy: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      type: String,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    lockedBy: {
      type: String,
      default: null,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    lockReason: {
      type: String,
      default: '',
    },
    reopenedBy: {
      type: String,
      default: null,
    },
    reopenedAt: {
      type: Date,
      default: null,
    },
    reopenReason: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    scoreSnapshot: [scoreSnapshotItemSchema],
    rankingSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    history: [historyItemSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for uniqueness per hackathon and team
hackathonResultSchema.index({ hackathonId: 1, teamId: 1 }, { unique: true });
hackathonResultSchema.index({ hackathonId: 1, rank: 1 });
hackathonResultSchema.index({ hackathonId: 1, resultStatus: 1, isPublished: 1 });

module.exports = mongoose.model('HackathonResult', hackathonResultSchema);
