const mongoose = require("mongoose");

const graphicResourceRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  studentId: { type: String },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ['Pending', 'Fulfilled', 'Rejected'], default: 'Pending' },
  adminNote: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GraphicResourceRequest", graphicResourceRequestSchema);
