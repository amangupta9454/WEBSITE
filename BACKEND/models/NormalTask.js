const mongoose = require("mongoose");

const normalTaskSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true },
    monthNumber: { type: Number, required: true },
    pdfUrl: { type: String },
    description: { type: String },
    tasks: [
      {
        title: { type: String },
        pdfUrl: { type: String },
        description: { type: String }
      }
    ]
  },
  { timestamps: true }
);

// Ensure a domain can only have one task per month
normalTaskSchema.index({ domain: 1, monthNumber: 1 }, { unique: true });

module.exports = mongoose.model("NormalTask", normalTaskSchema);
