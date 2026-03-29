const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true }, // No unique constraint needed if duplicates allowed
  mobile: { type: String, required: true },
  
  // Student Auth & Profile Fields
  password: { type: String, required: true },
  isFirstLogin: { type: Boolean, default: true },
  profileImage: { type: String, default: '' },
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  portfolio: { type: String, default: '' },

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
    duration: String, // "1", "2", or "3" (Months)
    portfolio: String, // Keeping legacy for past apps
    github: String,    // Keeping legacy for past apps
    linkedin: String,  // Keeping legacy for past apps
    whyHire: String,
    hearAbout: String,
    batch: { type: String }, 
    appliedAt: { type: Date, default: Date.now },
    downloadedAt: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },
    totalMonths: { type: Number },
    certificateUrl: { type: String },
    offerLetterStatus: { type: String, enum: ['Not Sent', 'Sent'], default: 'Not Sent' },
    hasPaid: { type: Boolean, default: false } // New: tracks if final payment done
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);