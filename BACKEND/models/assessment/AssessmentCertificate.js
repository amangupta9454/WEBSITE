const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const assessmentCertificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSession",
      required: true,
      unique: true,
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSubcategory",
      required: true,
      index: true,
    },
    certificateId: {
      type: String,
      unique: true,
      default: () => uuidv4(),
      index: true,
    },
    candidateName:   { type: String, required: true },
    assessmentName:  { type: String, required: true },
    categoryName:    { type: String, required: true },
    score:           { type: Number, required: true },
    percentage:      { type: Number, required: true },
    issuedAt:        { type: Date, default: Date.now },
    pdfUrl:          { type: String, default: "" },     // Cloudinary URL
    qrCodeUrl:       { type: String, default: "" },     // QR Code image URL
    verificationUrl: { type: String, default: "" },     // Public verify page URL
    isRevoked:       { type: Boolean, default: false, index: true },
    revokedAt:       { type: Date, default: null },
    revokedBy:       { type: String, default: "" },
    revokeReason:    { type: String, default: "" },
    emailSent:       { type: Boolean, default: false },
    emailSentAt:     { type: Date, default: null },
  },
  { timestamps: true }
);

assessmentCertificateSchema.index({ userId: 1, isRevoked: 1 });

module.exports = mongoose.model("AssessmentCertificate", assessmentCertificateSchema);
