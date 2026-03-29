const User = require('../models/User');
const Counter = require('../models/Counter');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your provider
  auth: {
    user: process.env.EMAIL_USER,           // e.g. yourcompany@gmail.com
    pass: process.env.EMAIL_APP_PASSWORD    // App password (NOT normal password)
  }
});

const registerInternship = async (req, res) => {
  try {
    console.log('[Backend] Public internship application received:', req.body.email || 'No email');

    const { email, mobile, name, domain, duration, college, github, linkedin, portfolio } = req.body;

    // Check duplicate by email OR mobile
    let user = await User.findOne({ $or: [{ email }, { mobile }] });

    if (user && user.internships.length > 0) {
      // Find the most recent application
      const sortedInternships = [...user.internships].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      const lastApp = sortedInternships[0];
      
      const daysSinceLast = Math.floor((new Date() - new Date(lastApp.appliedAt)) / (1000 * 60 * 60 * 24));
      
      // Restriction: 15 days
      if (daysSinceLast < 15) {
        return res.status(429).json({ 
          message: `You can reapply after 15 days from your last application (${new Date(lastApp.appliedAt).toLocaleDateString()}). Days remaining: ${15 - daysSinceLast}` 
        });
      }
      
      // Also check exact domain matching just in case (though it's blocked by 15 days anyway)
      const sameDomain = user.internships.find(app => app.domain === domain);
      if (sameDomain) {
        const daysSinceSameDomain = Math.floor((new Date() - new Date(sameDomain.appliedAt)) / (1000 * 60 * 60 * 24));
        if (daysSinceSameDomain < 15) {
          return res.status(429).json({ 
            message: `You have already applied for ${domain} within the last 15 days.` 
          });
        }
      }
    }

    const currentYear = new Date().getFullYear();
    const counterId = `internship_${currentYear}`;

    const counter = await Counter.findByIdAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const serialNumber = String(counter.seq).padStart(3, '0');
    const studentId = `CN/INT/${currentYear}/${serialNumber}`;

    console.log('[Backend] Generated Student ID:', studentId);

    const applicationData = {
      ...req.body,
      studentId,
      appliedAt: new Date()
    };

    if (!user) {
      const hashedPassword = await bcrypt.hash('Welcome@123', 10);
      user = await User.create({
        name,
        email,
        mobile,
        password: hashedPassword,
        isFirstLogin: true,
        github: github || '',
        linkedin: linkedin || '',
        portfolio: portfolio || '',
        internships: []
      });
    } else {
      // Opt: sync the latest links if provided
      if (github) user.github = github;
      if (linkedin) user.linkedin = linkedin;
      if (portfolio) user.portfolio = portfolio;
    }

    // Attach offer letter status defaults safely handled by schema
    user.internships.push(applicationData);
    await user.save();

    console.log('[Backend] Internship saved with Student ID:', studentId);

    // Send confirmation email with Nodemailer
   const mailOptions = {
  from: `"CODE-A-NOVA Internships" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: `Thank You for Applying for the Internship!  ${name}`,
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
            Your application has been successfully registered.
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
                <td style="padding:8px 0; font-weight:600; color:#1e40af;">Student ID</td>
                <td style="padding:8px 0; font-family:monospace;">${studentId}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-weight:600; color:#1e40af;">Domain</td>
                <td style="padding:8px 0;">${domain}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-weight:600; color:#1e40af;">Duration</td>
                <td style="padding:8px 0;">${duration}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-weight:600; color:#1e40af;">College</td>
                <td style="padding:8px 0;">${college || 'Not provided'}</td>
              </tr>

            </table>
          </div>

          <!-- LOGIN CREDENTIALS GLASS CARD -->
          <div style="
            margin:30px 0;
            padding:22px;
            border-radius:16px;
            background:linear-gradient(135deg,#fffbeb,#fef3c7);
            border:1px solid #fde68a;
          ">
            <h3 style="margin-top:0; font-size:20px; color:#d97706;">
              🔐 Student Dashboard Access
            </h3>
            
            <p style="font-size:15.5px; color:#92400e; margin-bottom:12px;">
              You can track your application status, project assignments, and offer letters via your new Student Dashboard:
            </p>

            <table style="width:100%; font-size:15.5px; border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0; font-weight:600; color:#b45309;">User ID</td>
                <td style="padding:8px 0; font-family:monospace; font-weight:bold;">${email}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-weight:600; color:#b45309;">Password</td>
                <td style="padding:8px 0; font-family:monospace; font-weight:bold;">${!user.isFirstLogin && !user.isNew ? '(Your Existing Password)' : 'Welcome@123'}</td>
              </tr>
            </table>
            
            <p style="font-size:14px; color:#92400e; margin-top:12px; margin-bottom:0;">
              <em>Note: You will be asked to update your password on your first login.</em>
            </p>
          </div>

          <!-- NEXT STEPS -->
          <h3 style="font-size:22px; color:#0f172a;">🚀 What’s Next?</h3>

          <div style="margin-top:15px;">
            <p style="font-size:16px; margin-bottom:10px;">
              Our selection team will now carefully review your application.
              If shortlisted, you will receive:
            </p>

            <ul style="line-height:1.9; padding-left:20px; font-size:16px; margin:0;">
              <li>📄 Internship Offer Letter</li>
              <li>📘 Onboarding & Program Guidelines</li>
              <li>🧠 Project Tasks & Assignments</li>
              <li>👨‍🏫 Dedicated Mentor Support</li>
              <li>🏅 Certificate of Completion</li>
            </ul>
          </div>

          <!-- IMPORTANT INSTRUCTIONS -->
          <div style="
            margin-top:30px;
            padding:20px;
            border-radius:14px;
            background:linear-gradient(135deg,#ecfeff,#f0fdfa);
            border-left:6px solid #06b6d4;
          ">
            <h3 style="margin-top:0; color:#0f172a;">⚠️ Important Instructions</h3>
            <ul style="line-height:1.8; padding-left:20px; font-size:15.8px; margin:12px 0 0 0;">
              <li>Check your email regularly (including Spam/Junk folders).</li>
              <li>Respond promptly to official communications from CODE-A-NOVA.</li>
              <li>Complete assigned tasks within deadlines to qualify for certification.</li>
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
          <p style="font-weight:800; font-size:18px; margin-top:0; color:#1e40af;">CODE-A-NOVA Team</p>

          <p style="font-size:14px; color:#6b7280; margin:8px 0;">
            📧 <a href="mailto:codeanova26@gmail.com" style="color:#2563eb; text-decoration:none;">codeanova26@gmail.com</a><br>
            🌐 <a href="https://code-a-nova.online/" style="color:#2563eb; text-decoration:none;">https://code-a-nova.online/</a>
          </p>

          <p style="font-size:14px; color:#6b7280; margin-top:12px;">
            Connect with us:
            <a href="http://linkedin.com/company/code-a-nova" style="color:#2563eb; text-decoration:none;">LinkedIn</a> •
            <a href="https://www.instagram.com/codenova31" style="color:#2563eb; text-decoration:none;">Instagram</a>
          </p>

        </div>
      </div>
    </div>
  `
};

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${email}`);

    res.status(201).json({ 
      message: 'Application submitted successfully',
      studentId 
    });
  } catch (error) {
    console.error('[Backend] Internship registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerInternship };