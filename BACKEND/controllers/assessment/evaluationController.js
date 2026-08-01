const ResultEvaluationEngine = require("../../services/assessment/ResultEvaluationEngine");
const AssessmentResult = require("../../models/assessment/AssessmentResult");
const AssessmentSession = require("../../models/assessment/AssessmentSession");

/**
 * Component 14: Secure APIs for Result Evaluation & Scoring Engine
 * Governs evaluation triggering and multi-dimensional analytics result queries with admin and candidate authorization checks.
 */
exports.evaluateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const forceReevaluate = req.body?.forceReevaluate === true && req.user?.role === "admin";

    const result = await ResultEvaluationEngine.evaluateSession(sessionId, { forceReevaluate });
    if (!result.success) {
      if (result.code === "ALREADY_EVALUATED") {
        return res.status(200).json(result);
      }
      return res.status(400).json(result);
    }
    return res.status(201).json(result);
  } catch (err) {
    console.error("[evaluationController.evaluateSession]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getResult = async (req, res) => {
  try {
    const { identifier } = req.params;
    const details = await ResultEvaluationEngine.getResult(identifier);
    if (!details.success) {
      return res.status(404).json(details);
    }

    // Candidate authorization: verify candidate owns result or caller is admin
    const requester = req.user?.email || req.user?.id;
    if (
      req.user &&
      req.user.role !== "admin" &&
      requester &&
      details.result.candidateId !== requester &&
      details.result.userId?.toString() !== requester
    ) {
      return res.status(403).json({ success: false, error: "SECURITY_UNAUTHORIZED: Access denied to evaluation results." });
    }

    return res.status(200).json({ success: true, data: details.result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTopicAnalysis = async (req, res) => {
  try {
    const { identifier } = req.params;
    const details = await ResultEvaluationEngine.getResult(identifier);
    if (!details.success) return res.status(404).json(details);
    return res.status(200).json({
      success: true,
      resultId: details.result.resultId,
      sessionId: details.result.sessionId,
      topicAnalysis: details.result.topicAnalysis || [],
      strengthsAndWeaknesses: details.result.strengthsAndWeaknesses || {},
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDifficultyAnalysis = async (req, res) => {
  try {
    const { identifier } = req.params;
    const details = await ResultEvaluationEngine.getResult(identifier);
    if (!details.success) return res.status(404).json(details);
    return res.status(200).json({
      success: true,
      resultId: details.result.resultId,
      sessionId: details.result.sessionId,
      difficultyAnalysis: details.result.difficultyAnalysis || {},
      strongDifficulties: details.result.strengthsAndWeaknesses?.strongDifficulties || [],
      weakDifficulties: details.result.strengthsAndWeaknesses?.weakDifficulties || [],
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBloomAnalysis = async (req, res) => {
  try {
    const { identifier } = req.params;
    const details = await ResultEvaluationEngine.getResult(identifier);
    if (!details.success) return res.status(404).json(details);
    return res.status(200).json({
      success: true,
      resultId: details.result.resultId,
      sessionId: details.result.sessionId,
      bloomAnalysis: details.result.bloomAnalysis || {},
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAntiCheatSummary = async (req, res) => {
  try {
    const { identifier } = req.params;
    const details = await ResultEvaluationEngine.getResult(identifier);
    if (!details.success) return res.status(404).json(details);
    return res.status(200).json({
      success: true,
      resultId: details.result.resultId,
      sessionId: details.result.sessionId,
      riskSummary: details.result.riskSummary || {},
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getEvaluationMetadata = async (req, res) => {
  try {
    const { identifier } = req.params;
    const details = await ResultEvaluationEngine.getResult(identifier);
    if (!details.success) return res.status(404).json(details);
    return res.status(200).json({
      success: true,
      resultId: details.result.resultId,
      sessionId: details.result.sessionId,
      evaluationMetadata: details.result.evaluationMetadata || {},
      integrity: details.result.integrity || {},
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Admin Evaluation Console & Queue APIs (Component 15) ──────────────────────
exports.adminGetEvaluationQueue = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status && status !== "All") {
      query["scoreSummary.status"] = status;
    }
    if (search) {
      query.$or = [
        { resultId: { $regex: search, $options: "i" } },
        { sessionId: { $regex: search, $options: "i" } },
        { candidateId: { $regex: search, $options: "i" } },
      ];
    }

    const total = await AssessmentResult.countDocuments(query);
    const results = await AssessmentResult.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    // Also count pending locked sessions from Phase 9 awaiting Phase 10 evaluation
    const pendingCount = await AssessmentSession.countDocuments({
      isLocked: true,
      evaluationStatus: { $ne: "EVALUATED_PHASE_10" },
    });

    const pendingSessions = await AssessmentSession.find({
      isLocked: true,
      evaluationStatus: { $ne: "EVALUATED_PHASE_10" },
    })
      .limit(5)
      .select("sessionId candidateId submittedAt attemptNumber totalQuestions")
      .lean();

    return res.status(200).json({
      success: true,
      results,
      total,
      pendingQueueCount: pendingCount,
      pendingSessions,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.adminTriggerBulkEvaluation = async (req, res) => {
  try {
    const pendingSessions = await AssessmentSession.find({
      isLocked: true,
      evaluationStatus: { $ne: "EVALUATED_PHASE_10" },
    }).limit(50).lean();

    let successCount = 0;
    let failCount = 0;

    for (const sess of pendingSessions) {
      const outcome = await ResultEvaluationEngine.evaluateSession(sess.sessionId);
      if (outcome.success) successCount++;
      else failCount++;
    }

    return res.status(200).json({
      success: true,
      evaluated: successCount,
      failed: failCount,
      message: `Bulk evaluation batch completed: ${successCount} processed successfully. Handoff to Phase 11 queued.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
