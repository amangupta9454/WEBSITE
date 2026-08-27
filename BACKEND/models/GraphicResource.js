const mongoose = require("mongoose");

const graphicResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String },
  fileUrl: { type: String },
  target: { type: String, enum: ['All', 'Specific'], required: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedBy: { type: String, default: "Admin" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GraphicResource", graphicResourceSchema);
