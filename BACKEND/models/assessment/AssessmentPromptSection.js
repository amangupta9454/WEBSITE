const mongoose = require("mongoose");

/**
 * Assessment Prompt Section Library Schema (Phase 4.1 — Refinement 8)
 * Reusable architectural blocks for constructing high-precision AI prompts.
 * Eliminates local hardcoded text across multiple blueprints by enabling composition from tested library sections.
 * Built-in examples: System Instruction, Generation Rules, Validation Rules, Output Rules, Context, Examples.
 */
const assessmentPromptSectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    sectionType: {
      type: String,
      enum: ["System Instruction", "Generation Rules", "Validation Rules", "Output Rules", "Context", "Examples", "Custom"],
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    defaultVariablesUsed: [{
      type: String // e.g., ["subcategory", "difficulty", "questionCount"]
    }],
    isSystemDefault: {
      type: Boolean,
      default: false,
      index: true
    },
    status: {
      type: String,
      enum: ["Active", "Draft", "Deprecated"],
      default: "Active"
    },
    createdBy: {
      type: String,
      default: "System Architecture"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssessmentPromptSection", assessmentPromptSectionSchema);
