const mongoose = require("mongoose");

const assessmentAIJobSchema = new mongoose.Schema(
  {
    jobType: {
      type: String,
      enum: ["generate_questions", "check_inventory", "batch_validate"],
      required: true,
      index: true,
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSubcategory",
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert", "mixed"],
      default: "mixed",
    },
    targetCount:    { type: Number, default: 10 },
    generatedCount: { type: Number, default: 0 },
    approvedCount:  { type: Number, default: 0 },
    rejectedCount:  { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "cancelled"],
      default: "queued",
      index: true,
    },
    progress:     { type: Number, default: 0, min: 0, max: 100 }, // percentage
    error:        { type: String, default: "" },
    groqKeyIndex: { type: Number, default: null },
    triggeredBy:  { type: String, default: "admin" }, // "admin" | "auto"
    startedAt:    { type: Date, default: null },
    completedAt:  { type: Date, default: null },
    logs:         [{ message: String, timestamp: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);

assessmentAIJobSchema.index({ status: 1, createdAt: -1 });
assessmentAIJobSchema.index({ subcategoryId: 1, status: 1 });

module.exports = mongoose.model("AssessmentAIJob", assessmentAIJobSchema);
