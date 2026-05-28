const mongoose = require("mongoose");

const summerProjectSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    pdfUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SummerProject", summerProjectSchema);
