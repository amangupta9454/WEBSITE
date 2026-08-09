const mongoose = require("mongoose");

const quizSponsorSchema = new mongoose.Schema(
  {
    quizName: { type: String, required: true, unique: true },
    sponsorName: { type: String, default: "" },
    sponsorSignatoryName: { type: String, default: "" },
    quizDate: { type: String, default: "" },
    sponsorLogo: { type: String, default: "" },
    sponsorSignature: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizSponsor", quizSponsorSchema);
