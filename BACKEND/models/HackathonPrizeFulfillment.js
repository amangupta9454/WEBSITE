const mongoose = require('mongoose');

const hackathonPrizeFulfillmentSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: String,
      default: 'can-hackathon-2026',
      index: true,
    },
    fulfillmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    prizeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HackathonPrize',
      required: true,
      index: true,
    },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HackathonResult',
      required: true,
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
    recipient: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      mobile: { type: String, default: '' },
      college: { type: String, default: '' },
    },
    fulfillmentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'VOUCHER', 'PRODUCT', 'INTERNSHIP', 'OTHER'],
      default: 'BANK_TRANSFER',
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFICATION_REQUIRED', 'PROCESSING', 'FULFILLED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    transactionReference: {
      type: String,
      default: '',
      select: false, // Sensitive payment transaction / UTR info (Admin-only)
    },
    voucherCodeMasked: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    emailNotified: {
      type: Boolean,
      default: false,
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

hackathonPrizeFulfillmentSchema.index({ hackathonId: 1, teamId: 1, prizeId: 1 }, { unique: true });
hackathonPrizeFulfillmentSchema.index({ hackathonId: 1, status: 1 });
hackathonPrizeFulfillmentSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.HackathonPrizeFulfillment ||
  mongoose.model('HackathonPrizeFulfillment', hackathonPrizeFulfillmentSchema);
