const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  externalId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  salary: {
    type: String,
    default: 'Not disclosed'
  },
  jobType: {
    type: String, // e.g., 'Full-time', 'Contract', 'Internship'
    default: 'Full-time'
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  category: {
    type: String, // e.g., 'Software Engineer', 'Frontend', 'Backend'
    default: 'General'
  },
  description: {
    type: String
  },
  applyUrl: {
    type: String,
    required: true
  },
  applyEmail: {
    type: String
  },
  planType: {
    type: String, // 'Basic' or 'Premium'
    enum: ['Basic', 'Premium'],
    default: 'Basic'
  },
  source: {
    type: String,
    default: 'RapidAPI'
  },
  postedAt: {
    type: Date,
    default: Date.now
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
