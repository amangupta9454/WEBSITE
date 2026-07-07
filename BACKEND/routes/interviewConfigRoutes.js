const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { verifyAdmin } = require("../middleware/verifyAdmin");
const interviewConfigController = require("../controllers/interviewConfigController");

// Public route to fetch configs for the UI (marketing pages & dashboard)
router.get("/", interviewConfigController.getAllConfigs);

// Admin route to update configs
router.put("/admin/:modeId", auth, verifyAdmin, interviewConfigController.updateConfig);

module.exports = router;
