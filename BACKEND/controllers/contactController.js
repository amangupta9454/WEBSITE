const ContactInquiry = require('../models/ContactInquiry');
const mailService = require('../services/mailService');
const { sendEmail: sendEmailFallback } = require('../utils/emailService');
const { ImapFlow } = require('imapflow');
const { mailConfig } = require('../config/mailConfig');

const emailLogger = require('../services/emailLogger');

// Helper to send email with Hostinger SMTP -> Resend fallback
const sendMailWithFallback = async ({ to, subject, html, replyTo, campaign = 'Contact Inquiry Reply', source = 'Admin Contact Desk', recipientName = '' }) => {
  try {
    const primaryRes = await mailService.sendEmail({
      to,
      subject,
      html,
      from: '"Code-A-Nova" <manager@code-a-nova.online>',
      replyTo: replyTo || "manager@code-a-nova.online",
      campaign,
      source,
      recipientName,
    });
    if (primaryRes && primaryRes.success) {
      return true;
    }
  } catch (primaryErr) {
    console.warn(`[Contact] Hostinger SMTP primary dispatch failed (${primaryErr.message}). Attempting Resend fallback...`);
  }

  try {
    const fallbackRes = await sendEmailFallback({ 
      to, 
      subject, 
      html, 
      replyTo: replyTo || "manager@code-a-nova.online",
      from: '"Code-A-Nova" <manager@code-a-nova.online>'
    });
    if (fallbackRes && fallbackRes.success) {
      try {
        await emailLogger.logEmail({
          senderEmail: 'manager@code-a-nova.online',
          recipientEmail: to,
          recipientName,
          subject,
          html,
          campaign,
          status: 'SUCCESS',
          messageId: fallbackRes.data?.id || `resend_${Date.now()}`,
          accepted: [to],
          smtpResponse: '250 Dispatched via Resend API Fallback',
          source: `${source} (Resend Fallback)`,
        });
      } catch (logErr) {
        console.warn('[Contact] Warning logging Resend email to DB:', logErr.message);
      }
      return true;
    }
  } catch (fallbackErr) {
    console.error(`[Contact] Resend fallback failed (${fallbackErr.message}).`);
  }

  return false;
};

// Helper: Parse clean text snippet from raw email stream
const extractCleanEmailBody = (raw) => {
  if (!raw) return '';
  // Try finding plain text section after headers
  const parts = raw.split(/\r?\n\r?\n/);
  if (parts.length > 1) {
    // Get text lines without email header tags
    const text = parts.slice(1).join('\n')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return text.substring(0, 1500);
  }
  return raw.substring(0, 500);
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

    // Extract phone if provided in body, else try parsing from description
    let extractedPhone = phone ? phone.trim() : '';
    if (!extractedPhone && description) {
      const match = description.match(/Contact (?:Phone\/WhatsApp|Mobile):\s*([^\n\r]+)/i);
      if (match && match[1] && match[1].toLowerCase() !== "not provided") {
        extractedPhone = match[1].trim();
      }
    }

    // 1. Instantly save inquiry to MongoDB with initial client message
    const savedInquiry = await ContactInquiry.create({
      ticketId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: extractedPhone,
      subject: subject.trim(),
      issueType,
      description: description.trim(),
      status: 'New',
      messages: [
        {
          sender: 'client',
          senderName: name.trim(),
          senderEmail: email.trim().toLowerCase(),
          subject: subject.trim(),
          body: description.trim(),
          sentAt: new Date(),
          deliveryStatus: 'Received',
          source: 'web_form',
        },
      ],
    });

    // 2. Respond immediately so user experiences fast submission
    res.status(200).json({
      success: true,
      message: "Your inquiry has been submitted successfully and recorded in our portal.",
      ticketId,
      inquiryId: savedInquiry._id,
    });

    // 3. Optional asynchronous background alert to admin
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
              <strong>Requirements:</strong><br/>
              <pre style="white-space: pre-wrap; font-family: inherit; margin: 8px 0 0 0;">${description.trim()}</pre>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Reply directly to this client from Admin Panel > Email Center > Contact Inquiries.</p>
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
      const numericId = parseInt(search.trim(), 10);
      if (!isNaN(numericId)) {
        query.$or.push({ ticketId: numericId });
      }
    }

    const inquiries = await ContactInquiry.find(query).sort({ createdAt: -1 });

    // Status counts
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

// Admin endpoint: Send email reply directly to this contact lead
const sendInquiryEmailReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: "Email message body is required." });
    }

    const inquiry = await ContactInquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: "Contact inquiry not found." });
    }

    const emailSubject = subject && subject.trim() 
      ? subject.trim() 
      : `Re: [Code-A-Nova #${inquiry.ticketId}] ${inquiry.subject}`;

    const formattedHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div style="background: linear-gradient(135deg, #1e3a8a, #4338ca); color: #ffffff; padding: 24px 30px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 800;">Code-A-Nova Solutions Desk</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">Reference: Ticket #${inquiry.ticketId} • ${inquiry.issueType}</p>
        </div>
        <div style="padding: 28px 30px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <p style="margin-top: 0;">Dear <strong>${inquiry.name}</strong>,</p>
          <div style="margin: 18px 0; white-space: pre-wrap; color: #334155;">${body.trim()}</div>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
            Warm regards,<br />
            <strong>The Code-A-Nova Team</strong><br />
            Website: <a href="https://code-a-nova.online" style="color: #2563eb; text-decoration: none;">code-a-nova.online</a> • Support: <a href="mailto:manager@code-a-nova.online" style="color: #2563eb; text-decoration: none;">manager@code-a-nova.online</a>
          </p>
        </div>
      </div>
    `;

    // 1. Dispatch email directly to this contact lead
    const sentSuccess = await sendMailWithFallback({
      to: inquiry.email,
      subject: emailSubject,
      html: formattedHtml,
      replyTo: "manager@code-a-nova.online",
      campaign: "Contact Inquiry Reply",
      source: "Admin Contact Desk",
      recipientName: inquiry.name,
    });

    // 2. Append to this inquiry's dedicated message thread
    inquiry.messages.push({
      sender: 'admin',
      senderName: req.user?.name || 'Code-A-Nova Admin',
      senderEmail: 'manager@code-a-nova.online',
      subject: emailSubject,
      body: body.trim(),
      sentAt: new Date(),
      deliveryStatus: sentSuccess ? 'Sent' : 'Failed',
      source: 'admin_panel',
    });

    // 3. Mark as Contacted
    inquiry.status = 'Contacted';
    if (!inquiry.contactedAt) {
      inquiry.contactedAt = new Date();
    }
    inquiry.contactedBy = req.user?.email || 'Admin';

    await inquiry.save();

    res.status(200).json({
      success: true,
      message: sentSuccess ? `Email successfully sent to ${inquiry.email}!` : "Message recorded in thread (SMTP warning logged).",
      inquiry,
    });
  } catch (error) {
    console.error("[Contact] Error sending reply email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email reply.",
      error: error.message,
    });
  }
};

// Admin endpoint: Sync incoming email replies for this inquiry from Hostinger IMAP
const syncInquiryReplies = async (req, res) => {
  let client = null;
  try {
    const { id } = req.params;
    const inquiry = await ContactInquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: "Inquiry not found." });
    }

    if (!mailConfig.auth.user || !mailConfig.auth.pass) {
      return res.status(200).json({
        success: true,
        message: "IMAP credentials not configured. Using thread history.",
        inquiry,
      });
    }

    client = new ImapFlow({
      host: 'imap.hostinger.com',
      port: 993,
      secure: true,
      auth: {
        user: mailConfig.auth.user,
        pass: mailConfig.auth.pass,
      },
      logger: false,
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    let newMessagesCount = 0;

    try {
      // Search for emails from this specific sender or with ticket ID
      const searchCriteria = {
        or: [
          { from: inquiry.email },
          { body: `#${inquiry.ticketId}` }
        ]
      };

      const messagesGenerator = client.fetch(searchCriteria, {
        envelope: true,
        source: true,
      });

      for await (const msg of messagesGenerator) {
        const subject = msg.envelope?.subject || '';
        const fromEmail = msg.envelope?.from?.[0]?.address || '';
        const date = msg.envelope?.date || new Date();

        const isMatch = fromEmail.toLowerCase() === inquiry.email.toLowerCase() || 
                        subject.includes(String(inquiry.ticketId));

        if (isMatch) {
          const alreadyLogged = inquiry.messages.some(m => 
            m.sender === 'client' && 
            (m.subject === subject || Math.abs(new Date(m.sentAt).getTime() - new Date(date).getTime()) < 60000)
          );

          if (!alreadyLogged) {
            const rawText = msg.source ? msg.source.toString('utf8') : '';
            const bodyText = extractCleanEmailBody(rawText) || `Received email reply: "${subject}"`;

            inquiry.messages.push({
              sender: 'client',
              senderName: msg.envelope?.from?.[0]?.name || inquiry.name,
              senderEmail: fromEmail,
              subject: subject,
              body: bodyText,
              sentAt: date,
              deliveryStatus: 'Received',
              source: 'imap_sync',
            });

            newMessagesCount++;
            inquiry.status = 'In Progress';
          }
        }
      }
    } finally {
      lock.release();
    }

    if (newMessagesCount > 0) {
      await inquiry.save();
    }

    res.status(200).json({
      success: true,
      message: newMessagesCount > 0 
        ? `Synced ${newMessagesCount} new incoming message(s)!` 
        : "Thread is already up to date.",
      newCount: newMessagesCount,
      inquiry,
    });

  } catch (error) {
    console.warn("[Contact] IMAP sync notice:", error.message);
    const fallbackInquiry = await ContactInquiry.findById(req.params.id);
    res.status(200).json({
      success: true,
      message: `Thread refreshed (No new external IMAP mail found).`,
      inquiry: fallbackInquiry,
    });
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch (_) {}
    }
  }
};

// Admin endpoint: Log manual client message (e.g. from WhatsApp or Phone call)
const logManualMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { sender = 'client', body, channel = 'whatsapp' } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required." });
    }

    const inquiry = await ContactInquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: "Inquiry not found." });
    }

    inquiry.messages.push({
      sender,
      senderName: sender === 'client' ? inquiry.name : (req.user?.name || 'Admin'),
      senderEmail: sender === 'client' ? inquiry.email : 'manager@code-a-nova.online',
      subject: `Logged ${channel.toUpperCase()} Conversation`,
      body: body.trim(),
      sentAt: new Date(),
      deliveryStatus: sender === 'client' ? 'Received' : 'Delivered',
      source: 'manual_log',
    });

    if (sender === 'admin' && inquiry.status === 'New') {
      inquiry.status = 'Contacted';
      inquiry.contactedAt = new Date();
    }

    await inquiry.save();

    res.status(200).json({
      success: true,
      message: "Message logged to thread.",
      inquiry,
    });
  } catch (error) {
    console.error("[Contact] Error logging manual message:", error);
    res.status(500).json({ success: false, message: "Failed to log message." });
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
  sendInquiryEmailReply,
  syncInquiryReplies,
  logManualMessage,
  updateInquiryStatus,
  deleteInquiry,
};
