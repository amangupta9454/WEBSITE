const mongoose = require('mongoose');

const circuitBreakerSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: 'email'
    },
    isTripped: {
      type: Boolean,
      default: false
    },
    trippedAt: {
      type: Date,
      default: null
    },
    consecutiveFailures: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.CircuitBreaker || mongoose.model('CircuitBreaker', circuitBreakerSchema);
