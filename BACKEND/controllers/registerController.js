// backend/controllers/registerController.js

const Applicant = require('../models/Applicant');
const nodemailer = require('nodemailer');

const register = async (req, res) => {
  try {
    console.log('Received registration data:', req.body);

    const applicant = new Applicant(req.body);
    await applicant.save();
    console.log('Applicant saved to DB:', applicant._id);

    // Email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        host: 'smtp.gmail.com',
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"CodeNova" <${process.env.EMAIL_USER}>`,
      to: applicant.email,
      subject: 'Thank You for Applying for the Internship!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2 style="color: #4f46e5;">Dear ${applicant.name},</h2>
          <p>Thank you for showing interest and submitting your details for the <strong>${applicant.domain}</strong> Internship Program.</p>
          <p>We’re glad to inform you that your application has been <strong>successfully received</strong>.</p>

          <p>Your internship duration, as per the form submitted, is <strong>${applicant.duration}</strong>, and you are currently associated with <strong>${applicant.college}</strong>.</p>

          <p>Our team appreciates your initiative and willingness to learn and grow.</p>

          <h3 style="color: #4f46e5;">What Happens Next?</h3>
          <ul>
            <li>Our team will now review your application.</li>
            <li>If shortlisted, you will receive:
              <ul>
                <li>Internship Offer Letter</li>
                <li>Joining & Task Details</li>
                <li>Weekly Assignments & Guidance</li>
                <li>Mentor Support During Internship</li>
                <li>Certificate of Completion after successful evaluation</li>
              </ul>
            </li>
          </ul>

          <h3 style="color: #4f46e5;">Important Points:</h3>
          <ul>
            <li>Check your email regularly for updates</li>
            <li>Be available for communication during onboarding</li>
            <li>Complete tasks sincerely to receive the certificate</li>
          </ul>

          <p>If you have any questions, feel free to reply to this email — our team is always happy to assist you.</p>

          <hr style="margin: 30px 0;" />
          <p style="color: #666;">
            Warm Regards,<br/>
            <strong>CodeNova</strong><br/>
            <em>(MSME Registered)</em><br/><br/>
            📧 codenova31@gmail.com<br/>
            🌐 www.yourwebsite.com
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent to:', applicant.email);

    res.status(201).json({ message: 'Registration successful and email sent' });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register };