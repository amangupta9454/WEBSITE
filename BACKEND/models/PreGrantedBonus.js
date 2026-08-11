const mongoose = require("mongoose");

const preGrantedBonusSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    freeResumesGranted: {
      type: Number,
      default: 0,
    },
    freeDownloadsPerResume: {
      type: Number,
      default: 0,
    },
    jobPortalPremiumDays: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PreGrantedBonus", preGrantedBonusSchema);
