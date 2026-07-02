const mongoose = require("mongoose");

const interviewUserSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    profileImage: { type: String, default: "" },
    credits: { type: Number, default: 3 }, // 3 free interviews
    isUnlimited: { type: Boolean, default: false },
    payments: [
      {
        packageId: { type: String },
        amount: { type: Number }, // in INR
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
        paidAt: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewUser", interviewUserSchema);
