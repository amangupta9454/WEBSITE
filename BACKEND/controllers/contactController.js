const ContactInquiry = require('../models/ContactInquiry');
const mailService = require('../services/mailService');
const { sendEmail: sendEmailFallback, templates } = require('../utils/emailService');

const generateAdminAlertHtml = ({ ticketId, name, email, subject, issueType, description, date }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1e3a8a, #4338ca); color: #ffffff; padding: 24px 30px; }
    .header h2 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1; }
    .badge { display: inline-block; background: #ffffff; color: #1e3a8a; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 20px; margin-top: 10px; text-transform: uppercase; }
    .content { padding: 30px; }
    .detail-row { margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
    .detail-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .detail-value { font-size: 15px; font-weight: 600; color: #0f172a; }
    .desc-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-top: 16px; }
    .desc-title { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 8px; }
    .desc-content { font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
    .footer { background: #f8fafc; padding: 16px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .reply-btn { display: inline-block; margin-top: 18px; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📬 New Code-A-Nova Contact Inquiry</h2>
      <p>Submitted via Website Contact Portal on ${date}</p>
      <span class="badge">Ticket #${ticketId}</span>
    </div>
    <div class="content">
      <div class="detail-row">
        <div class="detail-label">Client / Sender Name</div>
        <div class="detail-value">${name}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Sender Email</div>
        <div class="detail-value"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Inquiry Classification</div>
        <div class="detail-value">${issueType}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Subject / Title</div>
        <div class="detail-value">${subject}</div>
      </div>

      <div class="desc-box">
        <div class="desc-title">Requirements / Inquiry Brief:</div>
        <div class="desc-content">${description}</div>
      </div>

      <div style="text-align: center;">
        <a href="mailto:${email}?subject=Re: [Code-A-Nova Ticket %23${ticketId}] ${encodeURIComponent(subject)}" class="reply-btn">
          Direct Reply to ${name}
        </a>
      </div>
    </div>
    <div class="footer">
      Code-A-Nova Automated Dispatcher • Delivered to: codeanova26@gmail.com
    </div>
  </div>
</body>
</html>
`;

// Helper: send with Hostinger SMTP primary, Resend fallback
const sendMailWithFallback = async ({ to, replyTo, subject, html }) => {
  // Primary attempt: Hostinger SMTP
  try {
    const res = await mailService.sendEmail({
      to,
      replyTo,
      subject,
      html,
    });
    if (res && res.success) {
      return true;
    }
  } catch (err) {
    console.warn(`[Contact] Hostinger SMTP delivery failed (${err.message}). Trying Resend fallback...`);
  }

  // Fallback attempt: Resend
  try {
    const fallbackRes = await sendEmailFallback({ to, subject, html });
    if (fallbackRes && fallbackRes.success) {
      return true;
    }
  } catch (fallbackErr) {
    console.error(`[Contact] Resend fallback failed (${fallbackErr.message}).`);
  }

  return false;
};

const submitSupportTicket = async (req, res) => {
  try {
    const { name, email, subject, issueType, description } = req.body;

    if (!name || !email || !subject || !issueType || !description) {
      return res.status(400).json({
        success: false,
        message: "Name, email, subject, issue type, and description are required.",
      });
    }

    const ticketId = Math.floor(100000 + Math.random() * 900000);
    const dateFormatted = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // 1. Permanently record inquiry in MongoDB database
    let savedInquiry = null;
    try {
      savedInquiry = await ContactInquiry.create({
        ticketId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        issueType,
        description: description.trim(),
        status: 'New',
      });
    } catch (dbErr) {
      console.error("[Contact] Database save error (continuing with email):", dbErr);
    }

    // 2. HTML template for admin alert to codeanova26@gmail.com
    const adminAlertHtml = generateAdminAlertHtml({
      ticketId,
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      issueType,
      description: description.trim(),
      date: dateFormatted,
    });

    // 3. Dispatch to codeanova26@gmail.com with Reply-To set to sender's email
    const adminEmailSuccess = await sendMailWithFallback({
      to: "codeanova26@gmail.com",
      replyTo: email.trim(),
      subject: `[New Inquiry #${ticketId}] [${issueType}] ${subject.trim()}`,
      html: adminAlertHtml,
    });

    // 4. Send acknowledgment receipt to User
    const userReceiptHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; p: 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Inquiry Received - #${ticketId}</h2>
        <p>Dear ${name.trim()},</p>
        <p>Thank you for reaching out to <strong>Code-A-Nova</strong>. We have received your inquiry regarding <strong>${subject.trim()}</strong>.</p>
        <p>Our solutions team is reviewing your requirements and will reach out to you within our guaranteed SLA:</p>
        <ul>
          <li><strong>Project Inquiries:</strong> Within 2 hours</li>
          <li><strong>Support & Student Requests:</strong> Within 24 hours</li>
        </ul>
        <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0;">
          <strong>Ticket ID:</strong> #${ticketId}<br/>
          <strong>Classification:</strong> ${issueType}
        </div>
        <p style="color: #64748b; font-size: 13px;">Warm regards,<br/>The Code-A-Nova Solutions Team</p>
      </div>
    `;

    const userEmailSuccess = await sendMailWithFallback({
      to: email.trim(),
      subject: `Inquiry Confirmation - Ticket #${ticketId} | Code-A-Nova`,
      html: userReceiptHtml,
    });

    // Update DB record with delivery status
    if (savedInquiry) {
      savedInquiry.emailSentToAdmin = adminEmailSuccess;
      savedInquiry.emailSentToUser = userEmailSuccess;
      await savedInquiry.save().catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: "Your inquiry has been submitted successfully and delivered to our team.",
      ticketId,
    });
  } catch (error) {
    console.error("[Contact] Ticket submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit your inquiry. Please try again later or email us directly at codeanova26@gmail.com",
    });
  }
};

module.exports = { submitSupportTicket };
