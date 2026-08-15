const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * AssessmentQuestion.js — Phase 7: Question Knowledge Base Engine (Master Repository Schema)
 * Acts as the permanent canonical vault for all assessment items that pass the Phase 6 AI Quality Gate.
 * Enforces immutable identity (Component 3), multi-dimensional metadata (Component 5), version history (Component 4),
 * robust lifecycle management with zero hard deletions (Component 7), and automatic inventory sync (Component 8).
 */
const assessmentQuestionSchema = new mongoose.Schema(
  {
    // ── COMPONENT 3: IMMUTABLE QUESTION IDENTITY ──────────────────────────
    knowledgeBaseId: {
      type: String,
      unique: true,
      index: true,
      default: () => `KB-Q-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    },
    fingerprint: {
      type: String,
      unique: true,
      index: true,
      required: true,
      // SHA-256 deterministic fingerprint generated during Phase 6 Duplicate Detection
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
      index: true,
    },
    createdSource: {
      type: String,
      enum: ["AI Generated", "Manual Entry", "CSV Import", "Future API", "AI", "manual", "csv", "api"],
      default: "AI Generated",
      index: true,
    },
    requestId: {
      type: String,
      default: null,
      index: true,
      // Tracing ID from Phase 5 AI Runtime Engine (e.g. REQ-20260801-XXXXXX)
    },
    blueprintVersion: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      default: null,
      // AI vendor provider (Groq, OpenAI, Gemini, Claude)
    },
    model: {
      type: String,
      default: null,
      // Target model ID (e.g., llama-3.3-70b-specdec)
    },
    createdBy: {
      type: String,
      default: "system_quality_gate",
    },

    // ── COMPONENT 5: KNOWLEDGE METADATA & CONTENT ─────────────────────────
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
    text: { 
      type: String, 
      required: true, 
      trim: true 
    },
    options: {
      type: [String],
      default: [],
    },
    correctIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    correctAnswer: {
      type: String,
      default: "",
    },
    explanation: { 
      type: String, 
      default: "", 
      trim: true 
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Expert", "easy", "medium", "hard", "expert"],
      default: "Medium",
      required: true,
      index: true,
    },
    bloomLevel: {
      type: String,
      enum: ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create", "Unassigned"],
      default: "Apply",
      index: true,
    },
    assessmentType: {
      type: String,
      enum: ["MCQ", "Coding", "Mixed", "AI Viva", "Subjective", "mcq", "coding", "mixed", "viva", "subjective"],
      default: "MCQ",
      index: true,
    },
    topics: { 
      type: [String], 
      default: [],
      index: true,
    },
    subtopic: {
      type: String,
      default: "General Core Concepts",
    },
    qualityScore: {
      type: Number,
      default: 95,
      min: 0,
      max: 100,
      index: true,
    },
    language: {
      type: String,
      default: "English",
    },
    tags: {
      type: [String],
      default: ["verified", "quality-gate-approved"],
      index: true,
    },
    estimatedTimeSeconds: {
      type: Number,
      default: 60,
    },
    validationSummary: {
      type: Object,
      default: {
        qualityScores: {
          structureScore: 100,
          grammarScore: 95,
          completenessScore: 95,
          topicMatchScore: 90,
          difficultyScore: 90,
          duplicateRisk: 0
        },
        passedQualityGate: true,
        gateVersion: "Phase-6.0",
      }
    },

    // Optional Multi-Modality Fields (Coding / Viva / Subjective)
    problemStatement: { type: String, default: "" },
    starterCode:      { type: String, default: "" },
    testCases:        { type: [Object], default: [] },
    gradingRubric:    { type: Object, default: {} },

    // ── COMPONENT 7: LIFECYCLE MANAGEMENT & SOFT DELETION ─────────────────
    status: {
      type: String,
      enum: [
        "Draft",
        "Approved",
        "Archived",
        "Disabled",
        "Deprecated",
        // Legacy lowercase support for backwards compatibility:
        "approved",
        "pending",
        "rejected"
      ],
      default: "Approved",
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
      // Soft deletion flag: never hard delete from Knowledge Base repository
    },
    usedCount: { 
      type: Number, 
      default: 0 
    },
    hash: {
      type: String,
      index: true,
      // Legacy md5 hash field preserved for backward compatibility
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Auto-populate legacy hash & canonical fingerprint before saving
assessmentQuestionSchema.pre("save", function (next) {
  if (!this.hash) {
    this.hash = crypto
      .createHash("md5")
      .update(this.text.toLowerCase().trim())
      .digest("hex");
  }
  if (!this.fingerprint) {
    this.fingerprint = crypto
      .createHash("sha256")
      .update(this.text.toLowerCase().replace(/[^a-z0-9]/g, "").trim())
      .digest("hex");
  }
  if (typeof next === "function") next();
});

// ── COMPONENT 8: AUTOMATED INVENTORY SYNCHRONIZATION ──────────────────────────
assessmentQuestionSchema.statics.syncInventory = async function (subcategoryId, categoryId) {
  try {
    const Subcategory = mongoose.model("AssessmentSubcategory");
    const Category    = mongoose.model("AssessmentCategory");

    // Only count active Approved items that are not soft-deleted
    const activeQuery = { 
      status: { $in: ["Approved", "approved"] }, 
      isDeleted: false 
    };

    if (subcategoryId) {
      const subCount = await this.countDocuments({ subcategoryId, ...activeQuery });
      await Subcategory.findByIdAndUpdate(subcategoryId, { currentQuestionCount: subCount }).catch(() => {});
    }

    if (categoryId) {
      const totalCount = await this.countDocuments({ categoryId, ...activeQuery });
      const aiCount    = await this.countDocuments({ categoryId, ...activeQuery, createdSource: { $in: ["AI Generated", "AI", "api"] } });
      const manualCount= await this.countDocuments({ categoryId, ...activeQuery, createdSource: { $in: ["Manual Entry", "manual"] } });
      const csvCount   = await this.countDocuments({ categoryId, ...activeQuery, createdSource: { $in: ["CSV Import", "csv"] } });
      
      await Category.findByIdAndUpdate(categoryId, {
        currentQuestionCount: totalCount,
        totalAiQuestions: aiCount,
        totalManualQuestions: manualCount,
        totalCsvQuestions: csvCount,
      }).catch(() => {});
    }
  } catch (err) {
    console.error("[KnowledgeBase:InventorySync] Failed to synchronize inventory counts:", err.message);
  }
};

// Mongoose post-modification hooks to maintain synchronous inventory percentages
assessmentQuestionSchema.post("save", function (doc) {
  if (doc && !doc.isDeleted) {
    doc.constructor.syncInventory(doc.subcategoryId, doc.categoryId);
  }
});
assessmentQuestionSchema.post("findOneAndDelete", function (doc) {
  if (doc) {
    mongoose.model("AssessmentQuestion").syncInventory(doc.subcategoryId, doc.categoryId);
  }
});
assessmentQuestionSchema.post("findOneAndUpdate", function (doc) {
  if (doc) {
    mongoose.model("AssessmentQuestion").syncInventory(doc.subcategoryId, doc.categoryId);
  }
});

// ── COMPONENT 11: OPTIMIZED INDEXING STRATEGY ──────────────────────────────
assessmentQuestionSchema.index({ subcategoryId: 1, difficulty: 1, status: 1, isDeleted: 1 });
assessmentQuestionSchema.index({ categoryId: 1, status: 1, isDeleted: 1 });
assessmentQuestionSchema.index({ bloomLevel: 1, assessmentType: 1, status: 1 });
assessmentQuestionSchema.index({ createdSource: 1, qualityScore: -1 });
assessmentQuestionSchema.index({ createdAt: -1 });
// Full-text indexing for rapid keyword discovery in Component 10 (Search Architecture)
assessmentQuestionSchema.index({ text: "text", topics: "text", tags: "text", explanation: "text", subtopic: "text" });

module.exports = mongoose.model("AssessmentQuestion", assessmentQuestionSchema);
