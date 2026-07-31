const mongoose = require("mongoose");
const slugify = require("slugify");

const assessmentSubcategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentCategory",
      required: true,
      index: true,
    },
    name:                 { type: String, required: true, trim: true },
    slug:                 { type: String, unique: true, lowercase: true, trim: true },
    description:          { type: String, trim: true, default: "" },
    icon:                 { type: String, default: "Layers" }, // Lucide icon name
    isActive:             { type: Boolean, default: true, index: true }, // Status: Active / Inactive
    displayOrder:         { type: Number, default: 0 },
    supportedDifficulties: {
      type: [String],
      enum: ["easy", "medium", "hard", "expert"],
      default: ["easy", "medium", "hard", "expert"],
    },
    blueprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentAIBlueprint",
      default: null,
    },
    configId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentConfig",
      default: null,
    },
    targetQuestionCount:  { type: Number, default: 250, min: 5 },
    currentQuestionCount: { type: Number, default: 0 }, // Auto-updated by question hooks
    totalAssessments:     { type: Number, default: 0 },
    createdBy:            { type: String, default: "admin" },
    updatedBy:            { type: String, default: "admin" },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Auto-generate slug from name if not set or modified
assessmentSubcategorySchema.pre("save", async function (next) {
  if (this.isModified("name") && !this.isModified("slug")) {
    let generatedSlug = slugify(this.name, { lower: true, strict: true });
    const Subcategory = mongoose.model("AssessmentSubcategory");
    let slugExists = await Subcategory.findOne({ slug: generatedSlug, _id: { $ne: this._id } });
    let counter = 1;
    while (slugExists) {
      generatedSlug = `${slugify(this.name, { lower: true, strict: true })}-${counter}`;
      slugExists = await Subcategory.findOne({ slug: generatedSlug, _id: { $ne: this._id } });
      counter++;
    }
    this.slug = generatedSlug;
  }
  next();
});

// Virtual field for Inventory Health status
assessmentSubcategorySchema.virtual("healthStatus").get(function () {
  if (!this.targetQuestionCount || this.targetQuestionCount <= 0) return "Critical";
  const ratio = (this.currentQuestionCount || 0) / this.targetQuestionCount;
  if (ratio >= 0.8) return "Healthy";
  if (ratio >= 0.5) return "Medium";
  if (ratio >= 0.2) return "Low";
  return "Critical";
});

// Virtual field for Inventory Percentage
assessmentSubcategorySchema.virtual("inventoryPercentage").get(function () {
  if (!this.targetQuestionCount || this.targetQuestionCount <= 0) return 0;
  return Math.min(100, Math.round(((this.currentQuestionCount || 0) / this.targetQuestionCount) * 100));
});

assessmentSubcategorySchema.index({ categoryId: 1, isActive: 1, displayOrder: 1 });
assessmentSubcategorySchema.index({ currentQuestionCount: -1 });

module.exports = mongoose.model("AssessmentSubcategory", assessmentSubcategorySchema);
