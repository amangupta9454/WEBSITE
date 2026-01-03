// backend/models/Certificate.js

const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateNumber: { type: String, required: true, unique: true },
  studentName: { type: String, required: true },
  domain: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: { type: String, required: true },
  studentId: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);