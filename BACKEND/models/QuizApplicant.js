const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    quizName: { type: String, required: true },
    registrationId: { type: String },
    score: { type: String, default: "N/A" },
    totalScore: { type: String, default: "N/A" },
    result: { type: String, default: "N/A" },
    percentage: { type: String, default: "N/A" },
    effectiveScore: { type: String, default: "N/A" },
    totalQuestions: { type: String, default: "N/A" },
    attemptedQuestions: { type: String, default: "N/A" },
    sponsorName: { type: String, default: "" },
    sponsorLogo: { type: String, default: "" },
    sponsorSignature: { type: String, default: "" },
    quizDate: { type: String, default: "" },
    certificateSent: { type: Boolean, default: false },
    importedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const quizApplicantSchema = new mongoose.Schema(
  {
    quizName: { type: String, required: true, index: true },
    registrationId: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
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
    courseType: { type: String },
    designation: { type: String },
    registrationTime: { type: String },
    differentlyAbled: { type: String },
    regStatus: { type: String },
    refCode: { type: String },
    resumeUrl: { type: String },
    score: { type: String, default: "N/A" },
    totalScore: { type: String, default: "N/A" },
    result: { type: String, default: "N/A" },
    percentage: { type: String, default: "N/A" },
    effectiveScore: { type: String, default: "N/A" },
    totalQuestions: { type: String, default: "N/A" },
    attemptedQuestions: { type: String, default: "N/A" },
    sponsorName: { type: String, default: "" },
    sponsorLogo: { type: String, default: "" },
    sponsorSignature: { type: String, default: "" },
    quizzes: [quizSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizApplicant", quizApplicantSchema);
