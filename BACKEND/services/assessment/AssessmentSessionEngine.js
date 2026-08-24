const SessionCreationService = require("./session/SessionCreationService");
const BatchManagerService = require("./session/BatchManagerService");
const TimerEngine = require("./session/TimerEngine");
const AutosaveService = require("./session/AutosaveService");
const ResumeEngine = require("./session/ResumeEngine");
const AntiCheatTracker = require("./session/AntiCheatTracker");
const SubmissionLockService = require("./session/SubmissionLockService");
const AssessmentSession = require("../../models/assessment/AssessmentSession");

/**
 * Phase 9 — Assessment Session Engine (Master Facade)
 * Controls the entire lifecycle of a student assessment attempt from creation to submission locking.
 * Strictly avoids evaluating answers, generating scores/certificates, or updating leaderboards (Phase 10+).
 */
class AssessmentSessionEngine {
  /** Component 1: Session Creation with Component 2 Config Snapshot & Component 3 Question Snapshot */
  static async startAssessment(params) {
    return await SessionCreationService.createSession(params);
  }

  /** Component 4: Batch Manager Question Delivery */
  static async getQuestionBatch(sessionId, batchNumber = 1, candidateId = null) {
    return await BatchManagerService.getQuestionBatch(sessionId, batchNumber, candidateId);
  }

  /** Component 5 & 16: Timer Engine & Server Authoritative Heartbeat Health */
  static async checkHeartbeatAndTimer(sessionId, options = { registerHeartbeat: true, candidateId: null }) {
    return await TimerEngine.checkTimerAndHeartbeat(sessionId, options);
  }

  /** Component 6 & 13: Real-time Autosave & Offline Resilience Queue Sync */
  static async autosave(params) {
    return await AutosaveService.executeAutosave(params);
  }

  /** Component 7: Resume Engine (Restore state, timer, flags without restart) */
  static async resumeAssessment(params) {
    return await ResumeEngine.resumeSession(params);
  }

  /** Component 10 & 11: Anti-Cheat Telemetry Tracking & Immutable Timeline */
  static async trackAntiCheatEvent(params) {
    return await AntiCheatTracker.recordEvent(params);
  }

  /** Component 12: Submission Lock & Phase 10 Handoff Preparation */
  static async submitAssessment(params) {
    return await SubmissionLockService.submitAndLock(params);
  }

  /** Retrieves exhaustive session audit status, timeline, and anti-cheat history for admin inspection */
  static async getSessionDetails(sessionId) {
    try {
      const session = await AssessmentSession.findOne({ sessionId })
        .populate("userId", "name email").populate("configId")
        .populate("subcategoryId", "name description")
        .lean();
      if (!session) {
        return { success: false, error: "Session not found." };
      }
      return { success: true, session };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /** Retrieves paginated listing of all assessment sessions with filter support */
  static async listSessions({ page = 1, limit = 20, status, search, subcategoryId }) {
    try {
      const query = {};
      if (status && status !== "All") query.status = status;
      if (subcategoryId) query.subcategoryId = subcategoryId;
      if (search) {
        query.$or = [
          { sessionId: { $regex: search, $options: "i" } },
          { candidateId: { $regex: search, $options: "i" } },
        ];
      }
      const total = await AssessmentSession.countDocuments(query);
      const sessions = await AssessmentSession.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate("subcategoryId", "name")
        .lean();
      return {
        success: true,
        sessions,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = AssessmentSessionEngine;
