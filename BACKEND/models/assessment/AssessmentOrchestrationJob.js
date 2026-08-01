const mongoose = require("mongoose");

/**
 * Component 1: Job Manager & Component 5: Job Priority & Component 6: Retry Engine
 * Every automation task in the Autonomous Knowledge Orchestration Engine is managed via an Orchestration Job.
 */
const assessmentOrchestrationJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "Inventory_Recovery",
        "Batch_Synthesis",
        "Knowledge_Optimization",
        "AI_Runtime_Health_Check",
        "System_Maintenance",
        "Bulk_Automation"
      ],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Queued",
        "Running",
        "Retrying",
        "Completed",
        "Failed",
        "Cancelled",
        "Dead Letter Queue"
      ],
      default: "Pending",
      index: true,
    },
    targetType: {
      type: String,
      enum: ["Subcategory", "Category", "Domain", "System"],
      default: "Subcategory",
    },
    targetId: {
      type: String,
      default: null,
      index: true,
    },
    targetName: {
      type: String,
      default: "General Domain",
    },
    retries: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3, // Configurable per job/policy
    },
    retryDelays: {
      type: [Number],
      default: [5, 15, 30], // Delays in minutes
    },
    nextRetryAt: {
      type: Date,
      default: null,
      index: true,
    },
    workerId: {
      type: String,
      default: null,
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    failureReason: {
      type: String,
      default: "",
    },
    recoveryAction: {
      type: String,
      default: "",
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    logs: [
      {
        workerId: String,
        action: String,
        durationMs: Number,
        retries: Number,
        failureReason: String,
        recoveryAction: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

assessmentOrchestrationJobSchema.index({ status: 1, priority: 1, createdAt: 1 });
assessmentOrchestrationJobSchema.index({ targetId: 1, status: 1 });

module.exports = mongoose.model("AssessmentOrchestrationJob", assessmentOrchestrationJobSchema);
