const express = require("express");
const auth = require("../middleware/auth");
const { verifyAdmin } = require("../middleware/verifyAdmin");
const {
  submitSupportTicket,
  getAdminInquiries,
  updateInquiryStatus,
  deleteInquiry,
} = require("../controllers/contactController");

const router = express.Router();

// Public submission
router.post("/support", submitSupportTicket);

// Admin Inquiries Management
router.get("/inquiries", auth, verifyAdmin, getAdminInquiries);
router.patch("/inquiries/:id/status", auth, verifyAdmin, updateInquiryStatus);
router.delete("/inquiries/:id", auth, verifyAdmin, deleteInquiry);

module.exports = router;
