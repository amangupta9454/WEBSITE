// backend/config/emailTemplates.js

const getInternshipConfirmationEmail = ({
  name,
  domain,
  duration,
  college,
  batch,
  studentId,
}) => {
  return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin:auto; background:#ffffff; padding:30px; border-radius:10px; border:1px solid #e5e7eb;">
  <!-- Header & Logo -->
  <div style="text-align:center; margin-bottom:25px;">
    <img src="https://res.cloudinary.com/dgtyqhtor/image/upload/v1767350736/new_logo_wwgaha.png" alt="CODE-A-NOVA" style="width:140px; margin-bottom:10px;" />
    <h2 style="font-size:26px; color:#111827; margin-top:5px;">CODE-A-NOVA</h2>
    <p style="color:#6b7280; font-size:14px; margin-top:-5px;">MSME Registered Organization</p>
  </div>

  <!-- Greeting -->
  <p style="font-size:16px; color:#1f2937;">Dear <strong>${name || 'Student'}</strong>,</p>

  <p style="font-size:16px; color:#374151; line-height:1.6;">
    We appreciate your interest in applying for the <strong>${domain}</strong> Internship Program.
    We are pleased to confirm that we have <strong>successfully received your application</strong>.
  </p>

  <!-- Registration Details -->
  <div style="background: linear-gradient(135deg, #1e293b, #111827); border: 2px solid #6366f1; border-radius:16px; padding:24px; text-align:center; margin:30px 0; box-shadow: 0 10px 30px rgba(99,102,241,0.2);">
    <p style="margin:0 0 12px; font-size:18px; color:#c7d2fe;"><b>🎟 Your Registration Number</b></p>
    <p style="margin:0; font-size:32px; font-weight:900; color:#a5b4fc; letter-spacing:3px; font-family:monospace;">${studentId}</p>
  </div>

  <p style="font-size:16px; color:#374151; line-height:1.6;">
    <strong>Application Summary:</strong><br>
    • Domain: <strong>${domain}</strong><br>
    • Duration: <strong>${duration}</strong><br>
    • College: <strong>${college}</strong><br>
    • Batch: <strong>${batch}</strong>
  </p>

  <!-- Next Steps -->
  <h3 style="font-size:20px; color:#111827; margin-top:28px; margin-bottom:8px;">Next Steps</h3>
  <ul style="font-size:16px; color:#374151; line-height:1.6; padding-left:20px;">
    <li>Your application will now be reviewed by our selection team.</li>
    <li>If shortlisted, you will receive official communication including:</li>
    <ul style="padding-left:20px; list-style-type:disc;">
      <li>Internship Offer Letter</li>
      <li>Onboarding Guidelines</li>
      <li>Task & Assignment Details</li>
      <li>Mentor Support & Weekly Evaluation</li>
      <li>Certificate of Completion (after successful completion)</li>
    </ul>
  </ul>

  <!-- Important Instructions -->
  <h3 style="font-size:20px; color:#111827; margin-top:25px; margin-bottom:8px;">Important Instructions</h3>
  <ul style="font-size:16px; color:#374151; line-height:1.6; padding-left:20px;">
    <li>Check your email (including spam/junk folder) frequently for updates.</li>
    <li>Keep communication lines open and respond promptly.</li>
    <li>Ensure timely task completion to qualify for certification.</li>
  </ul>

  <p style="font-size:16px; color:#374151; line-height:1.6;">
    If you have any queries or face any difficulty during the process, feel free to reply to this email or contact us at 
    <strong>codeanova26@gmail.com</strong>.
  </p>

  <hr style="border:none; border-top:1px solid #e5e7eb; margin:35px 0;" />

  <!-- Footer -->
  <p style="font-size:16px; color:#111827; font-weight:600; margin-bottom:0;">Warm Regards,</p>
  <p style="font-size:16px; color:#111827; font-weight:bold; margin-top:2px;">CODE-A-NOVA Team</p>
  <p style="font-size:14px; color:#6b7280; margin-top:5px;">
    📧 Email: <a href="mailto:codeanova26@gmail.com" style="color:#2563eb; text-decoration:none;">codeanova26@gmail.com</a><br>
    🌐 Website: <a href="https://code-a-nova.online/" style="color:#2563eb; text-decoration:none;">https://code-a-nova.online/</a>
  </p>
  <p style="font-size:14px; color:#6b7280; margin-top:10px;">
    Follow Us On: 
    <a href="http://linkedin.com/company/code-a-nova" style="color:#2563eb; text-decoration:none;">LinkedIn</a> | 
    <a href="https://www.instagram.com/codenova31" style="color:#2563eb; text-decoration:none;">Instagram</a>
  </p>
</div>
  `;
};

module.exports = { getInternshipConfirmationEmail };