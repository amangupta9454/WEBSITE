const mongoose = require("mongoose");

const difficultyDistributionSchema = new mongoose.Schema(
  {
    easy:   { type: Number, default: 5 },
    medium: { type: Number, default: 8 },
    hard:   { type: Number, default: 5 },
    expert: { type: Number, default: 2 },
  },
  { _id: false }
);

const inventoryTargetSchema = new mongoose.Schema(
  {
    easy:   { type: Number, default: 200 },
    medium: { type: Number, default: 300 },
    hard:   { type: Number, default: 150 },
    expert: { type: Number, default: 50  },
  },
  { _id: false }
);

const assessmentConfigSchema = new mongoose.Schema(
  {
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSubcategory",
      required: true,
      unique: true,
      index: true,
    },
    totalQuestions:         { type: Number, default: 20, min: 5, max: 200 },
    passingPercentage:      { type: Number, default: 60, min: 1, max: 100 },
    timeLimitMinutes:       { type: Number, default: 30, min: 5, max: 180 },
    difficultyDistribution: { type: difficultyDistributionSchema, default: () => ({}) },
    assessmentType: {
      type: String,
      enum: ["MCQ", "Coding", "Mixed", "AIViva", "Subjective"],
      default: "MCQ",
    },
    aiFirst:              { type: Boolean, default: true },
    aiTimeoutSeconds:     { type: Number, default: 7, min: 3, max: 30 },
    batchSize:            { type: Number, default: 5, min: 1, max: 20 },
    certificateEnabled:   { type: Boolean, default: true },
    isActive:             { type: Boolean, default: true },
    inventoryTarget:      { type: inventoryTargetSchema, default: () => ({}) },
    lowInventoryThreshold:{ type: Number, default: 20 }, // Alert when below this
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssessmentConfig", assessmentConfigSchema);
