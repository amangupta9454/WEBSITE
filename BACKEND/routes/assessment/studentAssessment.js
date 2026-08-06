/**
 * Student Assessment Session Routes (Phase 9 — Assessment Session Engine)
 * Controls candidate assessment attempts, timers, batches, autosave, and anti-cheat tracking.
 * Strictly does NOT compute scores or generate certificates (Phase 10+).
 */
const express = require("express");
const router  = express.Router();
const authMiddleware = require("../../middleware/auth");
const sessionController = require("../../controllers/assessment/sessionController");
const evaluationController = require("../../controllers/assessment/evaluationController");
const certificateController = require("../../controllers/assessment/certificateController");
const studentPlatformController = require("../../controllers/assessment/studentPlatformController");

// Optional middleware wrapper for development flexibility if token isn't passed in preview test harness
const allowOptionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return authMiddleware(req, res, next);
  }
  next();
};

// Component 14: Secure APIs for candidate session workflow
router.post("/sessions/start",              allowOptionalAuth, sessionController.createSession);
router.post("/sessions/start-smart",        allowOptionalAuth, sessionController.createSmartSession); // AI-first 7s, DB fallback
router.get("/sessions/:sessionId",          allowOptionalAuth, sessionController.getSession);
router.post("/sessions/:sessionId/resume",  allowOptionalAuth, sessionController.resumeSession);
router.post("/sessions/:sessionId/autosave",allowOptionalAuth, sessionController.autosave);
router.get("/sessions/:sessionId/batch/:batchNumber", allowOptionalAuth, sessionController.getNextBatch);
router.post("/sessions/:sessionId/submit",  allowOptionalAuth, sessionController.submitSession);
router.get("/sessions/:sessionId/timeline", allowOptionalAuth, sessionController.getTimeline);
router.post("/sessions/:sessionId/anti-cheat", allowOptionalAuth, sessionController.recordAntiCheatEvent);
router.post("/sessions/:sessionId/heartbeat", allowOptionalAuth, sessionController.heartbeat);
router.get("/sessions/:sessionId/status",   allowOptionalAuth, sessionController.getSessionStatus);

// ── Phase 10 Result Evaluation & Scoring Engine (Candidate Access) ─────────────
router.post("/evaluate/:sessionId",         allowOptionalAuth, evaluationController.evaluateSession);
router.get("/results/:identifier",          allowOptionalAuth, evaluationController.getResult);
router.get("/results/:identifier/topics",   allowOptionalAuth, evaluationController.getTopicAnalysis);
router.get("/results/:identifier/difficulty", allowOptionalAuth, evaluationController.getDifficultyAnalysis);
router.get("/results/:identifier/bloom",    allowOptionalAuth, evaluationController.getBloomAnalysis);
router.get("/results/:identifier/anti-cheat", allowOptionalAuth, evaluationController.getAntiCheatSummary);
router.get("/results/:identifier/metadata", allowOptionalAuth, evaluationController.getEvaluationMetadata);

// ── Phase 11 Credential & Certificate Engine (Candidate & Public Verification) ─
router.post("/certificates/generate/:sessionIdOrResultId", allowOptionalAuth, certificateController.generateCertificate);
router.get("/certificates/:id",                            allowOptionalAuth, certificateController.getCertificate);
router.get("/certificates/:id/download",                   allowOptionalAuth, certificateController.downloadPDF);
router.get("/verify/:certificateId",                                      certificateController.verifyCertificate);

// ── Phase 12 Student Experience Platform APIs (Component 11 & 12) ──────────────
router.get("/student/dashboard",    allowOptionalAuth, studentPlatformController.getDashboard);
router.get("/student/catalog",      allowOptionalAuth, studentPlatformController.getAssessmentCenter);
router.get("/student/active",       allowOptionalAuth, studentPlatformController.getActiveSessions);
router.get("/student/results",      allowOptionalAuth, studentPlatformController.getResults);
router.get("/student/credentials",  allowOptionalAuth, studentPlatformController.getCredentials);
router.get("/student/timeline",     allowOptionalAuth, studentPlatformController.getTimeline);
router.get("/student/profile",      allowOptionalAuth, studentPlatformController.getProfileAndProgress);
router.get("/student/search",       allowOptionalAuth, studentPlatformController.searchPlatform);
router.put("/student/settings",     allowOptionalAuth, studentPlatformController.updateSettings);

// Legacy stubs compatibility
router.get("/categories",   (req, res) => res.json({ success: true, data: [], message: "Phase 2 / Categories active via public endpoints" }));
router.get("/history",      allowOptionalAuth, studentPlatformController.getResults);

module.exports = router;
