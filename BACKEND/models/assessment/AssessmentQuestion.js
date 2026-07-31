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

// ── Static Helper: Automatically synchronize question inventory counts ────────
assessmentQuestionSchema.statics.syncInventory = async function (subcategoryId, categoryId) {
  try {
    const Subcategory = mongoose.model("AssessmentSubcategory");
    const Category    = mongoose.model("AssessmentCategory");

    if (subcategoryId) {
      const subCount = await this.countDocuments({ subcategoryId, status: "approved" });
      await Subcategory.findByIdAndUpdate(subcategoryId, { currentQuestionCount: subCount }).catch(() => {});
    }

    if (categoryId) {
      const totalCount = await this.countDocuments({ categoryId, status: "approved" });
      const aiCount    = await this.countDocuments({ categoryId, status: "approved", source: "AI" });
      const manualCount= await this.countDocuments({ categoryId, status: "approved", source: "manual" });
      const csvCount   = await this.countDocuments({ categoryId, status: "approved", source: "csv" });
      
      await Category.findByIdAndUpdate(categoryId, {
        currentQuestionCount: totalCount,
        totalAiQuestions: aiCount,
        totalManualQuestions: manualCount,
        totalCsvQuestions: csvCount,
      }).catch(() => {});
    }
  } catch (err) {
    console.error("[AssessmentQuestion] Failed to sync inventory counts:", err);
  }
};

// Mongoose hooks to keep inventory perfectly synchronized
assessmentQuestionSchema.post("save", function (doc) {
  if (doc) {
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

assessmentQuestionSchema.index({ subcategoryId: 1, difficulty: 1, status: 1 });
assessmentQuestionSchema.index({ hash: 1 }, { unique: true });

module.exports = mongoose.model("AssessmentQuestion", assessmentQuestionSchema);
