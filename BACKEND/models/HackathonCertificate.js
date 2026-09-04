const mongoose = require('mongoose');

const hackathonCertificateSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: String,
      default: 'can-hackathon-2026',
      index: true,
    },
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['PARTICIPATION', 'WINNER', 'RUNNER_UP', 'SPECIAL_AWARD', 'FINALIST'],
      index: true,
    },
    teamId: {
      type: String,
      required: true,
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HackathonTeam',
      required: true,
      index: true,
    },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HackathonResult',
      default: null,
      index: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['LEADER', 'MEMBER'],
      default: 'MEMBER',
    },
    recipientCollege: {
      type: String,
      default: '',
    },
    projectName: {
      type: String,
      default: '',
    },
    track: {
      type: String,
      default: 'General',
    },
    award: {
      type: String,
      default: 'Certificate of Participation',
    },
    rank: {
      type: Number,
      default: null,
    },
    score: {
      type: Number,
      default: null,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    verificationUrl: {
      type: String,
      default: '',
    },
    htmlContent: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['GENERATED', 'ISSUED', 'DELIVERED', 'REVOKED'],
      default: 'GENERATED',
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    revocationReason: {
      type: String,
      default: '',
    },
    emailStatus: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date, default: null },
      messageId: { type: String, default: '' },
      error: { type: String, default: '' },
      attempts: { type: Number, default: 0 },
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    version: {
      type: Number,
      default: 1,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for verification lookups, operational filtering, and uniqueness
hackathonCertificateSchema.index(
  { hackathonId: 1, recipientEmail: 1, type: 1, version: 1 },
  { unique: true }
);
hackathonCertificateSchema.index({ hackathonId: 1, status: 1, isRevoked: 1 });
hackathonCertificateSchema.index({ hackathonId: 1, teamId: 1 });
hackathonCertificateSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.HackathonCertificate ||
  mongoose.model('HackathonCertificate', hackathonCertificateSchema);
