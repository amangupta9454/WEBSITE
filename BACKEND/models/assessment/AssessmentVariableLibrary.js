const mongoose = require("mongoose");

/**
 * Assessment Variable Library Schema (Phase 4.1 — Refinement 4)
 * Centralized repository for reusable dynamic prompt variables.
 * Prevents variable duplication across individual blueprints by allowing reference linking.
 */
const assessmentVariableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    defaultValue: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      required: true
    },
    dataType: {
      type: String,
      enum: ["string", "number", "boolean", "array", "enum"],
      default: "string"
    },
    allowedValues: [{
      type: String
    }],
    isSystemDefault: {
      type: Boolean,
      default: false,
      index: true
    },
    category: {
      type: String,
      default: "General"
    },
    status: {
      type: String,
      enum: ["Active", "Deprecated", "Draft"],
      default: "Active"
    },
    createdBy: {
      type: String,
      default: "System Architecture"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssessmentVariableLibrary", assessmentVariableSchema);
