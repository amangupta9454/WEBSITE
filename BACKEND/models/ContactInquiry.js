const mongoose = require('mongoose');

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
