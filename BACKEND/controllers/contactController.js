const ContactInquiry = require('../models/ContactInquiry');
const mailService = require('../services/mailService');
const { sendEmail: sendEmailFallback } = require('../utils/emailService');

const sendMailWithFallback = async ({ to, subject, html, replyTo }) => {
  try {
    const primaryRes = await mailService.sendCustomEmail({
      to,
      subject,
      html,
      replyTo,
    });
    if (primaryRes && primaryRes.success) {
      return true;
    }
  } catch (primaryErr) {
    console.warn(`[Contact] Hostinger SMTP primary dispatch failed (${primaryErr.message}). Attempting Resend fallback...`);
  }

  try {
    const fallbackRes = await sendEmailFallback({ to, subject, html, replyTo });
    if (fallbackRes && fallbackRes.success) {
      return true;
    }
  } catch (fallbackErr) {
    console.error(`[Contact] Resend fallback failed (${fallbackErr.message}).`);
  }

  return false;
};

// Public endpoint: Submit Contact / Support Form
const submitSupportTicket = async (req, res) => {
  try {
    const { name, email, phone, subject, issueType, description } = req.body;

    if (!name || !email || !subject || !issueType || !description) {
      return res.status(400).json({
        success: false,
        message: "Name, email, subject, issue type, and description are required.",
      });
    }

    const ticketId = Math.floor(100000 + Math.random() * 900000);
    const dateFormatted = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // Extract phone if provided in body, else try parsing from description
    let extractedPhone = phone ? phone.trim() : '';
    if (!extractedPhone && description) {
      const match = description.match(/Contact (?:Phone\/WhatsApp|Mobile):\s*([^\n\r]+)/i);
      if (match && match[1] && match[1].toLowerCase() !== "not provided") {
        extractedPhone = match[1].trim();
      }
    }

    // 1. Instantly save inquiry to MongoDB
    const savedInquiry = await ContactInquiry.create({
      ticketId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: extractedPhone,
      subject: subject.trim(),
      issueType,
      description: description.trim(),
      status: 'New',
    });

    // 2. Respond immediately so user experiences fast submission
    res.status(200).json({
      success: true,
      message: "Your inquiry has been submitted successfully and recorded in our portal.",
      ticketId,
      inquiryId: savedInquiry._id,
    });

    // 3. Optional asynchronous background notification (does not block client)
    (async () => {
      try {
        const adminAlertHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">📬 New Code-A-Nova Contact Inquiry #${ticketId}</h2>
            <p><strong>Name:</strong> ${name.trim()}</p>
            <p><strong>Email:</strong> <a href="mailto:${email.trim()}">${email.trim()}</a></p>
            ${extractedPhone ? `<p><strong>Phone:</strong> ${extractedPhone}</p>` : ''}
            <p><strong>Type:</strong> ${issueType}</p>
            <p><strong>Subject:</strong> ${subject.trim()}</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 14px;">
              <strong>Brief:</strong><br/>
              <pre style="white-space: pre-wrap; font-family: inherit; margin: 8px 0 0 0;">${description.trim()}</pre>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Manage and mark status directly in the Code-A-Nova Admin Panel > Email Center > Contact Forms.</p>
          </div>
        `;

        await sendMailWithFallback({
          to: "codeanova26@gmail.com",
          subject: `[Contact Form #${ticketId}] ${issueType}: ${subject.trim()}`,
          html: adminAlertHtml,
          replyTo: email.trim(),
        });
      } catch (err) {
        console.warn("[Contact] Background email notification notice:", err.message);
      }
    })();

  } catch (error) {
    console.error("[Contact] Ticket submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record inquiry. Please try again or email us directly.",
    });
  }
};

// Admin endpoint: Get all inquiries with filtering & status counters
const getAdminInquiries = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { subject: searchRegex },
        { issueType: searchRegex },
      ];
      // Check if search is numeric ticketId
      const numericId = parseInt(search.trim(), 10);
      if (!isNaN(numericId)) {
        query.$or.push({ ticketId: numericId });
      }
    }

    const inquiries = await ContactInquiry.find(query).sort({ createdAt: -1 });

    // Aggregate status counts
    const countsAgg = await ContactInquiry.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      total: 0,
      new: 0,
      contacted: 0,
      inProgress: 0,
      resolved: 0,
    };

    countsAgg.forEach(item => {
      counts.total += item.count;
      if (item._id === 'New') counts.new = item.count;
      if (item._id === 'Contacted') counts.contacted = item.count;
      if (item._id === 'In Progress') counts.inProgress = item.count;
      if (item._id === 'Resolved') counts.resolved = item.count;
    });

    res.status(200).json({
      success: true,
      inquiries,
      counts,
    });
  } catch (error) {
    console.error("[Contact] Error fetching admin inquiries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact inquiries.",
    });
  }
};

// Admin endpoint: Update status or notes on an inquiry
const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const inquiry = await ContactInquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found.",
      });
    }

    if (status) {
      inquiry.status = status;
      if (status === 'Contacted' && !inquiry.contactedAt) {
        inquiry.contactedAt = new Date();
        inquiry.contactedBy = req.user?.email || 'Admin';
      }
      if (status === 'Resolved' && !inquiry.resolvedAt) {
        inquiry.resolvedAt = new Date();
      }
    }

    if (adminNotes !== undefined) {
      inquiry.adminNotes = adminNotes;
    }

    await inquiry.save();

    res.status(200).json({
      success: true,
      message: `Inquiry #${inquiry.ticketId} marked as ${inquiry.status}.`,
      inquiry,
    });
  } catch (error) {
    console.error("[Contact] Error updating inquiry status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update inquiry status.",
    });
  }
};

// Admin endpoint: Delete an inquiry
const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const inquiry = await ContactInquiry.findByIdAndDelete(id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Inquiry #${inquiry.ticketId} has been deleted.`,
    });
  } catch (error) {
    console.error("[Contact] Error deleting inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete inquiry.",
    });
  }
};

module.exports = {
  submitSupportTicket,
  getAdminInquiries,
  updateInquiryStatus,
  deleteInquiry,
};
