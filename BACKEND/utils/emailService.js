const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const DEFAULT_FROM = process.env.SMTP_FROM 
  ? `Code-A-Nova <${process.env.SMTP_FROM}>` 
  : `Code-A-Nova <manager@code-a-nova.online>`;

const sendEmail = async ({ to, subject, html, replyTo, from }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY missing. Mock sending email to:", to);
      return { success: true, mock: true };
    }
    const sender = from || DEFAULT_FROM;
    const data = await resend.emails.send({
      from: sender,
      to,
      subject,
      html,
      ...(replyTo && { reply_to: replyTo }),
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
      <a href="https://code-a-nova.online/student-login" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">Start Interviewing</a>
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
  referralSuccess: (referrerName, refereeName, credits) => `
    <div style="font-family: sans-serif; max-w-lg mx-auto p-6 bg-white border border-gray-200 rounded-xl">
      <h2>Referral Bonus Earned! 🚀</h2>
      <p>Hi ${referrerName},</p>
      <p>Great news! Your friend ${refereeName} just signed up using your referral code.</p>
      <p>You've earned ${credits} interview credits!</p>
    </div>
  `,
  passwordReset: (token) => `
    <div style="font-family: sans-serif; max-w-lg mx-auto p-6 bg-white border border-gray-200 rounded-xl">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="https://code-a-nova.online/reset-password?token=${token}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px;">Reset Password</a>
      <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `,
};

module.exports = {
  sendEmail,
  templates,
};
