const User = require('../models/User');
const Counter = require('../models/Counter');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your provider
  auth: {
    user: process.env.EMAIL_USER,           // e.g. yourcompany@gmail.com
    pass: process.env.EMAIL_APP_PASSWORD    // App password (NOT normal password)
  }
});

const registerInternship = async (req, res) => {
  try {
    console.log('[Backend] Public internship application received:', req.body?.email || 'No email');
    console.log('[Backend] req.body keys:', req.body ? Object.keys(req.body) : []);
    console.log('[Backend] req.file:', req.file ? req.file.originalname : 'No file');

    const { email, whatsapp, name, course, branch, college, state, passingYear, domain, duration, github, linkedin } = req.body;

    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const normalizedWhatsapp = whatsapp ? whatsapp.trim() : '';
    // Map whatsapp to mobile for legacy checks
    const normalizedMobile = normalizedWhatsapp;

    // Check duplicate by email OR mobile
    let user = await User.findOne({ $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }] });

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

    let resumeUrl = '';
    if (req.file) {
      resumeUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'resumes', resource_type: 'auto' },
          (error, result) => {
            if (result) {
              resolve(result.secure_url);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    }

    const applicationData = {
      ...req.body,
      mobile: normalizedMobile, // Map whatsapp to mobile internally
      email: normalizedEmail,
      studentId,
      resume: resumeUrl,
      appliedAt: new Date()
    };

    if (!user) {
      const hashedPassword = await bcrypt.hash('Welcome@123', 10);
      user = await User.create({
        name,
        email: normalizedEmail,
        mobile: normalizedMobile,
        password: hashedPassword,
        isFirstLogin: true,
        github: github || '',
        linkedin: linkedin || '',
        portfolio: '', // Portfolio removed
        internships: []
      });
    } else {
      // Opt: sync the latest links if provided
      if (github) user.github = github;
      if (linkedin) user.linkedin = linkedin;
      
      // Fix for legacy users missing required fields
      if (!user.name) user.name = name || 'Student';
      if (!user.mobile) user.mobile = normalizedMobile || '0000000000';

      // Ensure that if the existing user has no password set (legacy or imported),
      // they get assigned the default Welcome@123 hashed password.
      if (!user.password) {
        const hashedPassword = await bcrypt.hash('Welcome@123', 10);
        user.password = hashedPassword;
        user.isFirstLogin = true;
      }
    }

    // Attach offer letter status defaults safely handled by schema
    user.internships.push(applicationData);
    await user.save();

    console.log('[Backend] Internship saved with Student ID:', studentId);

    // Send confirmation email with Nodemailer
   const mailOptions = {
      from: `"CODE-A-NOVA Internships" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Registration Confirmed - CODE-A-NOVA Internship`,
      html: `
<div style="background-color: #f4f7f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Top Header Ribbon -->
    <div style="height: 6px; background: linear-gradient(90deg, #2563eb, #3b82f6);"></div>
    
    <!-- Header -->
    <div style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
      <img src="https://res.cloudinary.com/dgtyqhtor/image/upload/v1767350736/new_logo_wwgaha.png" alt="CODE-A-NOVA" style="max-width: 160px; height: auto;">
    </div>
    
    <!-- Body Content -->
    <div style="padding: 40px;">
      <h1 style="margin: 0 0 20px 0; font-size: 24px; color: #111827; font-weight: 600; text-align: center;">Registration Confirmed</h1>
      
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
        Dear <strong>${name}</strong>,
      </p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;">
        Thank you for applying to the <strong>${domain}</strong> Internship Program. We are pleased to inform you that your application has been successfully received. 
      </p>
      
      <!-- Application Details Section -->
      <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 16px; border-bottom: 1px solid #eeeeee; padding-bottom: 8px;">Application Summary</h2>
      
      <table style="width: 100%; margin-bottom: 32px; font-size: 15px; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f9fafb; width: 40%;">Student ID</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 500; border-bottom: 1px solid #f9fafb;">${studentId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f9fafb;">Program Domain</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 500; border-bottom: 1px solid #f9fafb;">${domain}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f9fafb;">Duration</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 500; border-bottom: 1px solid #f9fafb;">${duration}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Institution</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 500;">${college || 'Not provided'}</td>
        </tr>
      </table>
      
      <!-- Dashboard Access Section -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; margin-bottom: 32px;">
        <h2 style="font-size: 16px; color: #0f172a; margin: 0 0 12px 0; font-weight: 600;">Student Dashboard Access</h2>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 16px; line-height: 1.5;">
          You can track your application status and access your upcoming assignments via the dashboard using the credentials below:
        </p>
        
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px 16px;">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">User ID</span><br>
            <strong style="font-size: 15px; color: #0f172a;">${email}</strong>
          </div>
          <div>
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Password</span><br>
            <strong style="font-size: 15px; color: #0f172a;">${(!user.isFirstLogin && !user.isNew) ? '(Your Existing Password)' : 'Welcome@123'}</strong>
          </div>
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 40px;">
        <a href="https://code-a-nova.online/student-login" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 4px; letter-spacing: 0.5px;">Login to Dashboard</a>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">
        Our selection committee is currently reviewing your profile. If shortlisted, you will receive an official offer letter and further instructions via email.<br><br>
        For any assistance, please contact us at <a href="mailto:codeanova26@gmail.com" style="color: #2563eb; text-decoration: none;">codeanova26@gmail.com</a>.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0 0 10px 0; line-height: 1.5;">
        &copy; ${new Date().getFullYear()} CODE-A-NOVA. All rights reserved.<br>
        MSME Registered Organization
      </p>
      <div style="margin-top: 12px;">
        <a href="https://code-a-nova.online" style="color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px;">Website</a> | 
        <a href="https://linkedin.com/company/code-a-nova" style="color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px;">LinkedIn</a> | 
        <a href="https://www.instagram.com/codenova31" style="color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px;">Instagram</a>
      </div>
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

const createRegistrationOrder = async (req, res) => {
  try {
    const { email, mobile, domain, duration } = req.body;

    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const normalizedMobile = mobile ? mobile.trim() : '';

    // 1. Validation for 15-day restriction
    let user = await User.findOne({ $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }] });

    if (user && user.internships.length > 0) {
      const sortedInternships = [...user.internships].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      const lastApp = sortedInternships[0];
      
      const daysSinceLast = Math.floor((new Date() - new Date(lastApp.appliedAt)) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLast < 15) {
        return res.status(429).json({ 
          message: `You can reapply after 15 days from your last application (${new Date(lastApp.appliedAt).toLocaleDateString()}). Days remaining: ${15 - daysSinceLast}` 
        });
      }
      
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

    // 2. Compute Amount
    let amount = 199; // 1 or 2 months duration is 199
    if (duration && duration.includes('3')) {
      amount = 399; // 3 months duration is 399
    }

    // 3. Create Razorpay Order
    const order = await rzp.orders.create({
      amount: amount * 100, // Razorpay takes paise
      currency: 'INR',
      receipt: `reg_${Date.now()}`
    });

    res.json({
      order,
      key: process.env.RAZORPAY_KEY_ID,
      amount,
      message: 'Razorpay order created successfully'
    });
  } catch (error) {
    console.error('[Backend] Create registration order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyRegistrationPayment = async (req, res) => {
  try {
    const { response, formData } = req.body;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

    // 1. Verify Payment Signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // 2. Perform the exact internship registration logic
    const { email, mobile, name, domain, duration, college, github, linkedin, portfolio } = formData;

    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const normalizedMobile = mobile ? mobile.trim() : '';

    // Extra safety duplicate check
    let user = await User.findOne({ $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }] });

    if (user && user.internships.length > 0) {
      const sortedInternships = [...user.internships].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      const lastApp = sortedInternships[0];
      const daysSinceLast = Math.floor((new Date() - new Date(lastApp.appliedAt)) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLast < 15) {
        return res.status(429).json({ 
          message: `You can reapply after 15 days from your last application (${new Date(lastApp.appliedAt).toLocaleDateString()}). Days remaining: ${15 - daysSinceLast}` 
        });
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

    console.log('[Backend] Generated Student ID for Paid Reg:', studentId);

    const applicationData = {
      ...formData,
      email: normalizedEmail,
      mobile: normalizedMobile,
      studentId,
      appliedAt: new Date(),
      hasPaid: true // Mark paid instantly!
    };

    if (!user) {
      const hashedPassword = await bcrypt.hash('Welcome@123', 10);
      user = await User.create({
        name,
        email: normalizedEmail,
        mobile: normalizedMobile,
        password: hashedPassword,
        isFirstLogin: true,
        github: github || '',
        linkedin: linkedin || '',
        portfolio: portfolio || '',
        internships: []
      });
    } else {
      if (github) user.github = github;
      if (linkedin) user.linkedin = linkedin;

      // Fix for legacy users missing required fields
      if (!user.name) user.name = name || 'Student';
      if (!user.mobile) user.mobile = normalizedMobile || '0000000000';

      if (!user.password) {
        const hashedPassword = await bcrypt.hash('Welcome@123', 10);
        user.password = hashedPassword;
        user.isFirstLogin = true;
      }
    }

    user.internships.push(applicationData);
    await user.save();

    console.log('[Backend] Paid Internship saved with Student ID:', studentId);

    // Send confirmation email
    const mailOptions = {
      from: `"CODE-A-NOVA Internships" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Registration Confirmed - CODE-A-NOVA Internship`,
      html: `
<div style="background-color: #f4f7f6; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Top Header Ribbon -->
    <div style="height: 6px; background: linear-gradient(90deg, #2563eb, #3b82f6);"></div>
    
    <!-- Header -->
    <div style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #eeeeee;">
      <img src="https://res.cloudinary.com/dgtyqhtor/image/upload/v1767350736/new_logo_wwgaha.png" alt="CODE-A-NOVA" style="max-width: 160px; height: auto;">
    </div>
    
    <!-- Body Content -->
    <div style="padding: 40px;">
      <h1 style="margin: 0 0 20px 0; font-size: 24px; color: #111827; font-weight: 600; text-align: center;">Registration Confirmed</h1>
      
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
        Dear <strong>${name}</strong>,
      </p>
      
      <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;">
        Thank you for applying to the <strong>${domain}</strong> Internship Program. We are pleased to inform you that your application has been successfully received. 
      </p>
      
      <!-- Application Details Section -->
      <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 16px; border-bottom: 1px solid #eeeeee; padding-bottom: 8px;">Application Summary</h2>
      
      <table style="width: 100%; margin-bottom: 32px; font-size: 15px; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f9fafb; width: 40%;">Student ID</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 500; border-bottom: 1px solid #f9fafb;">${studentId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f9fafb;">Program Domain</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 500; border-bottom: 1px solid #f9fafb;">${domain}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #f9fafb;">Duration</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 500; border-bottom: 1px solid #f9fafb;">${duration}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Institution</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 500;">${college || 'Not provided'}</td>
        </tr>
      </table>
      
      <!-- Dashboard Access Section -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; margin-bottom: 32px;">
        <h2 style="font-size: 16px; color: #0f172a; margin: 0 0 12px 0; font-weight: 600;">Student Dashboard Access</h2>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 16px; line-height: 1.5;">
          You can track your application status and access your upcoming assignments via the dashboard using the credentials below:
        </p>
        
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px 16px;">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">User ID</span><br>
            <strong style="font-size: 15px; color: #0f172a;">${email}</strong>
          </div>
          <div>
            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Password</span><br>
            <strong style="font-size: 15px; color: #0f172a;">${(!user.isFirstLogin && !user.isNew) ? '(Your Existing Password)' : 'Welcome@123'}</strong>
          </div>
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 40px;">
        <a href="https://code-a-nova.online/student-login" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 4px; letter-spacing: 0.5px;">Login to Dashboard</a>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">
        Our selection committee is currently reviewing your profile. If shortlisted, you will receive an official offer letter and further instructions via email.<br><br>
        For any assistance, please contact us at <a href="mailto:codeanova26@gmail.com" style="color: #2563eb; text-decoration: none;">codeanova26@gmail.com</a>.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0 0 10px 0; line-height: 1.5;">
        &copy; ${new Date().getFullYear()} CODE-A-NOVA. All rights reserved.<br>
        MSME Registered Organization
      </p>
      <div style="margin-top: 12px;">
        <a href="https://code-a-nova.online" style="color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px;">Website</a> | 
        <a href="https://linkedin.com/company/code-a-nova" style="color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px;">LinkedIn</a> | 
        <a href="https://www.instagram.com/codenova31" style="color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px;">Instagram</a>
      </div>
    </div>
    
  </div>
</div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Paid Confirmation email sent to ${email}`);

    res.status(201).json({ 
      message: 'Application submitted successfully',
      studentId 
    });

  } catch (error) {
    console.error('[Backend] Verify registration payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  registerInternship, 
  createRegistrationOrder, 
  verifyRegistrationPayment 
};