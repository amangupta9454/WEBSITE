const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      default: '',
      trim: true,
    },
    college: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      default: 'Team Member',
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: true }
);

const evaluationSchema = new mongoose.Schema(
  {
    judgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    judgeName: {
      type: String,
      default: '',
    },
    judgeEmail: {
      type: String,
      default: '',
    },
    scores: {
      innovation: { type: Number, default: 0, min: 0, max: 25 },
      technical: { type: Number, default: 0, min: 0, max: 25 },
      design: { type: Number, default: 0, min: 0, max: 25 },
      impact: { type: Number, default: 0, min: 0, max: 25 },
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      default: '',
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const hackathonTeamSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: String,
      default: 'can-hackathon-2026',
      trim: true,
      index: true,
    },
    teamId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    unstopApplicationId: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    track: {
      type: String,
      default: 'General Track',
      trim: true,
    },
    leader: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true, index: true },
      mobile: { type: String, default: '', trim: true },
      college: { type: String, default: '', trim: true },
      state: { type: String, default: '', trim: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    members: [memberSchema],
    initialIdea: {
      title: { type: String, default: '', trim: true },
      description: { type: String, default: '' },
      problemStatement: { type: String, default: '' },
      proposedSolution: { type: String, default: '' },
      techStack: { type: [String], default: [] },
      pptUrl: { type: String, default: '', trim: true },
      theme: { type: String, default: '', trim: true },
    },
    submittedLinks: {
      githubUrl: { type: String, default: '', trim: true },
      hostedProjectUrl: { type: String, default: '', trim: true },
      linkedInUrl: { type: String, default: '', trim: true },
      demoVideoUrl: { type: String, default: '', trim: true },
      otherLinks: { type: [String], default: [] },
    },
    rawUnstopData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: [
        'IMPORTED',
        'UNDER_REVIEW',
        'SHORTLISTED',
        'REJECTED',
        'PAYMENT_PENDING',
        'CONFIRMED',
        'SUBMISSION_PENDING',
        'SUBMITTED',
        'UNDER_EVALUATION',
        'EVALUATED',
        'RESULT_PUBLISHED',
        'CERTIFICATE_AVAILABLE',
      ],
      default: 'IMPORTED',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'NOT_REQUIRED',
      index: true,
    },
    paymentDetails: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      orderId: { type: String, default: '' },
      paymentId: { type: String, default: '' },
      paidAt: { type: Date, default: null },
      paymentMethod: { type: String, default: '' },
    },
    shortlistedAt: {
      type: Date,
      default: null,
    },
    shortlistEmailSent: {
      type: Boolean,
      default: false,
    },
    shortlistEmailSentAt: {
      type: Date,
      default: null,
    },
    shortlistEmailStatus: {
      type: String,
      enum: ['NOT_SENT', 'SENT', 'FAILED'],
      default: 'NOT_SENT',
      index: true,
    },
    shortlistEmailError: {
      type: String,
      default: '',
    },
    confirmedAt: {
      type: Date,
      default: null,
      index: true,
    },
    confirmationSource: {
      type: String,
      default: 'PAYMENT',
    },
    adminReview: {
      reviewedBy: { type: String, default: '' },
      reviewedAt: { type: Date, default: null },
      notes: { type: String, default: '' },
      scores: {
        innovation: { type: Number, min: 0, max: 10, default: null },
        ideaQuality: { type: Number, min: 0, max: 10, default: null },
        feasibility: { type: Number, min: 0, max: 10, default: null },
        presentation: { type: Number, min: 0, max: 10, default: null },
      },
      totalScore: { type: Number, default: null },
      tags: { type: [String], default: [] },
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: String,
      default: '',
    },
    finalSubmission: {
      projectTitle: { type: String, default: '', trim: true },
      description: { type: String, default: '' },
      githubUrl: { type: String, default: '', trim: true },
      liveDemoUrl: { type: String, default: '', trim: true },
      videoDemoUrl: { type: String, default: '', trim: true },
      techStack: { type: [String], default: [] },
      submittedAt: { type: Date, default: null },
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HackathonSubmission',
      default: null,
      index: true,
    },
    assignedJudges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    evaluations: [evaluationSchema],
    finalAverageScore: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: null,
    },
    source: {
      type: String,
      default: 'UNSTOP_IMPORT',
      enum: ['UNSTOP_IMPORT', 'MANUAL_ADMIN', 'DIRECT_REGISTRATION'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup of member email
hackathonTeamSchema.index({ 'members.email': 1 });

module.exports = mongoose.model('HackathonTeam', hackathonTeamSchema);
