const mongoose = require("mongoose");

const assessmentLeaderboardSchema = new mongoose.Schema(
  {
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSubcategory",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bestScore:      { type: Number, default: 0 },
    bestPercentage: { type: Number, default: 0 },
    attempts:       { type: Number, default: 0 },
    passedCount:    { type: Number, default: 0 },
    rank:           { type: Number, default: null },
    lastAttemptAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

// Composite unique: one leaderboard entry per user per subcategory
assessmentLeaderboardSchema.index({ subcategoryId: 1, userId: 1 }, { unique: true });
assessmentLeaderboardSchema.index({ subcategoryId: 1, bestPercentage: -1 });

module.exports = mongoose.model("AssessmentLeaderboard", assessmentLeaderboardSchema);
