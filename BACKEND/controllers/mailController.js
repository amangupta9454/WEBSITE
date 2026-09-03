const mailService = require('../services/mailService');

/**
 * Reusable validator for email transmission payloads (Fix 6)
 * Validates email addresses, missing subject, extremely large HTML payloads, and oversized/invalid attachments.
 */
function validateEmailPayload(payload = {}) {
  const recipient = payload.email || payload.to;
  
  if (!recipient || typeof recipient !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim())) {
    return 'Validation Error: A valid recipient email address is required (field: "email" or "to").';
  }

  if (!payload.subject || typeof payload.subject !== 'string' || payload.subject.trim() === '') {
    return 'Validation Error: Email subject cannot be blank (field: "subject").';
  }

  if (!payload.html || typeof payload.html !== 'string' || payload.html.trim() === '') {
    return 'Validation Error: Complete HTML template string is required in field "html".';
  }

  if (payload.html.length > 5 * 1024 * 1024) {
    return 'Validation Error: Extremely large HTML payload (exceeds 5MB limit).';
  }

  if (payload.attachments !== undefined && payload.attachments !== null) {
    if (!Array.isArray(payload.attachments)) {
      return 'Validation Error: "attachments" must be an array of attachment objects.';
    }
    for (const att of payload.attachments) {
      if (!att || typeof att !== 'object') {
        return 'Validation Error: Invalid attachment metadata structure.';
      }
      let size = att.size || 0;
      if (att.content) {
        size = typeof att.content === 'string' ? att.content.length : (Buffer.isBuffer(att.content) ? att.content.length : size);
      }
      if (size > 15 * 1024 * 1024) {
        return `Validation Error: Oversized attachment "${att.filename || 'file'}" exceeds the 15MB limit.`;
      }
    }
  }

  return null;
}

/**
 * Controller to handle transactional and automated email requests.
 * Acts as an SMTP gateway for Google Apps Script and other automated microservices.
 * Note: No email templates are stored or rendered in this controller; it simply routes complete HTML payloads.
 */
exports.sendEmail = async (req, res) => {
  try {
    const validationError = validateEmailPayload(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const { email, to, subject, html, text, replyTo, cc, bcc, attachments, campaign, source, name, recipientName } = req.body;
    const recipient = email || to;

    // Invoke Service Layer (Controller never directly interacts with Nodemailer)
    const result = await mailService.sendEmail({
      to: recipient.trim(),
      subject: subject.trim(),
      html,
      text,
      from: '"Code-A-Nova" <manager@code-a-nova.online>',
      replyTo: (replyTo && !replyTo.includes('hr@code-a-nova.online')) ? replyTo : "manager@code-a-nova.online",
      cc,
      bcc,
      attachments,
      campaign,
      source: source || 'Google Apps Script',
      recipientName: recipientName || name || '',
    });

    // Structured Error Response on SMTP Failure
    if (!result.success) {
      console.error(`[MailController] ❌ Delivery failure for [${recipient}]: ${result.error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to transmit email via SMTP gateway',
        error: process.env.NODE_ENV === 'development' ? result.error : undefined,
      });
    }

    // Return success response per specification
    return res.status(200).json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('[MailController] ❌ Uncaught server exception in sendEmail handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing email delivery',
    });
  }
};

/**
 * Controller endpoint for batch email transmission.
 * Supports future platform expansions: internships, quizzes, certificates, newsletters, and mass announcements.
 */
exports.sendBatchEmails = async (req, res) => {
  try {
    const { emails, delayMs } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: An array of email payload objects is required in field "emails".',
      });
    }

    if (emails.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Batch Limit Exceeded: A maximum of 500 emails can be submitted per batch request.',
      });
    }

    for (let i = 0; i < emails.length; i++) {
      const err = validateEmailPayload(emails[i]);
      if (err) {
        return res.status(400).json({
          success: false,
          message: `Validation Error in batch item [index ${i}]: ${err}`,
        });
      }
    }

    const delay = typeof delayMs === 'number' ? delayMs : 1000;
    const summary = await mailService.sendBatchEmails(emails, delay);

    return res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('[MailController] ❌ Uncaught exception in sendBatchEmails handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing batch emails',
    });
  }
};
