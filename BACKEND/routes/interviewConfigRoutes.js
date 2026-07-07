const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { verifyAdmin } = require("../middleware/adminMiddleware");
const interviewConfigController = require("../controllers/interviewConfigController");

// Public (or authenticated student) route to fetch configs for the UI
router.get("/", auth, interviewConfigController.getAllConfigs);

// Admin route to update configs
router.put("/admin/:modeId", auth, verifyAdmin, interviewConfigController.updateConfig);

module.exports = router;
