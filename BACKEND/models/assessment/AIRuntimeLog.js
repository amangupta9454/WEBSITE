const mongoose = require("mongoose");

/**
 * AIRuntimeLog Schema (Phase 5 — Component 9 & 10)
 * Persistent audit logging and usage telemetry for all AI runtime requests.
 * Records unique request ID, provider execution performance, masked credentials,
 * SLA latency boundaries, token metrics, and cache fingerprints.
 * Strictly avoids exposing raw credentials or secrets.
 */
const aiRuntimeLogSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    provider: {
      type: String,
      enum: ["Groq", "OpenAI", "Gemini", "Claude", "Custom", "Simulation"],
      required: true,
      default: "Groq",
      index: true
    },
    model: {
      type: String,
      required: true,
      default: "llama-3.1-8b-instant",
      trim: true
    },
    apiKeyMasked: {
      type: String,
      required: true,
      trim: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSession",
      default: null,
      index: true
    },
    blueprintVersion: {
      type: Number,
      default: 1
    },
    assessmentConfigVersion: {
      type: Number,
      default: 1
    },
    requestTimestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    responseTimestamp: {
      type: Date,
      default: null
    },
    latencyMs: {
      type: Number,
      default: 0
    },
    retryCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "TIMEOUT", "RATE_LIMITED", "RETRYING", "FALLBACK_TRIGGERED"],
      default: "SUCCESS",
      index: true
    },
    errorCode: {
      type: String,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    },
    metrics: {
      queueTimeMs: { type: Number, default: 0 },
      providerTimeMs: { type: Number, default: 0 },
      responseParseTimeMs: { type: Number, default: 0 },
      validationTimeMs: { type: Number, default: 0 },
      totalRuntimeMs: { type: Number, default: 0 },
      estimatedTokens: { type: Number, default: 0 },
      returnedTokens: { type: Number, default: 0 },
      costPlaceholder: { type: String, default: "$0.0000 (Free Tier / Groq Prototype)" }
    },
    requestFingerprint: {
      type: String,
      index: true,
      trim: true,
      default: null // For Cache Ready Architecture (Component 15)
    }
  },
  {
    timestamps: true
  }
);

// Indexes for analytical query efficiency and operational debugging
aiRuntimeLogSchema.index({ createdAt: -1 });
aiRuntimeLogSchema.index({ provider: 1, status: 1 });

module.exports = mongoose.model("AIRuntimeLog", aiRuntimeLogSchema);
