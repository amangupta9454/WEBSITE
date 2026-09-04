const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const hackathonEditorialMemberSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: String,
      default: 'can-hackathon-2026',
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Prevent password hash from returning in queries by default
    },
    role: {
      type: String,
      enum: ['editorial', 'judge'],
      default: 'editorial',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: String,
      default: 'admin',
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for email within the hackathon scope
hackathonEditorialMemberSchema.index({ hackathonId: 1, email: 1 }, { unique: true });

// Method to verify password
hackathonEditorialMemberSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to generate JWT token for Editorial Member
hackathonEditorialMemberSchema.methods.generateAuthToken = function () {
  const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'secret';
  return jwt.sign(
    {
      id: this._id,
      editorialMemberId: this._id,
      email: this.email,
      name: this.name,
      role: 'editorial',
      hackathonId: this.hackathonId,
    },
    secret,
    { expiresIn: '7d' }
  );
};

module.exports = mongoose.model('HackathonEditorialMember', hackathonEditorialMemberSchema);
