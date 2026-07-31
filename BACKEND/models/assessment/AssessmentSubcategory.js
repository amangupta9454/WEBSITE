const mongoose = require("mongoose");

const assessmentSubcategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentCategory",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: "" },
    icon: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

assessmentSubcategorySchema.index({ slug: 1 }, { unique: true });
assessmentSubcategorySchema.index({ categoryId: 1, isActive: 1, displayOrder: 1 });

module.exports = mongoose.model("AssessmentSubcategory", assessmentSubcategorySchema);
