const mailService = require('../services/mailService');

/**
 * Controller to handle transactional and automated email requests.
 * Acts as an SMTP gateway for Google Apps Script and other automated microservices.
 * Note: No email templates are stored or rendered in this controller; it simply routes complete HTML payloads.
 */
exports.sendEmail = async (req, res) => {
  try {
    const { email, to, subject, html, replyTo, cc, bcc, attachments } = req.body;
    const recipient = email || to;

    // 1. Strict Payload Validation
    if (!recipient || typeof recipient !== 'string' || !recipient.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: A valid recipient email address is required in field "email".',
      });
    }

    if (!subject || typeof subject !== 'string' || subject.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Email subject cannot be blank (field: "subject").',
      });
    }

    if (!html || typeof html !== 'string' || html.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Complete HTML template string is required in field "html".',
      });
    }

    // 2. Invoke Service Layer (Controller never directly interacts with Nodemailer)
    const result = await mailService.sendEmail({
      to: recipient.trim(),
      subject: subject.trim(),
      html,
      replyTo,
      cc,
      bcc,
      attachments,
    });

    // 3. Structured Error Response on SMTP Failure
    if (!result.success) {
      console.error(`[MailController] ❌ Delivery failure for [${recipient}]: ${result.error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to transmit email via SMTP gateway',
        error: process.env.NODE_ENV === 'development' ? result.error : undefined,
      });
    }

    // 4. Return success response per specification
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
 * Supports future platform expansions: quizzes, certificates, newsletters, and mass announcements.
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
