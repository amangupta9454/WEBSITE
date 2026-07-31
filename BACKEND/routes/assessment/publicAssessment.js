/**
 * Public Assessment Routes (no auth required)
 * Phase 1: Stubs only — full implementation in Phase 9
 */
const express = require("express");
const router  = express.Router();

router.get("/verify/:certificateId", (req, res) => {
  res.json({
    success: true,
    message: "Certificate verification — Phase 9",
    certificateId: req.params.certificateId,
  });
});

module.exports = router;
