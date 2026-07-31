const mongoose = require('mongoose');

const referralActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, default: 'N/A' },
    userName: { type: String, default: 'N/A' },
    userMobile: { type: String, default: 'N/A' },
    ambassadorCode: { type: String, required: true, uppercase: true, trim: true },
    featureName: { type: String, required: true },
    performedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

referralActivitySchema.index({ ambassadorCode: 1, user: 1, featureName: 1 });

module.exports = mongoose.model('ReferralActivity', referralActivitySchema);
