const mongoose = require("mongoose");
const crypto = require("crypto");

const assessmentQuestionSchema = new mongoose.Schema(
  {
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSubcategory",
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentCategory",
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length === 4,
        message: "Exactly 4 options are required",
      },
    },
    correctIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: { type: String, default: "", trim: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert"],
      required: true,
      index: true,
    },
    topics: { type: [String], default: [] },
    source: {
      type: String,
      enum: ["AI", "manual", "csv"],
      default: "AI",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    hash: {
      type: String,
      unique: true,
      index: true,
      // MD5 of question text for deduplication
    },
    usedCount: { type: Number, default: 0 },
    aiJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentAIJob",
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate hash before save for deduplication
assessmentQuestionSchema.pre("save", function (next) {
  if (!this.hash) {
    this.hash = crypto
      .createHash("md5")
      .update(this.text.toLowerCase().trim())
      .digest("hex");
  }
  next();
});

assessmentQuestionSchema.index({ subcategoryId: 1, difficulty: 1, status: 1 });
assessmentQuestionSchema.index({ hash: 1 }, { unique: true });

module.exports = mongoose.model("AssessmentQuestion", assessmentQuestionSchema);
