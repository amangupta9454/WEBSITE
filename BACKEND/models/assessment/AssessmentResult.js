const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Component 12: Result Object Schema (Phase 10 — Result Evaluation & Scoring Engine)
 * Immutable representation of a server-evaluated assessment attempt.
 * Strictly avoids certificates, leaderboard ranks, personalized AI recommendations, or email logs.
 */
const AssessmentResultSchema = new Schema({
  resultId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  evaluationPackageId: {
    type: String,
    required: true,
    index: true,
  },
  candidateId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  subcategoryId: {
    type: Schema.Types.ObjectId,
    ref: "AssessmentSubcategory",
    required: false,
    index: true,
  },
  attemptNumber: {
    type: Number,
    required: true,
    default: 1,
  },

  // Component 4: Score Engine & Component 5: Pass/Fail Engine
  scoreSummary: {
    totalQuestions: { type: Number, required: true },
    attempted: { type: Number, required: true },
    unanswered: { type: Number, required: true },
    correct: { type: Number, required: true },
    incorrect: { type: Number, required: true },
    rawScore: { type: Number, required: true },
    negativeMarkingDeductions: { type: Number, default: 0 },
    finalScore: { type: Number, required: true },
    maxPossibleScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passingPercentage: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Passed", "Failed", "Borderline"],
      required: true,
      index: true,
    },
    borderlineThreshold: { type: Number, default: 3.0 },
  },

  // Component 6: Topic Performance Engine
  topicAnalysis: [
    {
      topic: { type: String, required: true },
      total: { type: Number, required: true },
      attempted: { type: Number, required: true },
      correct: { type: Number, required: true },
      incorrect: { type: Number, required: true },
      accuracy: { type: Number, required: true }, // percentage
      attemptRate: { type: Number, required: true }, // percentage
    },
  ],

  // Component 7: Difficulty Performance Engine
  difficultyAnalysis: {
    Easy: {
      total: { type: Number, default: 0 },
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      attemptRate: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
    },
    Medium: {
      total: { type: Number, default: 0 },
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      attemptRate: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
    },
    Hard: {
      total: { type: Number, default: 0 },
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      attemptRate: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
    },
    Expert: {
      total: { type: Number, default: 0 },
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      attemptRate: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
    },
  },

  // Component 8: Bloom's Taxonomy Performance Engine
  bloomAnalysis: {
    Remember: { total: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, accuracy: { type: Number, default: 0 } },
    Understand: { total: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, accuracy: { type: Number, default: 0 } },
    Apply: { total: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, accuracy: { type: Number, default: 0 } },
    Analyze: { total: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, accuracy: { type: Number, default: 0 } },
    Evaluate: { total: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, accuracy: { type: Number, default: 0 } },
    Create: { total: { type: Number, default: 0 }, correct: { type: Number, default: 0 }, accuracy: { type: Number, default: 0 } },
  },

  // Component 9: Strength & Weakness Engine (Rule-based only)
  strengthsAndWeaknesses: {
    strongTopics: [{ type: String }],
    weakTopics: [{ type: String }],
    strongDifficulties: [{ type: String }],
    weakDifficulties: [{ type: String }],
    mostMissedTopics: [{ type: String }],
  },

  // Component 10: Anti-Cheat Summary
  riskSummary: {
    totalEvents: { type: Number, default: 0 },
    tabSwitches: { type: Number, default: 0 },
    fullscreenExits: { type: Number, default: 0 },
    copyAttempts: { type: Number, default: 0 },
    pasteAttempts: { type: Number, default: 0 },
    devToolsEvents: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    policy: { type: String, default: "Summary Only (No automatic disqualification in Phase 10)" },
  },

  // Component 11 & 18: Evaluation Integrity & Security
  integrity: {
    packageFingerprint: { type: String, required: true },
    evaluationHash: { type: String, required: true },
    evaluatorVersion: { type: String, default: "v1.0.0-Phase10-Authoritative" },
    evaluationTimestamp: { type: Date, default: Date.now },
    isTamperVerified: { type: Boolean, default: true },
  },

  // Component 13: Re-evaluation Ready Metadata
  evaluationMetadata: {
    blueprintVersion: { type: Number, default: 1 },
    configVersion: { type: Number, default: 1 },
    questionVersions: { type: Schema.Types.Mixed, default: {} },
    reevaluatedCount: { type: Number, default: 0 },
    lastReevaluatedAt: { type: Date, default: null },
    handOffToPhase11Status: {
      type: String,
      enum: ["QUEUED", "PENDING", "COMPLETED"],
      default: "QUEUED",
    },
  },

  isImmutable: {
    type: Boolean,
    default: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

// Component 18: Security — prevent accidental modification of immutable evaluated results
AssessmentResultSchema.pre("findOneAndUpdate", function (next) {
  // Only allow updating evaluationMetadata (e.g. handoff status or reevaluation count) if necessary
  const update = this.getUpdate();
  if (update.$set && update.$set.isImmutable === false) {
    return typeof next === "function" ? next(new Error("SECURITY_ERROR: AssessmentResult objects are strictly immutable once created.")) : null;
  }
  if (typeof next === "function") next();
});

// Component 9 (Phase 11.5): Performance & Analytical Query Optimization Indexes
AssessmentResultSchema.index({ candidateId: 1, createdAt: -1 });
AssessmentResultSchema.index({ subcategoryId: 1, "score.passed": 1 });
AssessmentResultSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AssessmentResult", AssessmentResultSchema);
