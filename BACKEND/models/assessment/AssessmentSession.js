const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId:      { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentQuestion", required: true },
    selectedIndex:   { type: Number, default: null },   // null = skipped
    isCorrect:       { type: Boolean, default: false },
    timeTakenSeconds:{ type: Number, default: 0 },
  },
  { _id: false }
);

const assessmentSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSubcategory",
      required: true,
      index: true,
    },
    configId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentConfig",
      required: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
      index: true,
    },
    startedAt:    { type: Date, default: Date.now },
    completedAt:  { type: Date, default: null },
    expiresAt:    { type: Date, required: true }, // startedAt + timeLimitMinutes
    totalQuestions:     { type: Number, required: true },
    currentBatch:       { type: Number, default: 1 },
    questionIds:        [{ type: mongoose.Schema.Types.ObjectId, ref: "AssessmentQuestion" }],
    answers:            [answerSchema],
    score:              { type: Number, default: 0 },    // correct count
    percentage:         { type: Number, default: 0 },
    passed:             { type: Boolean, default: false },
    aiQuestionsCount:   { type: Number, default: 0 },
    dbQuestionsCount:   { type: Number, default: 0 },
    weakTopics:         [String],
    strongTopics:       [String],
    aiFeedback:         { type: String, default: "" },
  },
  { timestamps: true }
);

assessmentSessionSchema.index({ userId: 1, subcategoryId: 1, status: 1 });
assessmentSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup

module.exports = mongoose.model("AssessmentSession", assessmentSessionSchema);
