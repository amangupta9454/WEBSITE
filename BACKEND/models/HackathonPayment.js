const mongoose = require('mongoose');

const hackathonPaymentSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: String,
      default: 'CAN-HACK-2026',
      index: true,
    },
    teamId: {
      type: String,
      required: true,
      index: true,
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    leaderEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true, // in INR
    },
    currency: {
      type: String,
      default: 'INR',
    },
    gateway: {
      type: String,
      default: 'RAZORPAY',
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentId: {
      type: String,
      default: '',
      index: true,
    },
    signature: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: '',
    },
    webhookReceived: {
      type: Boolean,
      default: false,
    },
    webhookPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HackathonPayment', hackathonPaymentSchema);
