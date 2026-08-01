const mongoose = require("mongoose");

/**
 * Assessment Blueprint Assignment Schema (Phase 4.1 — Refinement 2)
 * Decouples direct blueprint attachment from subcategory records.
 * Establishes the canonical runtime hierarchy:
 * Category -> Subcategory -> Assessment Configuration -> Blueprint Assignment -> Blueprint -> Blueprint Version.
 * Supports associating multiple specialized blueprints per assessment domain (e.g. by assessment modality or priority weighting).
 */
const blueprintMappingSchema = new mongoose.Schema(
  {
    blueprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentAIBlueprint",
      required: true
    },
    priority: {
      type: Number,
      default: 1,
      min: 1
    },
    assessmentType: {
      type: String,
      enum: ["All", "MCQ", "Coding", "Mixed", "AI Viva", "Subjective"],
      default: "All"
    },
    weightPercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ["Active", "Paused", "Deprecated"],
      default: "Active"
    }
  },
  { _id: true }
);

const assessmentBlueprintAssignmentSchema = new mongoose.Schema(
  {
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSubcategory",
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentCategory",
      index: true
    },
    configId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentConfig",
      index: true
    },
    isGlobalDefault: {
      type: Boolean,
      default: false,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "Assignment routing policy linking configurations to versioned prompt blueprints."
    },
    assignedBlueprints: [blueprintMappingSchema],
    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Active",
      index: true
    },
    createdBy: {
      type: String,
      default: "System Architecture"
    },
    updatedBy: {
      type: String,
      default: "System Architecture"
    }
  },
  { timestamps: true }
);

// Ensure query optimization for resolving assignment by domain
assessmentBlueprintAssignmentSchema.index({ subcategoryId: 1, status: 1 });
assessmentBlueprintAssignmentSchema.index({ isGlobalDefault: 1, status: 1 });

module.exports = mongoose.model("AssessmentBlueprintAssignment", assessmentBlueprintAssignmentSchema);
