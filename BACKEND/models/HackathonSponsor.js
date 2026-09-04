const mongoose = require('mongoose');

const hackathonSponsorSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: String,
      default: 'can-hackathon-2026',
      index: true,
    },
    sponsorId: {
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
    logoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    websiteUrl: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    tier: {
      type: String,
      enum: ['TITLE', 'PLATINUM', 'GOLD', 'SILVER', 'COMMUNITY'],
      default: 'COMMUNITY',
      index: true,
    },
    contactName: {
      type: String,
      default: '',
      select: false, // Private admin-only contact details
    },
    contactEmail: {
      type: String,
      default: '',
      select: false, // Private admin-only contact details
    },
    contactPhone: {
      type: String,
      default: '',
      select: false, // Private admin-only contact details
    },
    benefits: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
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

hackathonSponsorSchema.index({ hackathonId: 1, active: 1, displayOrder: 1 });

module.exports =
  mongoose.models.HackathonSponsor ||
  mongoose.model('HackathonSponsor', hackathonSponsorSchema);
