const EmailLog = require('../models/email/EmailLog');

/**
 * Enterprise Email Logging Service
 * Intercepts all email transmissions across the Code-A-Nova platform and permanently records them in MongoDB.
 * Replaces relying on external SMTP "Sent" mailboxes with a robust, searchable Single Source of Truth.
 */
class EmailLoggerService {
  /**
   * Automatically detect and tag campaign types from subject lines or metadata if not explicitly provided.
   */
  inferCampaign(subject = '', defaultCampaign = 'General') {
    if (defaultCampaign && defaultCampaign !== 'General') {
      return defaultCampaign;
    }
    const sub = subject.toLowerCase();
    if (sub.includes('offer letter') || sub.includes('internship offer')) return 'Offer Letter';
    if (sub.includes('completion') || sub.includes('experience letter')) return 'Completion Letter';
    if (sub.includes('certificate')) return 'Certificate';
    if (sub.includes('hackathon')) return 'Hackathon';
    if (sub.includes('interview') || sub.includes('mock')) return 'AI Interview';
    if (sub.includes('prompt') || sub.includes('llm') || sub.includes('engineering')) return 'Prompt Engineering';
    if (sub.includes('assigned') || sub.includes('project allocated')) return 'Project Assigned';
    if (sub.includes('reminder') || sub.includes('action required') || sub.includes('due')) return 'Project Reminder';
    if (sub.includes('quiz') || sub.includes('test') || sub.includes('assessment')) return 'Quiz';
    if (sub.includes('otp') || sub.includes('verification') || sub.includes('verify')) return 'Verification';
    return defaultCampaign || 'General';
  }

  /**
   * Convert rich HTML content to clean plain text fallback if plain text wasn't provided.
   */
  extractPlainText(html = '', text = '') {
    if (text && text.trim().length > 0) return text;
    if (!html) return '';
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize attachment metadata array for storage.
   */
  processAttachments(attachments = []) {
    if (!Array.isArray(attachments)) return [];
    return attachments.map((att) => {
      let size = 0;
      let contentStr = '';
      if (att.content) {
        if (typeof att.content === 'string') {
          size = att.content.length;
          // Only preserve lightweight text content or references; don't bloat DB with massive multi-MB binaries unless needed
          contentStr = size < 100000 ? att.content : '[Binary Attachment Payload]';
        } else if (Buffer.isBuffer(att.content)) {
          size = att.content.length;
          contentStr = '[Buffer Payload]';
        }
      }
      return {
        filename: att.filename || att.name || 'document',
        size: att.size || size,
        mimeType: att.contentType || att.mimeType || 'application/octet-stream',
        url: att.path || att.url || '',
        content: contentStr,
      };
    });
  }

  /**
   * Primary logging function to record an email transmission event in MongoDB.
   * Executed non-blockingly so database I/O latency never impacts live SMTP routing speed.
   */
  async logEmail({
    senderEmail = 'Unknown',
    recipientName = '',
    recipientEmail,
    subject = '',
    campaign = 'General',
    status = 'SUCCESS',
    messageId = null,
    accepted = [],
    rejected = [],
    smtpResponse = '',
    html = '',
    text = '',
    attachments = [],
    source = 'Backend API',
  }) {
    try {
      if (!recipientEmail) {
        console.warn('[EmailLogger] ⚠️ Cannot log email without a valid recipientEmail address.');
        return null;
      }

      const finalCampaign = this.inferCampaign(subject, campaign);
      const plainText = this.extractPlainText(html, text);
      const parsedAttachments = this.processAttachments(attachments);

      // Guess recipient name from email prefix if blank
      let finalName = recipientName;
      if (!finalName && recipientEmail.includes('@')) {
        const parts = recipientEmail.split('@')[0].split(/[._-]/);
        finalName = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
      }

      const logEntry = new EmailLog({
        senderEmail: senderEmail.trim().toLowerCase(),
        recipientName: finalName,
        recipientEmail: recipientEmail.trim().toLowerCase(),
        subject: subject.trim(),
        campaign: finalCampaign,
        status: status === 'SUCCESS' ? 'SUCCESS' : status === 'FAILED' ? 'FAILED' : 'PENDING',
        messageId: messageId ? String(messageId) : null,
        accepted: Array.isArray(accepted) ? accepted.map(String) : [],
        rejected: Array.isArray(rejected) ? rejected.map(String) : [],
        smtpResponse: String(smtpResponse || ''),
        html: html || '<p>No HTML Body</p>',
        text: plainText,
        attachments: parsedAttachments,
        source: source || 'Backend API',
      });

      await logEntry.save();
      console.log(`[EmailLogger] ✔ Successfully logged email to DB | ID: ${logEntry._id} | Campaign: [${finalCampaign}] | Status: [${status}]`);
      return logEntry;
    } catch (error) {
      // Catch exceptions silently so email transmission never throws a secondary runtime failure
      console.error('[EmailLogger] ❌ Failed to record email transmission log in MongoDB:', error.message);
      return null;
    }
  }
}

module.exports = new EmailLoggerService();
