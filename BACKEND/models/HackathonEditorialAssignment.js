const mongoose = require('mongoose');

const hackathonEditorialAssignmentSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: String,
      default: 'can-hackathon-2026',
      index: true,
      trim: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HackathonTeam',
      required: true,
      index: true,
    },
    teamId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HackathonSubmission',
      required: true,
      index: true,
    },
    editorialMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HackathonEditorialMember',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'UNASSIGNED'],
      default: 'ACTIVE',
      index: true,
    },
    assignedBy: {
      type: String,
      default: 'admin',
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    unassignedAt: {
      type: Date,
      default: null,
    },
    unassignedBy: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound partial unique index: A judge cannot be actively assigned to the same team more than once
hackathonEditorialAssignmentSchema.index(
  { hackathonId: 1, team: 1, editorialMember: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' },
  }
);

module.exports = mongoose.model('HackathonEditorialAssignment', hackathonEditorialAssignmentSchema);
