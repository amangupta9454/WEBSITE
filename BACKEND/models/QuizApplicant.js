const mongoose = require("mongoose");

const quizApplicantSchema = new mongoose.Schema(
  {
    quizName: { type: String, required: true, index: true },
    registrationId: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String },
    gender: { type: String },
    location: { type: String },
    userType: { type: String },
    domain: { type: String },
    course: { type: String },
    specialization: { type: String },
    courseDuration: { type: String },
    yearOfGraduation: { type: String },
    organisation: { type: String },
    resumeUrl: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizApplicant", quizApplicantSchema);
