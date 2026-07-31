/**
 * Admin Assessment Routes
 * All routes require admin authentication.
 * Phase 1: Stubs only — full implementation in Phase 2+
 */

const express = require("express");
const router  = express.Router();
const { verifyAdmin } = require("../../middleware/verifyAdmin");
const groqManager = require("../../services/assessment/GroqManager");

// ── Health Check ───────────────────────────────────────────────────────────
router.get("/groq/health", verifyAdmin, (req, res) => {
  res.json({
    success:         true,
    totalKeys:       groqManager.totalKeyCount,
    healthyKeys:     groqManager.healthyKeyCount,
    keys:            groqManager.getHealthStatus(),
  });
});

// ── Dashboard Overview (Stub) ──────────────────────────────────────────────
router.get("/dashboard", verifyAdmin, async (req, res) => {
  res.json({
    success:  true,
    message:  "Assessment Dashboard — Phase 2 onwards",
    stats: {
      totalCategories:    0,
      totalSubcategories: 0,
      totalQuestions:     0,
      totalSessions:      0,
      totalCertificates:  0,
      groqHealth: {
        totalKeys:   groqManager.totalKeyCount,
        healthyKeys: groqManager.healthyKeyCount,
      },
    },
  });
});

// ── Placeholders (Phase 2+) ────────────────────────────────────────────────
router.get("/categories",    verifyAdmin, (req, res) => res.json({ success: true, data: [], message: "Phase 2" }));
router.get("/subcategories", verifyAdmin, (req, res) => res.json({ success: true, data: [], message: "Phase 2" }));
router.get("/questions",     verifyAdmin, (req, res) => res.json({ success: true, data: [], message: "Phase 4" }));
router.get("/jobs",          verifyAdmin, (req, res) => res.json({ success: true, data: [], message: "Phase 6" }));
router.get("/certificates",  verifyAdmin, (req, res) => res.json({ success: true, data: [], message: "Phase 9" }));
router.get("/analytics/overview", verifyAdmin, (req, res) => res.json({ success: true, data: {}, message: "Phase 11" }));

module.exports = router;
