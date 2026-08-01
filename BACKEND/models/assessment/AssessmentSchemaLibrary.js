const mongoose = require("mongoose");

/**
 * Assessment Output Schema Library Schema (Phase 4.1 — Refinement 5)
 * Centralized reusable output schema definitions for AI evaluation modalities.
 * Eliminates duplication inside individual blueprints; schemas are managed independently.
 * Built-in examples: MCQ Schema, Coding Schema, Mixed Schema, AI Viva Schema, Subjective Schema.
 */
const schemaDefinitionField = new mongoose.Schema(
  {
    field: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true }, // e.g. "string", "number", "array of 4 strings", "boolean", "object"
    required: { type: Boolean, default: true },
    description: { type: String, default: "" }
  },
  { _id: false }
);

const assessmentSchemaLibrarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    assessmentType: {
      type: String,
      enum: ["MCQ", "Coding", "Mixed", "AI Viva", "Subjective", "General"],
      default: "MCQ",
      index: true
    },
    description: {
      type: String,
      required: true
    },
    schemaDefinitions: [schemaDefinitionField],
    jsonSchemaString: {
      type: String,
      required: true
    },
    expectedResponseFormat: {
      type: String,
      default: "JSON Array"
    },
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

module.exports = mongoose.model("AssessmentSchemaLibrary", assessmentSchemaLibrarySchema);
