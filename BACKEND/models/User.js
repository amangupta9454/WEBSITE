// backend/models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true }, // No unique constraint needed if duplicates allowed
  mobile: { type: String, required: true },

  // Internship applications array
  internships: [{
    studentId: { type: String },
    name: String,
    email: String,
    mobile: String,
    whatsapp: String,
    course: String,
    branch: String,
    year: String,
    college: String,
    state: String,
    passingYear: String,
    domain: String,
    duration: String,
    portfolio: String,
    github: String,
    linkedin: String,
    whyHire: String,
    hearAbout: String,
    appliedAt: { type: Date, default: Date.now },
    downloadedAt: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },
    totalMonths: { type: Number },
    certificateUrl: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);