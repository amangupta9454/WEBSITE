const mongoose = require("mongoose");

/**
 * Component 12: Notification Events
 * Stores orchestration architecture events without external email or push overhead.
 */
const assessmentOrchestrationEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        "Inventory Low",
        "Inventory Restored",
        "Job Failed",
        "AI Runtime Failure",
        "Queue Overflow",
        "Worker Offline",
        "DLQ Alert",
        "Optimization Complete"
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["INFO", "WARNING", "CRITICAL", "SUCCESS"],
      default: "INFO",
    },
    targetName: {
      type: String,
      default: "System",
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

assessmentOrchestrationEventSchema.index({ eventType: 1, createdAt: -1 });

module.exports = mongoose.model("AssessmentOrchestrationEvent", assessmentOrchestrationEventSchema);
