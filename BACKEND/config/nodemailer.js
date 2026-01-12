const nodemailer = require('nodemailer');

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.error('Missing email credentials:');
    console.error('EMAIL_USER:', user);
    console.error('EMAIL_APP_PASSWORD:', pass ? '[set]' : '[missing]');
    throw new Error('Email credentials missing in .env');
  }

  console.log(`Attempting to send via: ${user}`);

  return nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
};

// Reusable function to send confirmation email
const sendInternshipConfirmation = async ({
  name,
  email,
  domain,
  duration,
  college,
  batch,
  studentId
}) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `CODE-A-NOVA – Internship Selection Team <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Application Received - CODE-A-NOVA ${domain} Internship (${studentId})`,
      html: `
<div style="font-family:'Segoe UI', Arial, sans-serif; max-width:680px; margin:auto; background:#eef2ff; padding:24px;">
  
  <!-- Outer Card -->
  <div style="background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.12);">

    <!-- HERO HEADER -->
    <div style="background:linear-gradient(135deg,#6366f1,#2563eb,#0ea5e9); padding:38px 25px; text-align:center; color:#ffffff;">
      <img src="https://res.cloudinary.com/dgtyqhtor/image/upload/v1767350736/new_logo_wwgaha.png"
           alt="CODE-A-NOVA"
           style="width:150px; background:#ffffff; padding:12px; border-radius:14px; box-shadow:0 8px 18px rgba(0,0,0,0.25); margin-bottom:14px;">
      <h1 style="margin:0; font-size:30px; letter-spacing:1.2px;">CODE-A-NOVA</h1>
      <p style="margin-top:6px; font-size:14px; opacity:0.95;">
        MSME Registered Organization
      </p>

      <!-- Status Badge -->
      <div style="margin-top:18px;">
        <span style="background:rgba(255,255,255,0.2); padding:8px 18px; border-radius:999px; font-size:14px; font-weight:600;">
          ✅ Application Received Successfully
        </span>
      </div>
    </div>

    <!-- BODY -->
    <div style="padding:35px 30px; color:#1f2937;">

      <p style="font-size:17px;">Dear <strong>${name}</strong>,</p>

      <p style="font-size:16.5px; line-height:1.8;">
        We’re thrilled to see your interest in the 
        <strong>${domain}</strong> Internship Program at 
        <strong>CODE-A-NOVA</strong>.
        Your application has been reviewed for submission and has been
        <span style="color:#16a34a; font-weight:700;">successfully registered</span>.
      </p>

      <!-- DETAILS GLASS CARD -->
      <div style="
        margin:30px 0;
        padding:22px;
        border-radius:16px;
        background:linear-gradient(135deg,#f8fafc,#eef2ff);
        border:1px solid #c7d2fe;
      ">
        <h3 style="margin-top:0; font-size:20px; color:#1e3a8a;">
          📋 Internship Registration Summary
        </h3>

        <table style="width:100%; font-size:15.5px; border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0; font-weight:600;">Student ID</td>
            <td style="padding:8px 0;">${studentId}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-weight:600;">Domain</td>
            <td style="padding:8px 0;">${domain}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-weight:600;">Duration</td>
            <td style="padding:8px 0;">${duration}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-weight:600;">College</td>
            <td style="padding:8px 0;">${college}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-weight:600;">Batch</td>
            <td style="padding:8px 0;">${batch}</td>
          </tr>
        </table>
      </div>

      <!-- NEXT STEPS -->
      <h3 style="font-size:22px; color:#0f172a;">🚀 What’s Next?</h3>

      <div style="margin-top:15px;">
        <p style="font-size:16px; margin-bottom:10px;">
          Our selection team will now carefully review your application.
          If shortlisted, you will receive:
        </p>

        <ul style="line-height:1.9; padding-left:20px; font-size:16px;">
          <li>📄 Internship Offer Letter</li>
          <li>📘 Onboarding & Program Guidelines</li>
          <li>🧠 Project Tasks & Assignments</li>
          <li>👨‍🏫 Dedicated Mentor Support</li>
          <li>🏅 Certificate of Completion</li>
        </ul>
      </div>

      <!-- INFO HIGHLIGHT -->
      <div style="
        margin-top:30px;
        padding:20px;
        border-radius:14px;
        background:linear-gradient(135deg,#ecfeff,#f0fdfa);
        border-left:6px solid #06b6d4;
      ">
        <h3 style="margin-top:0; color:#0f172a;">⚠️ Important Instructions</h3>
        <ul style="line-height:1.8; padding-left:20px; font-size:15.8px;">
          <li>Check your email regularly (including Spam/Junk folders).</li>
          <li>Respond promptly to official communications.</li>
          <li>Complete tasks within deadlines to qualify for certification.</li>
        </ul>
      </div>

      <!-- CTA BUTTON -->
      <div style="text-align:center; margin:35px 0;">
        <a href="https://code-a-nova.online/"
           style="
             display:inline-block;
             background:linear-gradient(135deg,#4f46e5,#2563eb);
             color:#ffffff;
             text-decoration:none;
             padding:14px 28px;
             border-radius:999px;
             font-size:16px;
             font-weight:600;
             box-shadow:0 10px 20px rgba(79,70,229,0.35);
           ">
          🌐 Visit Our Official Website
        </a>
      </div>

      <p style="font-size:16px; line-height:1.7;">
        For any queries or assistance, simply reply to this email or contact us at  
        <strong style="color:#2563eb;">codeanova26@gmail.com</strong>.
      </p>

      <hr style="border:none; border-top:1px solid #e5e7eb; margin:40px 0;">

      <!-- FOOTER -->
      <p style="font-weight:600; margin-bottom:4px;">Warm Regards,</p>
      <p style="font-weight:800; font-size:18px; margin-top:0;">CODE-A-NOVA Team</p>

      <p style="font-size:14px; color:#6b7280;">
        📧 <a href="mailto:codeanova26@gmail.com" style="color:#2563eb; text-decoration:none;">codeanova26@gmail.com</a><br>
        🌐 <a href="https://code-a-nova.online/" style="color:#2563eb; text-decoration:none;">https://code-a-nova.online/</a>
      </p>

      <p style="font-size:14px; color:#6b7280;">
        Connect with us:
        <a href="http://linkedin.com/company/code-a-nova" style="color:#2563eb; text-decoration:none;">LinkedIn</a> |
        <a href="https://www.instagram.com/codenova31" style="color:#2563eb; text-decoration:none;">Instagram</a>
      </p>

    </div>
  </div>
</div>

      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    return false;
  }
};

module.exports = { sendInternshipConfirmation };