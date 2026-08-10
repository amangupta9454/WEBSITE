const mongoose = require("mongoose");

/**
 * Question Count Distribution Schema (Refinement 2)
 * Stores exact number of questions per tier instead of percentages.
 * Percentages are automatically computed by backend virtuals and methods.
 */
const difficultyDistributionSchema = new mongoose.Schema(
  {
    easy:   { type: Number, default: 6, min: 0, max: 200 },
    medium: { type: Number, default: 8, min: 0, max: 200 },
    hard:   { type: Number, default: 4, min: 0, max: 200 },
    expert: { type: Number, default: 2, min: 0, max: 200 },
  },
  { _id: false }
);

const inventoryTargetSchema = new mongoose.Schema(
  {
    easy:   { type: Number, default: 30, min: 0 },
    medium: { type: Number, default: 40, min: 0 },
    hard:   { type: Number, default: 20, min: 0 },
    expert: { type: Number, default: 10, min: 0 },
  },
  { _id: false }
);

/**
 * Configuration Version History Schema (Refinement 8)
 * Archives previous parameter sets for rollback auditing and traceability.
 */
const versionHistorySchema = new mongoose.Schema(
  {
    version:   { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String, default: "admin" },
    summary:   { type: String, required: true },
    snapshot:  { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const assessmentConfigSchema = new mongoose.Schema(
  {
    // Scope Hierarchy: global -> category -> subcategory (Refinement 3)
    scope: {
      type: String,
      enum: ["global", "category", "subcategory"],
      default: "subcategory",
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentCategory",
      required: false,
      index: true,
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSubcategory",
      required: false,
      index: true,
    },

    // Core Operational Limits & Cutoffs
    totalQuestions:         { type: Number, default: 20, min: 5, max: 200 },
    passingPercentage:      { type: Number, default: 75, min: 1, max: 100 }, // Refinement 1: default 75%
    timeLimitMinutes:       { type: Number, default: 20, min: 5, max: 180 },
    questionTimerSeconds:   { type: Number, default: 60, min: 0 },
    difficultyDistribution: { type: difficultyDistributionSchema, default: () => ({}) },

    // Modality (Refinement 5: Cleaned Enums)
    assessmentType: {
      type: String,
      enum: ["MCQ", "Coding", "Mixed", "AI Viva", "Subjective"],
      default: "MCQ",
    },

    // AI-First Architecture & Timers (Refinement 4)
    aiFirst:          { type: Boolean, default: true },
    aiTimeoutSeconds: { type: Number, default: 7, min: 3, max: 30 },
    batchSize:        { type: Number, default: 5, min: 1, max: 20 },

    // Advanced Production-Ready Settings (Refinement 6)
    allowRetake:           { type: Boolean, default: true },
    cooldownHours:         { type: Number, default: 24, min: 0, max: 720 },
    maximumAttempts:       { type: Number, default: 3, min: 1, max: 50 },
    shuffleQuestions:      { type: Boolean, default: true },
    shuffleOptions:        { type: Boolean, default: true },
    autoSubmit:            { type: Boolean, default: true },
    negativeMarking:       { type: Boolean, default: false },
    certificateEnabled:    { type: Boolean, default: true },
    leaderboardEnabled:    { type: Boolean, default: true },
    aiFeedbackEnabled:     { type: Boolean, default: true },
    fullscreenRequired:    { type: Boolean, default: true },
    maximumTabSwitches:    { type: Number, default: 3, min: 0, max: 20 },
    showResultImmediately: { type: Boolean, default: true },
    visibility:            { type: String, enum: ["Public", "Private"], default: "Public" },

    // Operational Governance & Inventory
    isActive:              { type: Boolean, default: true },
    inventoryTarget:       { type: inventoryTargetSchema, default: () => ({}) },
    lowInventoryThreshold: { type: Number, default: 20 },

    // Version History & Rollback Architecture (Refinement 8)
    currentVersion: { type: Number, default: 1 },
    versionHistory: { type: [versionHistorySchema], default: () => [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Computed Virtual: Difficulty Percentages (Refinement 2)
 * Dynamically computes explicit percentages from exact question count shares.
 */
assessmentConfigSchema.virtual("difficultyPercentages").get(function () {
  const total = Number(this.totalQuestions) || 0;
  if (total <= 0) return { easy: 0, medium: 0, hard: 0, expert: 0 };
  const diff = this.difficultyDistribution || {};
  return {
    easy:   Number(((Number(diff.easy || 0)   / total) * 100).toFixed(1)),
    medium: Number(((Number(diff.medium || 0) / total) * 100).toFixed(1)),
    hard:   Number(((Number(diff.hard || 0)   / total) * 100).toFixed(1)),
    expert: Number(((Number(diff.expert || 0) / total) * 100).toFixed(1)),
  };
});

module.exports = mongoose.model("AssessmentConfig", assessmentConfigSchema);
