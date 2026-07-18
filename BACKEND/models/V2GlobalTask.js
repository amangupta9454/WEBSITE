const mongoose = require("mongoose");

const v2GlobalTaskSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true },
    monthNumber: { type: Number, required: true },
    projects: [
      {
        projectNumber: { type: Number, required: true },
        projectName: { type: String, required: true },
        repository: { type: String },
        resources: { type: String },
        deadline: { type: String, required: true }
      }
    ]
  },
  { timestamps: true }
);

v2GlobalTaskSchema.index({ domain: 1, monthNumber: 1 }, { unique: true });

module.exports = mongoose.model("V2GlobalTask", v2GlobalTaskSchema);
