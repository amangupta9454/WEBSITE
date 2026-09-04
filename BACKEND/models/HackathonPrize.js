const mongoose = require('mongoose');

const hackathonPrizeSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: String,
      default: 'can-hackathon-2026',
      index: true,
    },
    prizeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HackathonSponsor',
      default: null,
      index: true,
    },
    sponsorNameSnapshot: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      default: 1,
    },
    eligibility: {
      type: String,
      default: '',
    },
    trackRestriction: {
      type: String,
      default: 'ALL', // 'ALL' or specific track name
    },
    rankRestriction: {
      type: Number,
      default: null, // e.g. 1 for winner, 2 for 1st runner up, etc.
    },
    fulfillmentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'VOUCHER', 'PRODUCT', 'INTERNSHIP', 'OTHER'],
      default: 'BANK_TRANSFER',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FULFILLED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

hackathonPrizeSchema.index({ hackathonId: 1, status: 1, category: 1 });

module.exports =
  mongoose.models.HackathonPrize ||
  mongoose.model('HackathonPrize', hackathonPrizeSchema);
