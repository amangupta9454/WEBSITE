const mongoose = require("mongoose");

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    experienceYears: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    status: { type: String, enum: ["Started", "Completed", "Failed", "EVALUATION_PENDING", "EVALUATION_RUNNING", "Aborted"], default: "Started" },
    feedback: { type: Object, default: {} }, // Detailed feedback (JSON)
    messages: { type: Array, default: [] }, // Chat transcript if needed
    recruiterMemory: { type: Object, default: {} },
    attentionReport: { type: Object, default: {} },
    resumeText: { type: String, default: "" },
    mode: { type: String, enum: ["Standard", "Panel"], default: "Standard" },
    stageHistory: { type: Array, default: [] }, // Array of { stage, timestamp }
    panelFeedback: { type: Object, default: {} } // Dedicated structured feedback for panel mode
  },
  { timestamps: true }
);

// Indexes for Scalability
interviewSessionSchema.index({ userId: 1, createdAt: -1 });
interviewSessionSchema.index({ status: 1 });
// TTL Index: expire abandoned interviews after 48 hours (only if status is still 'Started')
interviewSessionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 172800, partialFilterExpression: { status: 'Started' } }
);

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
