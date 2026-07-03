const { sendEmail, templates } = require('../utils/emailService');

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

    // Alert Admin
    await sendEmail({
      to: "codeanova26@gmail.com",
      subject: `[Support Ticket #${ticketId}] ${subject}`,
      html: templates.adminSupportAlert(name, email, subject, issueType, description)
    });

    // Confirm with User
    await sendEmail({
      to: email,
      subject: `Support Request Received - #${ticketId}`,
      html: templates.supportTicketReceived(name, ticketId)
    });

    res.status(200).json({
      success: true,
      message: "Your support ticket has been created successfully. We'll get back to you soon.",
      ticketId
    });
  } catch (error) {
    console.error("[Support] Ticket creation failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit your support ticket. Please try again later.",
    });
  }
};

module.exports = { submitSupportTicket };
