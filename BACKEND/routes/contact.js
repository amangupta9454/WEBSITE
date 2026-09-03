const express = require("express");
const auth = require("../middleware/auth");
const { verifyAdmin } = require("../middleware/verifyAdmin");
const {
  submitSupportTicket,
  getAdminInquiries,
  sendInquiryEmailReply,
  syncInquiryReplies,
  logManualMessage,
  updateInquiryStatus,
  deleteInquiry,
} = require("../controllers/contactController");

const router = express.Router();

// Public contact form submission
router.post("/support", submitSupportTicket);

// Admin Inquiries Management & Direct Messaging
router.get("/inquiries", auth, verifyAdmin, getAdminInquiries);
router.post("/inquiries/:id/reply", auth, verifyAdmin, sendInquiryEmailReply);
router.post("/inquiries/:id/sync", auth, verifyAdmin, syncInquiryReplies);
router.post("/inquiries/:id/log-message", auth, verifyAdmin, logManualMessage);
router.patch("/inquiries/:id/status", auth, verifyAdmin, updateInquiryStatus);
router.delete("/inquiries/:id", auth, verifyAdmin, deleteInquiry);

module.exports = router;
