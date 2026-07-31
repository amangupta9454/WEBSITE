const mongoose = require("mongoose");
const slugify = require("slugify");

const assessmentCategorySchema = new mongoose.Schema(
  {
    name:                 { type: String, required: true, trim: true },
    slug:                 { type: String, unique: true, lowercase: true, trim: true },
    description:          { type: String, trim: true, default: "" },
    icon:                 { type: String, default: "FolderTree" }, // Lucide icon name or URL
    banner:               { type: String, default: "" },
    color:                { type: String, default: "#6366f1" },    // Hex color code (Indigo default)
    displayOrder:         { type: Number, default: 0 },
    isActive:             { type: Boolean, default: true, index: true },
    aiEnabled:            { type: Boolean, default: true },
    dbFallbackEnabled:    { type: Boolean, default: true },
    targetQuestionCount:  { type: Number, default: 1000, min: 10 },
    currentQuestionCount: { type: Number, default: 0 },            // Auto-updated by question hooks
    totalAiQuestions:     { type: Number, default: 0 },            // Auto-updated
    totalManualQuestions: { type: Number, default: 0 },            // Auto-updated
    totalCsvQuestions:    { type: Number, default: 0 },            // Auto-updated
    totalAssessments:     { type: Number, default: 0 },            // Completed assessments count
    createdBy:            { type: String, default: "admin" },
    updatedBy:            { type: String, default: "admin" },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Auto-generate slug from name if not provided or modified
assessmentCategorySchema.pre("save", async function (next) {
  if (this.isModified("name") && !this.isModified("slug")) {
    let generatedSlug = slugify(this.name, { lower: true, strict: true });
    // Check uniqueness
    const Category = mongoose.model("AssessmentCategory");
    let slugExists = await Category.findOne({ slug: generatedSlug, _id: { $ne: this._id } });
    let counter = 1;
    while (slugExists) {
      generatedSlug = `${slugify(this.name, { lower: true, strict: true })}-${counter}`;
      slugExists = await Category.findOne({ slug: generatedSlug, _id: { $ne: this._id } });
      counter++;
    }
    this.slug = generatedSlug;
  }
  next();
});

// Virtual field for Inventory Health status
assessmentCategorySchema.virtual("healthStatus").get(function () {
  if (!this.targetQuestionCount || this.targetQuestionCount <= 0) return "Critical";
  const ratio = (this.currentQuestionCount || 0) / this.targetQuestionCount;
  if (ratio >= 0.8) return "Healthy";
  if (ratio >= 0.5) return "Medium";
  if (ratio >= 0.2) return "Low";
  return "Critical";
});

// Virtual field for Inventory Percentage
assessmentCategorySchema.virtual("inventoryPercentage").get(function () {
  if (!this.targetQuestionCount || this.targetQuestionCount <= 0) return 0;
  return Math.min(100, Math.round(((this.currentQuestionCount || 0) / this.targetQuestionCount) * 100));
});

assessmentCategorySchema.index({ isActive: 1, displayOrder: 1 });
assessmentCategorySchema.index({ currentQuestionCount: -1 });

module.exports = mongoose.model("AssessmentCategory", assessmentCategorySchema);
