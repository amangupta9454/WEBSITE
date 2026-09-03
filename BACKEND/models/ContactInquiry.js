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
    enum: ['New', 'In Review', 'Resolved', 'Closed'],
    default: 'New',
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
  },
});

module.exports = mongoose.model('ContactInquiry', contactInquirySchema);
