const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true }, // No unique constraint needed if duplicates allowed
    mobile: { type: String, required: true },

    // Student Auth & Profile Fields
    password: { type: String },
    isFirstLogin: { type: Boolean, default: true },
    profileImage: { type: String, default: "" },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },
    dismissedNotifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],

    // Internship applications array
    internships: [
      {
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
        internshipType: { type: String, default: "Normal Intern" },
        resume: String,
        portfolio: String, // Keeping legacy for past apps
        github: String, // Keeping legacy for past apps
        linkedin: String, // Keeping legacy for past apps
        whyHire: String,
        hearAbout: String,
        batch: { type: String },
        appliedAt: { type: Date, default: Date.now },
        downloadedAt: { type: Date },
        startDate: { type: Date },
        endDate: { type: Date },
        totalMonths: { type: Number },
        certificateUrl: { type: String },
        offerLetterStatus: {
          type: String,
          enum: ["Not Sent", "Sent"],
          default: "Not Sent",
        },
        hasPaid: { type: Boolean, default: false }, // New: tracks if final payment done
        paymentAmount: { type: Number, default: 0 },
        paymentDate: { type: Date }, // Tracks when the payment was made
        refundAmount: { type: Number, default: 0 },
        razorpayPaymentId: { type: String },
        paidExported: { type: Boolean, default: false },
        projectExported: { type: Boolean, default: false },
        isCertificateSent: { type: Boolean, default: false },
        alerts: [
          {
            message: String,
            date: { type: Date, default: Date.now },
            isRead: { type: Boolean, default: false },
            type: { type: String, default: "info" },
          },
        ],
        assignedRepos: [
          {
            projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SummerProject' },
            repoLink: { type: String },
            isFinalSubmitted: { type: Boolean, default: false },
            reviewStatus: { type: String, enum: ['Pending', 'pending', 'Changes Requested', 'Accepted', 'Rejected'], default: 'Pending' },
            feedback: { type: String, default: "" },
            pointsAwarded: { type: Boolean, default: false },
            submittedAt: { type: Date },
            emailSent: { type: Boolean, default: false }
          }
        ],
        assignedNormalTasks: [{ type: String }],
        synergyPoints: { type: Number, default: 0 },
        pointsHistory: [
          {
            reason: String,
            pointsAdded: Number,
            date: { type: Date, default: Date.now }
          }
        ]
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
