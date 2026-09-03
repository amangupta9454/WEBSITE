const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true }, // No unique constraint needed if duplicates allowed
    mobile: { type: String, required: true },
    role: { type: String, default: 'user' },
    status: { type: String, enum: ['Pending Registration', 'Registered', 'Inactive'], default: 'Registered' },
    roles: { type: [String], default: ['student'] },

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
    
    // Master Profile / Resume Data
    resumeData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    interviewCredits: { type: Number, default: 30 },
    interviewIsUnlimited: { type: Boolean, default: false },
    interviewAccessOverride: { type: Boolean, default: false },
    resumeAccessOverride: { type: Boolean, default: false },
    interviewUnlimitedExpiresAt: { type: Date },
    jobPortalPremium: { type: Boolean, default: false },
    jobPortalPremiumExpires: { type: Date },
    freeResumesGranted: { type: Number, default: 0 },
    freeDownloadsPerResume: { type: Number, default: 0 },
    interviewPendingOrders: [
      {
        orderId: { type: String },
        packageId: { type: String },
        amount: { type: Number },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    interviewPayments: [
      {
        packageId: { type: String },
        amount: { type: Number },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
        paidAt: { type: Date, default: Date.now },
      }
    ],

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
        referralCode: { type: String, default: null },
        certificateUrl: { type: String },
        offerLetterStatus: {
          type: String,
          enum: ["Not Sent", "Sent"],
          default: "Not Sent",
        },
        hasPaid: { type: Boolean, default: false }, // New: tracks if final payment done
        resigned: {
          isResigned: { type: Boolean, default: false },
          resignationDate: { type: Date }
        },
        rejected: {
          isRejected: { type: Boolean, default: false },
          rejectionDate: { type: Date }
        },
        paymentAmount: { type: Number, default: 0 },
        paymentDate: { type: Date }, // Tracks when the payment was made
        refundAmount: { type: Number, default: 0 },
        razorpayPaymentId: { type: String },
        paidExported: { type: Boolean, default: false },
        projectExported: { type: Boolean, default: false },
        isCertificateSent: { type: Boolean, default: false },
        stipendStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
        stipendAmount: { type: Number, default: 0 },
        graphicSubmissions: [
          {
            link: { type: String },
            fileUrls: [{ type: String }],
            linkedinCaption: { type: String, required: true },
            instagramCaption: { type: String, required: true },
            taskTitle: { type: String, default: "" },
            taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'GraphicTask' },
            submittedAt: { type: Date, default: Date.now },
            status: { type: String, enum: ['Pending', 'Reviewed', 'Changes Requested'], default: 'Pending' },
            spPoints: { type: Number, min: 0, max: 10, default: null },
            feedback: { type: String, default: "" },
            feedbackDate: { type: Date }
          }
        ],
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
            spAwarded: { type: Number, default: 0 },
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
    tokenHistory: [
      {
        type: { type: String, enum: ['ADD', 'DEDUCT', 'USE', 'PURCHASE'] },
        amount: { type: Number },
        reason: { type: String },
        date: { type: Date, default: Date.now }
      }
    ],
    referredByCode: { type: String, default: null },
    referredAt: { type: Date },
    referredFeature: { type: String, default: null },
    isExistingUserReferred: { type: Boolean, default: false },
    attemptedReferredByCode: { type: String, default: null },
    attemptedReferredAt: { type: Date },
    isAmbassador: { type: Boolean, default: false },
    ambassadorCode: { type: String, default: null },
    ambassadorCollege: { type: String, default: "" },
    ambassadorName: { type: String, default: "" },
    ambassadorLinkedInPost: { type: String, default: "" },
  },
  { timestamps: true },
);
userSchema.pre('save', async function () {
  if (this.isNew) {
    try {
      const Settings = mongoose.model('Settings');
      const freeTokensSetting = await Settings.findOne({ key: 'interviewFreeTokens' });
      
      // If we found the setting, and interviewCredits is currently at its schema default (30)
      if (freeTokensSetting && freeTokensSetting.value !== undefined && this.interviewCredits === 30) {
        this.interviewCredits = parseInt(freeTokensSetting.value);
      }

      // Check for pre-granted bonuses
      try {
        const PreGrantedBonus = mongoose.model('PreGrantedBonus');
        if (PreGrantedBonus && this.email) {
          const formattedEmail = this.email.toLowerCase().trim();
          // Give 15 days of job portal premium by default to ALL new users
          if (!this.jobPortalPremiumExpires || this.jobPortalPremiumExpires.getTime() < Date.now() + 15 * 24 * 60 * 60 * 1000) {
            this.jobPortalPremium = true;
            this.jobPortalPremiumExpires = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
          }

          const preGrant = await PreGrantedBonus.findOne({ email: formattedEmail });
          if (preGrant) {
            this.freeResumesGranted = preGrant.freeResumesGranted || 0;
            this.freeDownloadsPerResume = preGrant.freeDownloadsPerResume || 0;
            if (preGrant.jobPortalPremiumDays > 0) {
              this.jobPortalPremium = true;
              this.jobPortalPremiumExpires = new Date(Date.now() + preGrant.jobPortalPremiumDays * 24 * 60 * 60 * 1000);
            }
            await PreGrantedBonus.deleteOne({ _id: preGrant._id });
          }
        }
      } catch (err) {
        console.error("Error applying pre-granted bonus:", err);
      }
    } catch (err) {
      console.error("Error setting default interview credits:", err);
    }
  }
});

userSchema.methods.getUserRoles = function () {
  const roleSet = new Set(this.roles && this.roles.length > 0 ? this.roles : ['student']);
  roleSet.add('student');
  if (this.internships && this.internships.length > 0) {
    roleSet.add('intern');
  }
  if (this.isAmbassador === true) {
    roleSet.add('campus_ambassador');
  }
  if (this.role === 'admin' || this.email === 'admin@code-a-nova.online') {
    roleSet.add('admin');
  }
  if (this.role && !['user', 'interview_user', 'student'].includes(this.role)) {
    roleSet.add(this.role);
  }
  return Array.from(roleSet);
};

module.exports = mongoose.model("User", userSchema);
