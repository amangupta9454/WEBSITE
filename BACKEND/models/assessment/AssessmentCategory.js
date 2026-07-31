const mongoose = require("mongoose");

const assessmentCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: "" },
    icon: { type: String, default: "" },       // URL (Cloudinary)
    banner: { type: String, default: "" },      // URL (Cloudinary)
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

assessmentCategorySchema.index({ slug: 1 }, { unique: true });
assessmentCategorySchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model("AssessmentCategory", assessmentCategorySchema);
