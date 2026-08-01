const mongoose = require("mongoose");

/**
 * Component 8: Worker Health & Component 10: Worker Metrics
 * Tracks status, capabilities, heartbeat intervals, and processing telemetry of autonomous workers.
 */
const assessmentWorkerNodeSchema = new mongoose.Schema(
  {
    workerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Healthy", "Busy", "Paused", "Offline", "Failed"],
      default: "Healthy",
      index: true,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
    currentJobId: {
      type: String,
      default: null,
    },
    capabilities: {
      type: [String],
      default: [
        "Inventory_Recovery",
        "Batch_Synthesis",
        "Knowledge_Optimization",
        "AI_Runtime_Health_Check",
        "System_Maintenance",
        "Bulk_Automation"
      ],
    },
    metrics: {
      jobsCreated: { type: Number, default: 0 },
      jobsRunning: { type: Number, default: 0 },
      jobsCompleted: { type: Number, default: 0 },
      jobsFailed: { type: Number, default: 0 },
      retryCount: { type: Number, default: 0 },
      totalRuntimeMs: { type: Number, default: 0 },
      avgRuntimeMs: { type: Number, default: 0 },
      queueLength: { type: Number, default: 0 },
      workerUtilization: { type: Number, default: 0 }, // percentage 0-100
      inventoryRecoveryRate: { type: Number, default: 0 }, // synthesized items/hr
    },
  },
  { timestamps: true }
);

assessmentWorkerNodeSchema.index({ status: 1, lastHeartbeat: -1 });

module.exports = mongoose.model("AssessmentWorkerNode", assessmentWorkerNodeSchema);
