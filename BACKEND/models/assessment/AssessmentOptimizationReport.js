const mongoose = require("mongoose");

/**
 * Component 13: Knowledge Optimizer
 * Stores non-destructive diagnostic optimization reports covering duplicates, low quality items,
 * deprecated schemas, blueprint drift, and metadata inconsistencies.
 */
const assessmentOptimizationReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    scanDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["In Progress", "Completed", "Failed"],
      default: "Completed",
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    duplicateScan: {
      totalScanned: { type: Number, default: 0 },
      duplicatesFound: { type: Number, default: 0 },
      flaggedItems: [
        {
          questionId: String,
          stem: String,
          matchType: String, // e.g. "Exact Hash Match", "Semantic Similarity (94%)"
          duplicateOfId: String,
        },
      ],
    },
    lowQualityScan: {
      totalScanned: { type: Number, default: 0 },
      lowQualityFound: { type: Number, default: 0 },
      flaggedItems: [
        {
          questionId: String,
          stem: String,
          score: Number,
          issue: String, // e.g. "Distractor redundancy", "Explanation missing depth"
        },
      ],
    },
    deprecatedScan: {
      totalScanned: { type: Number, default: 0 },
      deprecatedFound: { type: Number, default: 0 },
      flaggedItems: [
        {
          questionId: String,
          stem: String,
          schemaVersion: String,
          recommendation: String,
        },
      ],
    },
    blueprintDriftScan: {
      totalScanned: { type: Number, default: 0 },
      driftFound: { type: Number, default: 0 },
      flaggedItems: [
        {
          questionId: String,
          stem: String,
          questionBlueprintVersion: Number,
          activeBlueprintVersion: Number,
        },
      ],
    },
    metadataConsistency: {
      totalScanned: { type: Number, default: 0 },
      inconsistenciesFound: { type: Number, default: 0 },
      flaggedItems: [
        {
          questionId: String,
          stem: String,
          missingField: String,
        },
      ],
    },
  },
  { timestamps: true }
);

assessmentOptimizationReportSchema.index({ scanDate: -1 });

module.exports = mongoose.model("AssessmentOptimizationReport", assessmentOptimizationReportSchema);
