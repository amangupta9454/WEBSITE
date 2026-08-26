const nodemailer = require('nodemailer');
const { ImapFlow } = require('imapflow');
const MailComposer = require('nodemailer/lib/mail-composer');
const { mailConfig, defaultSender } = require('../config/mailConfig');
const emailLogger = require('./emailLogger');
const sendSafeEmail = require('../utils/safeMailSender');

/**
 * Mail Service for Code-A-Nova
 * Acts as an SMTP Gateway using Hostinger SMTP.
 * Decoupled from Express controllers to allow direct usage in cron jobs, workers, and batch pipelines.
 */
class MailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  /**
   * Initializes the Nodemailer transporter with Hostinger SMTP configuration.
   */
  initTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        ...mailConfig,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === "production" ? true : false,
        },
      });

      this.transporter.verify((err) => {
        if (err) {
          console.error("SMTP Verify Failed:", err.message);
        } else {
          console.log("Hostinger SMTP Connected Successfully");
        }
      });
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Appends the sent email to the Hostinger IMAP Sent folder.
   * @param {Buffer} rawMessage - The raw RFC822 formatted email message
   */
  async saveToSentFolder(rawMessage) {
    let client = null;
    try {
      client = new ImapFlow({
        host: 'imap.hostinger.com',
        port: 993,
        secure: true,
        auth: {
          user: mailConfig.auth.user,
          pass: mailConfig.auth.pass,
        },
        logger: false, // Set to true for debugging
      });

      await client.connect();
      
      // Append the raw message buffer to the Sent folder
      // Hostinger usually maps Sent to "Sent" folder
      await client.append('Sent', rawMessage, ['\\Seen']);
      console.log('[MailService] ✔️ Email successfully appended to Sent folder via IMAP.');
    } catch (error) {
      console.error('[MailService] ⚠️ Failed to append email to Sent folder (non-blocking):', error.message);
    } finally {
      if (client) {
        try {
          await client.logout();
        } catch (logoutError) {
          console.error('[MailService] ⚠️ Error logging out of IMAP:', logoutError.message);
        }
      }
    }
  }

  /**
   * Sends a single email using Hostinger SMTP and automatically logs historical record to MongoDB.
   * @param {Object} options - Email configuration object
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject line
   * @param {string} options.html - Complete HTML template body (received from Apps Script or caller)
   * @param {string} [options.from] - Custom sender (defaults to SMTP_USER)
   * @param {string} [options.replyTo] - Optional reply-to address
   * @param {Array} [options.attachments] - Optional array of file attachments
   * @param {string|Array} [options.cc] - Optional CC recipient(s)
   * @param {string|Array} [options.bcc] - Optional BCC recipient(s)
   * @param {string} [options.campaign] - Optional campaign classification
   * @param {string} [options.source] - Optional source identifier
   * @param {string} [options.recipientName] - Optional recipient name
   * @param {string} [options.text] - Optional plain text fallback
   * @returns {Promise<{success: boolean, messageId?: string, accepted?: Array, error?: string, code?: string}>}
   */
  async sendEmail({
    to,
    subject,
    html,
    from = `"Code-A-Nova" <${process.env.SMTP_USER}>`,
    replyTo = process.env.SMTP_USER,
    attachments,
    cc,
    bcc,
    text,
    campaign,
    source,
    recipientName,
  }) {
    try {
      if (!this.transporter) {
        this.initTransporter();
      }

      if (!this.transporter) {
        throw new Error("SMTP transporter not initialized.");
      }

      const mailOptions = {
        from,
        to,
        subject,
        // Plain text fallback
        text:
          text ||
          html
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
        html,
        replyTo,
        ...(cc && { cc }),
        ...(bcc && { bcc }),
        ...(attachments && { attachments }),
      };

      const finalCampaign = campaign || 'General';
      const finalSource = source || 'Google Apps Script';

      const info = await sendSafeEmail(this.transporter, mailOptions, campaign, finalSource);

      console.log("==========================================");
      console.log("EMAIL SENT (Diagnostics)");
      console.log("To:", to);
      console.log("Subject:", subject);
      console.log("Campaign:", finalCampaign);
      console.log("Source:", finalSource);
      console.log("Message ID:", info.messageId);
      console.log("Accepted:", info.accepted);
      console.log("Rejected:", info.rejected);
      console.log("SMTP Response:", info.response || "250 OK");
      console.log("==========================================");

      // Save to IMAP Sent Folder asynchronously
      try {
        // We use MailComposer to generate the exact raw MIME message based on our mailOptions
        // Adding the Message-Id from info ensures the exact ID sent is saved
        const saveOptions = { ...mailOptions, messageId: info.messageId };
        const mail = new MailComposer(saveOptions);
        const rawMessage = await mail.compile().build();
        
        // Fire and forget appending to avoid blocking the API response
        this.saveToSentFolder(rawMessage);
      } catch (imapErr) {
        console.error("[MailService] ⚠️ IMAP message generation failed (non-blocking exception):", imapErr.message);
      }

      // Logging is now handled centrally by sendSafeEmail to avoid duplicates


      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (error) {
      const finalCampaign = campaign || "General";
      const finalSource = source || "Google Apps Script";

      console.error("==========================================");
      console.error("EMAIL FAILED (Diagnostics)");
      console.error("Recipient:", to);
      console.error("Subject:", subject);
      console.error("Campaign:", finalCampaign);
      console.error("Source:", finalSource);
      console.error("SMTP Response / Error:", error.message);
      console.error("==========================================");

      // Logging is now handled centrally by sendSafeEmail to avoid duplicates


      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  /**
   * Sends a batch of emails sequentially with throttling delay to protect against Hostinger rate limits.
   * Reusable for future internships, quizzes, newsletters, certificates, and system announcements.
   * @param {Array<Object>} emailList - Array of options matching sendEmail parameters
   * @param {number} [delayMs=1000] - Delay in milliseconds between email dispatches
   * @returns {Promise<{total: number, successful: number, failed: number, results: Array}>}
   */
  async sendBatchEmails(emailList = [], delayMs = 1000) {
    if (!Array.isArray(emailList) || emailList.length === 0) {
      return { total: 0, successful: 0, failed: 0, results: [] };
    }

    console.log(`[MailService] 🚀 Launching batch transmission of ${emailList.length} emails with ${delayMs}ms delay...`);
    const results = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < emailList.length; i++) {
      const item = emailList[i];
      const res = await this.sendEmail(item);

      if (res.success) {
        successful++;
      } else {
        failed++;
      }
      results.push({ to: item.to, ...res });

      // Pause before sending next email to prevent SMTP spam triggers
      if (i < emailList.length - 1 && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.log(`[MailService] 🏁 Batch transmission finalized | Total: ${emailList.length} | ✔ Success: ${successful} | ❌ Failed: ${failed}`);
    return {
      total: emailList.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Resends a historical stored email by ID.
   * Enforces attachment safety checks and guarantees historical log immutability by creating a brand new record.
   * @param {string} logId - The MongoDB document ID of the historical email log
   */
  async resendStoredEmail(logId) {
    const EmailLog = require('../models/email/EmailLog');
    const log = await EmailLog.findById(logId);

    if (!log) {
      const err = new Error("Original email log record not found.");
      err.status = 404;
      throw err;
    }

    // Fix 3 (HIGH): Attachment Resend Protection against placeholder / buffer strings
    if (Array.isArray(log.attachments) && log.attachments.length > 0) {
      for (const att of log.attachments) {
        if (
          att.content === "[Buffer Payload]" ||
          att.content === "[Binary Attachment Payload]" ||
          (!att.content && !att.url && !att.path)
        ) {
          const err = new Error("Original attachment is no longer available. Please upload a new attachment before resending.");
          err.status = 400;
          throw err;
        }
      }
    }

    // Prepare valid attachments for Nodemailer
    const validAttachments = log.attachments
      ? log.attachments.filter((a) => a.content || a.url || a.path).map((a) => ({
          filename: a.filename || "attachment",
          content: a.content || undefined,
          path: (!a.content && (a.url || a.path)) ? (a.url || a.path) : undefined,
        }))
      : [];

    console.log(`[MailService] 🔄 Resending historical email [${log.subject}] to [${log.recipientEmail}]...`);

    // Fix 11 (MEDIUM): Resend calls sendEmail with source 'Admin Resend', which automatically creates a completely NEW log entry
    return await this.sendEmail({
      to: log.recipientEmail,
      subject: log.subject,
      html: log.html,
      text: log.text,
      attachments: validAttachments,
      campaign: log.campaign,
      source: "Admin Resend",
      recipientName: log.recipientName,
    });
  }
}

// Export singleton instance of MailService for global reuse
module.exports = new MailService();
