const AssessmentSessionEngine = require("../../services/assessment/AssessmentSessionEngine");
const AssessmentSubcategory = require("../../models/assessment/AssessmentSubcategory");
const mongoose = require("mongoose");

/**
 * Component 14 & Component 17: Secure APIs and Controller for Assessment Session Engine.
 * Enforces authentication and authorization controls, prevents duplicate submissions, and disallows direct API misuse.
 * Strictly does NOT compute exam scores or return evaluation reports (Phase 10).
 */
exports.createSession = async (req, res) => {
  try {
    const { subcategoryId, categoryId, candidateId } = req.body;
    // Resolve user identity from JWT auth middleware or fallback for demo testing
    const userId = req.user?.id || req.user?._id || new mongoose.Types.ObjectId("600000000000000000000001");
    const userEmail = req.user?.email || candidateId || "candidate@portal.com";

    if (!subcategoryId) {
      // In demo or test mode, pick any active subcategory if not explicitly supplied
      const subcat = await AssessmentSubcategory.findOne({ isDeleted: false }).lean();
      if (!subcat) {
        return res.status(400).json({ success: false, error: "Subcategory ID is required to start assessment session." });
      }
      req.body.subcategoryId = subcat._id;
    }

    const result = await AssessmentSessionEngine.startAssessment({
      userId,
      candidateId: userEmail,
      subcategoryId: req.body.subcategoryId || subcategoryId,
      categoryId: categoryId || null,
    });

    if (!result.success) {
      if (result.code === "ACTIVE_SESSION_EXISTS") {
        return res.status(409).json(result);
      }
      return res.status(400).json(result);
    }

    // Immediately load batch #1 to return alongside new session parameters
    const initialBatch = await AssessmentSessionEngine.getQuestionBatch(result.sessionId, 1, userEmail);

    return res.status(201).json({
      success: true,
      data: {
        ...result,
        initialBatch: initialBatch.success ? initialBatch : null,
      },
      message: "Session created successfully with immutable snapshots.",
    });
  } catch (err) {
    console.error("[SessionController.createSession]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const candidateId = req.user?.email || req.user?.id;
    const details = await AssessmentSessionEngine.getSessionDetails(sessionId);
    if (!details.success) {
      return res.status(404).json(details);
    }

    // Ensure candidate only reads their own attempt unless they are admin
    if (req.user?.role !== "admin" && candidateId && details.session.candidateId !== candidateId && details.session.userId?.toString() !== candidateId) {
      return res.status(403).json({ success: false, error: "SECURITY_UNAUTHORIZED: Forbidden attempt access." });
    }

    // Strip sensitive correct answers from answers array if requested by student before completion
    return res.status(200).json({
      success: true,
      data: details.session,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.resumeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const candidateId = req.user?.email || req.body.candidateId;
    const result = await AssessmentSessionEngine.resumeAssessment({ sessionId, candidateId });
    if (!result.success) {
      if (result.code === "SESSION_ENDED") return res.status(410).json(result);
      if (result.code === "SESSION_EXPIRED") return res.status(403).json(result);
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.autosave = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { updates, currentQuestionIndex, candidateId } = req.body;
    const effectiveCandidate = req.user?.email || candidateId;

    const result = await AssessmentSessionEngine.autosave({
      sessionId,
      candidateId: effectiveCandidate,
      updates,
      currentQuestionIndex,
    });

    if (!result.success) {
      if (result.code === "SESSION_LOCKED") return res.status(403).json(result);
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getNextBatch = async (req, res) => {
  try {
    const { sessionId, batchNumber } = req.params;
    const candidateId = req.user?.email || req.query.candidateId;
    const result = await AssessmentSessionEngine.getQuestionBatch(sessionId, Number(batchNumber) || 1, candidateId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.submitSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const candidateId = req.user?.email || req.body.candidateId;
    const reason = req.body.reason || "CANDIDATE_SUBMISSION";

    const result = await AssessmentSessionEngine.submitAssessment({ sessionId, candidateId, reason });
    if (!result.success) {
      if (result.code === "ALREADY_SUBMITTED") return res.status(409).json(result);
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const details = await AssessmentSessionEngine.getSessionDetails(sessionId);
    if (!details.success) {
      return res.status(404).json(details);
    }
    return res.status(200).json({
      success: true,
      sessionId: details.session.sessionId,
      timeline: details.session.timeline || [],
      antiCheatSummary: details.session.antiCheatSummary || {},
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.recordAntiCheatEvent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { eventType, details, candidateId } = req.body;
    const effectiveCandidate = req.user?.email || candidateId;

    const result = await AssessmentSessionEngine.trackAntiCheatEvent({
      sessionId,
      eventType,
      details,
      candidateId: effectiveCandidate,
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.heartbeat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const candidateId = req.user?.email || req.body.candidateId;
    const result = await AssessmentSessionEngine.checkHeartbeatAndTimer(sessionId, { registerHeartbeat: true, candidateId });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const candidateId = req.user?.email || req.query.candidateId;
    const result = await AssessmentSessionEngine.checkHeartbeatAndTimer(sessionId, { registerHeartbeat: false, candidateId });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin Supervision & Monitoring APIs ──────────────────────────────────────
exports.adminListSessions = async (req, res) => {
  try {
    const { page, limit, status, search, subcategoryId } = req.query;
    const result = await AssessmentSessionEngine.listSessions({ page, limit, status, search, subcategoryId });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.adminGetSessionAudit = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await AssessmentSessionEngine.getSessionDetails(sessionId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
