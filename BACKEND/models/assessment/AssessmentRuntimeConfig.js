const mongoose = require("mongoose");

/**
 * Assessment Runtime Configuration Schema (Phase 4.1 — Refinements 6 & 7)
 * Establishes provider abstraction by stripping AI provider selection away from blueprint logic.
 * Governs hierarchical runtime provider execution settings:
 * Global Provider -> Category Override -> Subcategory Override -> Assessment Override.
 * Future provider support: Groq, OpenAI, Gemini, Claude, Custom.
 * NOTE: Architectural definition only; actual execution is reserved for Phase 5+.
 */
const assessmentRuntimeConfigSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      enum: ["Global", "Category", "Subcategory", "Assessment"],
      required: true,
      default: "Global",
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentCategory",
      index: true
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSubcategory",
      index: true
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    primaryProvider: {
      type: String,
      enum: ["Groq", "OpenAI", "Gemini", "Claude", "Custom"],
      default: "Groq",
      required: true
    },
    modelName: {
      type: String,
      default: "llama-3.1-8b-instant",
      trim: true
    },
    fallbackProviders: [{
      type: String,
      enum: ["Groq", "OpenAI", "Gemini", "Claude", "Custom"]
    }],
    temperature: {
      type: Number,
      default: 0.65,
      min: 0,
      max: 2
    },
    topP: {
      type: Number,
      default: 0.9,
      min: 0,
      max: 1
    },
    maxTokens: {
      type: Number,
      default: 2500,
      min: 100,
      max: 16000
    },
    requestTimeoutMs: {
      type: Number,
      default: 7000, // Strict 7-second zero-pause architecture boundary
      min: 1000,
      max: 30000
    },
    retryAttempts: {
      type: Number,
      default: 2,
      min: 0,
      max: 5
    },
    customEndpointUrl: {
      type: String,
      default: ""
    },
    notes: {
      type: String,
      default: "Hierarchical AI runtime provider routing specification."
    },
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

// Ensure index optimization for scope resolutions
assessmentRuntimeConfigSchema.index({ scope: 1, subcategoryId: 1, categoryId: 1, status: 1 });

module.exports = mongoose.model("AssessmentRuntimeConfig", assessmentRuntimeConfigSchema);
