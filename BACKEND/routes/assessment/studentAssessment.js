/**
 * Student Assessment Routes
 * Phase 1: Stubs only — full implementation in Phase 7+
 */
const express = require("express");
const router  = express.Router();
const authMiddleware = require("../../middleware/auth");

router.get("/categories",       (req, res) => res.json({ success: true, data: [], message: "Phase 2" }));
router.get("/history",          authMiddleware, (req, res) => res.json({ success: true, data: [], message: "Phase 10" }));
router.get("/certificates",     authMiddleware, (req, res) => res.json({ success: true, data: [], message: "Phase 9" }));
router.post("/sessions/start",  authMiddleware, (req, res) => res.json({ success: true, message: "Phase 7" }));

module.exports = router;
