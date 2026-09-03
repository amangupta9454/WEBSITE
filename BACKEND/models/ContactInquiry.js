const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    default: () => Math.random().toString(36).substring(2, 11),
  },
  sender: {
    type: String,
    enum: ['client', 'admin'],
    required: true,
  },
  senderName: {
    type: String,
    default: '',
  },
  senderEmail: {
    type: String,
    default: '',
  },
  subject: {
    type: String,
    default: '',
  },
  body: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  deliveryStatus: {
    type: String,
    enum: ['Delivered', 'Sent', 'Received', 'Failed'],
    default: 'Sent',
  },
  source: {
    type: String,
    enum: ['web_form', 'admin_panel', 'imap_sync', 'manual_log'],
    default: 'admin_panel',
  },
});

const contactInquirySchema = new mongoose.Schema({
  ticketId: {
    type: Number,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  issueType: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'In Progress', 'In Review', 'Resolved', 'Closed'],
    default: 'New',
    index: true,
  },
  adminNotes: {
    type: String,
    default: '',
  },
  contactedAt: {
    type: Date,
  },
  contactedBy: {
    type: String,
    default: '',
  },
  resolvedAt: {
    type: Date,
  },
  messages: {
    type: [messageSchema],
    default: [],
  },
  emailSentToAdmin: {
    type: Boolean,
    default: false,
  },
  emailSentToUser: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('ContactInquiry', contactInquirySchema);
