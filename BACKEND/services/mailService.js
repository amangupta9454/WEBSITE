const nodemailer = require('nodemailer');
const { mailConfig, defaultSender } = require('../config/mailConfig');

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
      this.transporter = nodemailer.createTransport(mailConfig);

      // Perform background connection test if SMTP credentials are provided
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        this.transporter.verify((error) => {
          if (error) {
            console.warn('[MailService] ⚠️ SMTP connection verify failed during initialization:', error.message);
          } else {
            console.log('[MailService] ✔ Hostinger SMTP Gateway ready for transmission.');
          }
        });
      }
    } catch (error) {
      console.error('[MailService] ❌ Fatal error while creating Nodemailer transport:', error);
    }
  }

  /**
   * Sends a single email using Hostinger SMTP.
   * @param {Object} options - Email configuration object
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject line
   * @param {string} options.html - Complete HTML template body (received from Apps Script or caller)
   * @param {string} [options.from] - Custom sender (defaults to SMTP_USER)
   * @param {string} [options.replyTo] - Optional reply-to address
   * @param {Array} [options.attachments] - Optional array of file attachments
   * @param {string|Array} [options.cc] - Optional CC recipient(s)
   * @param {string|Array} [options.bcc] - Optional BCC recipient(s)
   * @returns {Promise<{success: boolean, messageId?: string, accepted?: Array, error?: string, code?: string}>}
   */
  async sendEmail({ to, subject, html, from = defaultSender, replyTo, attachments, cc, bcc }) {
    try {
      if (!this.transporter) {
        this.initTransporter();
      }

      if (!this.transporter) {
        throw new Error('Nodemailer transporter could not be initialized.');
      }

      const mailOptions = {
        from: from || defaultSender,
        to,
        subject,
        html,
        ...(replyTo && { replyTo }),
        ...(cc && { cc }),
        ...(bcc && { bcc }),
        ...(attachments && { attachments }),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[MailService] ✔ Email sent successfully to [${to}] | MessageID: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (error) {
      console.error(`[MailService] ❌ SMTP delivery failed for recipient [${to}]:`, error.message);
      return {
        success: false,
        error: error.message || 'Unknown SMTP transmission failure',
        code: error.code || 'SMTP_TRANSMISSION_ERROR',
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
}

// Export singleton instance of MailService for global reuse
module.exports = new MailService();
