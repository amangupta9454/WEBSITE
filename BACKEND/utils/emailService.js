const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const FROM_EMAIL = process.env.FROM_EMAIL || 'support@codeanova.com';

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY missing. Mock sending email to:", to);
      return { success: true, mock: true };
    }
    const data = await resend.emails.send({
      from: `Code-A-Nova <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error };
  }
};

const templates = {
  welcome: (name) => `
    <div style="font-family: sans-serif; max-w-lg mx-auto p-6 bg-white border border-gray-200 rounded-xl">
      <h2>Welcome to Code-A-Nova, ${name}!</h2>
      <p>We are thrilled to have you onboard. Get ready to ace your next technical interview with our AI-powered mock interviews.</p>
      <a href="https://codeanova.com/student-login" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">Start Interviewing</a>
    </div>
  `,
  paymentSuccess: (name, amount, packageId) => `
    <div style="font-family: sans-serif; max-w-lg mx-auto p-6 bg-white border border-gray-200 rounded-xl">
      <h2>Payment Successful! 🎉</h2>
      <p>Hi ${name},</p>
      <p>Your payment of ₹${amount} for the ${packageId} package has been successfully processed.</p>
      <p>Your credits are now available in your dashboard.</p>
    </div>
  `,
  interviewCompleted: (name, sessionId) => `
    <div style="font-family: sans-serif; max-w-lg mx-auto p-6 bg-white border border-gray-200 rounded-xl">
      <h2>Your Interview Report is Ready</h2>
      <p>Hi ${name},</p>
      <p>Your AI mock interview evaluation has been generated successfully.</p>
      <a href="https://codeanova.com/dashboard" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">View Detailed Feedback</a>
    </div>
  `,
  supportTicketReceived: (name, ticketId) => `
    <div style="font-family: sans-serif; max-w-lg mx-auto p-6 bg-white border border-gray-200 rounded-xl">
      <h2>Support Request Received - #${ticketId}</h2>
      <p>Hi ${name},</p>
      <p>We've received your message and our team is reviewing it. We typically respond within 24 hours.</p>
      <p>Thank you for reaching out to Code-A-Nova Support!</p>
    </div>
  `,
  adminSupportAlert: (name, email, subject, issueType, description) => `
    <div style="font-family: sans-serif; max-w-lg mx-auto p-6 bg-gray-50 border border-gray-200 rounded-xl">
      <h2>New Support Ticket: ${subject}</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Type:</strong> ${issueType}</p>
      <p><strong>Description:</strong></p>
      <blockquote style="border-left: 4px solid #ccc; padding-left: 10px;">${description}</blockquote>
    </div>
  `
};

module.exports = {
  sendEmail,
  templates
};
