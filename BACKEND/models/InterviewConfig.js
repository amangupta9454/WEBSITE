const mongoose = require("mongoose");

const interviewConfigSchema = new mongoose.Schema(
  {
    modeId: { type: String, required: true, unique: true }, // "Standard" or "Panel"
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    tokenCost: { type: Number, required: true, default: 5 },
    durationOptions: { type: Array, default: [15, 30, 45, 60] },
    description: { type: String },
    badge: { type: String },
    icon: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewConfig", interviewConfigSchema);
