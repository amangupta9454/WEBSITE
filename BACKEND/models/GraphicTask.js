const mongoose = require("mongoose");

const graphicTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  referenceLink: { type: String, default: "" },
  fileUrl: { type: String, default: "" },
  target: { type: String, enum: ['All', 'Specific'], required: true, default: 'All' },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetUserName: { type: String },
  targetStudentId: { type: String },
  deadline: { type: Date },
  isUrgent: { type: Boolean, default: false },
  addedBy: { type: String, default: "Admin" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GraphicTask", graphicTaskSchema);
