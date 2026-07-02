const mongoose = require("mongoose");

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewUser", required: true },
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    experienceYears: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    status: { type: String, enum: ["Started", "Completed", "Failed"], default: "Started" },
    feedback: { type: Object, default: {} }, // Detailed feedback (JSON)
    messages: { type: Array, default: [] } // Chat transcript if needed
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
