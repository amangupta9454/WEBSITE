const mongoose = require('mongoose');

const hackathonAuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: String,
      default: 'system',
    },
    actorName: {
      type: String,
      default: 'System',
    },
    actorEmail: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['admin', 'editorial', 'judge', 'system'],
      default: 'admin',
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetEntity: {
      type: String,
      required: true,
      enum: ['HackathonSetting', 'HackathonTeam', 'HackathonSubmission', 'Evaluation', 'General'],
      default: 'General',
      index: true,
    },
    targetId: {
      type: String,
      default: '',
      index: true,
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    reason: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable append-only log
  }
);

// Helper static for logging actions easily
hackathonAuditLogSchema.statics.log = async function ({
  actorId,
  actorName,
  actorEmail,
  role = 'admin',
  action,
  targetEntity = 'General',
  targetId = '',
  previousState = null,
  newState = null,
  reason = '',
  req = null,
}) {
  try {
    let ipAddress = '';
    let userAgent = '';
    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
      userAgent = req.headers['user-agent'] || '';
    }

    return await this.create({
      actorId: actorId ? String(actorId) : 'system',
      actorName: actorName || 'Admin User',
      actorEmail: actorEmail || '',
      role,
      action,
      targetEntity,
      targetId: targetId ? String(targetId) : '',
      previousState,
      newState,
      reason,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error('Failed to write Hackathon Audit Log:', err);
    return null;
  }
};

module.exports = mongoose.model('HackathonAuditLog', hackathonAuditLogSchema);
