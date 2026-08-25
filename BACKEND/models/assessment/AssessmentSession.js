const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId:        { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentQuestion", required: false },
    sequenceOrder:     { type: Number, required: false },
    selectedIndex:     { type: Number, default: null },   // null = skipped
    selectedAnswer:    { type: String, default: null },
    isAnswered:        { type: Boolean, default: false },
    isMarkedForReview: { type: Boolean, default: false },
    timeTakenSeconds:  { type: Number, default: 0 },
    lastUpdated:       { type: Date, default: Date.now },
    isCorrect:         { type: Boolean, default: false }, // Strictly evaluated ONLY in Phase 10
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    eventId:    { type: String },
    eventType:  { type: String, required: true },
    timestamp:  { type: Date, default: Date.now },
    details:    { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const questionSnapshotSchema = new mongoose.Schema(
  {
    questionId:      { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentQuestion" },
    knowledgeBaseId: { type: String },
    versionNumber:   { type: Number, default: 1 },
    fingerprint:     { type: String },
    sequenceOrder:   { type: Number },
    source:          { type: String, enum: ["AI Generated", "Database Fallback"], default: "Database Fallback" },
    questionText:    { type: String },
    options:         [{ type: String }],
    difficulty:      { type: String },
    bloomLevel:      { type: String },
    tags:            [{ type: String }],
    correctIndex:    { type: Number },
    correctOptionIndex: { type: Number },
    correctAnswer:   { type: String },
    explanation:     { type: String },
    // Note: Correct answers and explanations are stored server-side for immutable grading and stripped in delivery payloads via BatchManagerService
  },
  { _id: false }
);

const assessmentSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    attemptNumber: { type: Number, default: 1 },
    candidateId:   { type: String, index: true }, // Store user email or string identity reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentCategory",
      required: false,
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
      required: false,
    },

    // Component 2: Configuration Snapshot (Immutable during execution)
    configSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },


    // Component 3: Question Snapshot (Frozen at initialization)
    questionSnapshot: [questionSnapshotSchema],
    questionIds:      [{ type: mongoose.Schema.Types.ObjectId, ref: "AssessmentQuestion" }],

    // Component 8: Session States
    status: {
      type: String,
      enum: [
        "Created",
        "Initializing",
        "Running",
        "Paused",
        "Submitting",
        "Completed",
        "Expired",
        "Cancelled",
        "Locked",
        // Legacy compatibility:
        "in_progress",
        "completed",
        "abandoned",
      ],
      default: "Created",
      index: true,
    },

    // Timers & Health (Component 5 & 16)
    startedAt:        { type: Date, default: Date.now },
    completedAt:      { type: Date, default: null },
    expiresAt:        { type: Date, required: true },
    lastHeartbeatAt:  { type: Date, default: Date.now },
    connectionStatus: {
      type: String,
      enum: ["Healthy", "Idle", "Disconnected", "Recovered", "Expired"],
      default: "Healthy",
    },

    // Progress & Batches (Component 4 & 9)
    totalQuestions:       { type: Number, required: true },
    currentBatch:         { type: Number, default: 1 },
    currentQuestionIndex: { type: Number, default: 0 },
    answers:              [answerSchema],

    // Anti-Cheat & Timeline (Component 10 & 11)
    timeline: [timelineEventSchema],
    antiCheatSummary: {
      fullscreenExits:   { type: Number, default: 0 },
      tabSwitches:       { type: Number, default: 0 },
      windowBlurs:       { type: Number, default: 0 },
      copyAttempts:      { type: Number, default: 0 },
      pasteAttempts:     { type: Number, default: 0 },
      rightClicks:       { type: Number, default: 0 },
      devToolsDetected:  { type: Number, default: 0 },
    },

    // Submission Lock & Phase 10 Handoff (Component 12)
    isLocked:    { type: Boolean, default: false, index: true },
    submittedAt: { type: Date, default: null },

    // Phase 10 Stubs (STRICTLY NOT COMPUTED OR MODIFIED IN PHASE 9)
    score:            { type: Number, default: 0 },
    percentage:       { type: Number, default: 0 },
    passed:           { type: Boolean, default: false },
    aiQuestionsCount: { type: Number, default: 0 },
    dbQuestionsCount: { type: Number, default: 0 },
    weakTopics:       [String],
    strongTopics:     [String],
    aiFeedback:       { type: String, default: "" },
  },
  { timestamps: true }
);

assessmentSessionSchema.index({ userId: 1, subcategoryId: 1, status: 1 });
assessmentSessionSchema.index({ sessionId: 1, isLocked: 1 });

module.exports = mongoose.model("AssessmentSession", assessmentSessionSchema);
