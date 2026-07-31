const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    createdBy: {
      type: String,
      default: "admin",
    },
    targetEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    featureTarget: {
      type: String,
      default: "General",
      enum: ["General", "Internship", "AI Resume", "AI Interview", "Job Portal", "Custom"],
    },
    notes: {
      type: String,
      default: "",
    },
    clicks: {
      type: Number,
      default: 0,
    },
    usesCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Referral", referralSchema);
