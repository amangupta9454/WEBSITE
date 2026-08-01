const mongoose = require("mongoose");

/**
 * Component 7: Distributed Locking
 * Ensures only one active orchestration job executes per target to prevent duplicate synthesis or races.
 */
const assessmentOrchestrationLockSchema = new mongoose.Schema(
  {
    lockKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    workerId: {
      type: String,
      required: true,
    },
    targetName: {
      type: String,
      default: "Unnamed Target",
    },
    status: {
      type: String,
      enum: ["LOCKED", "RELEASED"],
      default: "LOCKED",
      index: true,
    },
    lockedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

assessmentOrchestrationLockSchema.index({ lockKey: 1, status: 1 });

module.exports = mongoose.model("AssessmentOrchestrationLock", assessmentOrchestrationLockSchema);
