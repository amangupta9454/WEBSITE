const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, default: 'attachment' },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: 'application/octet-stream' },
    url: { type: String, default: '' },
    content: { type: String, default: '' }, // Optional base64 content or summary text if small
  },
  { _id: false }
);

const emailLogSchema = new mongoose.Schema(
  {
    senderEmail: {
      type: String,
      default: 'Unknown',
      trim: true,
      lowercase: true,
      index: true,
    },
    recipientName: {
      type: String,
      default: '',
      trim: true,
    },
    recipientEmail: {
      type: String,
      required: [true, 'Recipient email address is required for logging'],
      trim: true,
      lowercase: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true,
    },
    campaign: {
      type: String,
      default: 'General',
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PENDING'],
      default: 'PENDING',
      index: true,
    },
    messageId: {
      type: String,
      default: null,
      index: true,
    },
    accepted: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    rejected: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    smtpResponse: {
      type: String,
      default: '',
    },
    html: {
      type: String,
      required: [true, 'Complete HTML payload is required'],
    },
    text: {
      type: String,
      default: '',
    },
    attachments: [attachmentSchema],
    source: {
      type: String,
      default: 'Backend API',
      trim: true,
    },
    // Future expansion attributes (open tracking, scheduled dispatches, click metrics)
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    lastOpenedAt: { type: Date, default: null },
    bounced: { type: Boolean, default: false },
    templateId: { type: String, default: null },
    scheduledAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for ultra-fast admin filtering, sorting, and analytical reporting
emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ campaign: 1, createdAt: -1 });
emailLogSchema.index({ recipientEmail: 1, createdAt: -1 });
emailLogSchema.index({ source: 1, createdAt: -1 });

// Performance indexes to accelerate keyword searching without full collection document scans
emailLogSchema.index({ subject: 1 });
emailLogSchema.index({ recipientName: 1 });

module.exports = mongoose.models.EmailLog || mongoose.model('EmailLog', emailLogSchema);
