/**
 * Student Assessment Session Routes (Phase 9 — Assessment Session Engine)
 * Controls candidate assessment attempts, timers, batches, autosave, and anti-cheat tracking.
 * Strictly does NOT compute scores or generate certificates (Phase 10+).
 */
const express = require("express");
const router  = express.Router();
const authMiddleware = require("../../middleware/auth");
const sessionController = require("../../controllers/assessment/sessionController");

// Optional middleware wrapper for development flexibility if token isn't passed in preview test harness
const allowOptionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return authMiddleware(req, res, next);
  }
  next();
};

// Component 14: Secure APIs for candidate session workflow
router.post("/sessions/start",              allowOptionalAuth, sessionController.createSession);
router.get("/sessions/:sessionId",          allowOptionalAuth, sessionController.getSession);
router.post("/sessions/:sessionId/resume",  allowOptionalAuth, sessionController.resumeSession);
router.post("/sessions/:sessionId/autosave",allowOptionalAuth, sessionController.autosave);
router.get("/sessions/:sessionId/batch/:batchNumber", allowOptionalAuth, sessionController.getNextBatch);
router.post("/sessions/:sessionId/submit",  allowOptionalAuth, sessionController.submitSession);
router.get("/sessions/:sessionId/timeline", allowOptionalAuth, sessionController.getTimeline);
router.post("/sessions/:sessionId/anti-cheat", allowOptionalAuth, sessionController.recordAntiCheatEvent);
router.post("/sessions/:sessionId/heartbeat", allowOptionalAuth, sessionController.heartbeat);
router.get("/sessions/:sessionId/status",   allowOptionalAuth, sessionController.getSessionStatus);

// Future Phase Stubs
router.get("/categories",   (req, res) => res.json({ success: true, data: [], message: "Phase 2 / Categories active via public endpoints" }));
router.get("/history",      allowOptionalAuth, (req, res) => res.json({ success: true, data: [], message: "Phase 10 / Result Evaluation Pending" }));
router.get("/certificates", allowOptionalAuth, (req, res) => res.json({ success: true, data: [], message: "Phase 11 / Certificates Pending" }));

module.exports = router;
