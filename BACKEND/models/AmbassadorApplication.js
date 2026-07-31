const mongoose = require("mongoose");

const ambassadorApplicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    college: { type: String, required: true, trim: true },
    yearBranch: { type: String, required: true, trim: true },
    reason: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    appliedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AmbassadorApplication", ambassadorApplicationSchema);
