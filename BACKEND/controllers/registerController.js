const User = require("../models/User");
const Otp = require("../models/Otp");
const Counter = require("../models/Counter");

const getInternshipType = (duration) => {
  return "Normal Intern";
};
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { queueWhatsAppMessage } = require('../utils/whatsappClient');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

const transporter = nodemailer.createTransport({
  service: "gmail", // or your provider
  auth: {
    user: process.env.EMAIL_USER, // e.g. yourcompany@gmail.com
    pass: process.env.EMAIL_APP_PASSWORD, // App password (NOT normal password)
  },
});

const registerInternship = async (req, res) => {
  try {
    console.log(
      "[Backend] Public internship application received:",
      req.body?.email || "No email",
    );
    console.log(
      "[Backend] req.body keys:",
      req.body ? Object.keys(req.body) : [],
    );
    console.log(
      "[Backend] req.file:",
      req.file ? req.file.originalname : "No file",
    );

    const {
      email,
      whatsapp,
      name,
      course,
      branch,
      college,
      state,
      passingYear,
      domain,
      duration,
      github,
      linkedin,
      portfolio,
    } = req.body;

    const normalizedEmail = email ? email.trim().toLowerCase() : "";
    const normalizedWhatsapp = whatsapp ? whatsapp.trim() : "";
    // Map whatsapp to mobile for legacy checks
    const normalizedMobile = normalizedWhatsapp;

    // Check duplicate strictly by email to prevent merging different users who entered dummy/shared phone numbers
    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.internships.length > 0) {
      // Find the most recent application
      const sortedInternships = [...user.internships].sort(
        (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt),
      );
      const lastApp = sortedInternships[0];

      const daysSinceLast = Math.floor(
        (new Date() - new Date(lastApp.appliedAt)) / (1000 * 60 * 60 * 24),
      );

      // Restriction: 15 days
      if (daysSinceLast < 15) {
        return res.status(429).json({
          message: `You can reapply after 15 days from your last application (${new Date(lastApp.appliedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}). Days remaining: ${15 - daysSinceLast}`,
        });
      }

      // Also check exact domain matching just in case (though it's blocked by 15 days anyway)
      const sameDomain = user.internships.find((app) => app.domain === domain);
      if (sameDomain) {
        const daysSinceSameDomain = Math.floor(
          (new Date() - new Date(sameDomain.appliedAt)) / (1000 * 60 * 60 * 24),
        );
        if (daysSinceSameDomain < 15) {
          return res.status(429).json({
            message: `You have already applied for ${domain} within the last 15 days.`,
          });
        }
      }
    }

    const currentYear = new Date().getFullYear();
    const counterId = `internship_${currentYear}`;

    const counter = await Counter.findByIdAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    const serialNumber = String(counter.seq).padStart(3, "0");
    const studentId = `CN/INT/${currentYear}/${serialNumber}`;

    console.log("[Backend] Generated Student ID:", studentId);

    let resumeUrl = "";
    if (req.file) {
      resumeUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "resumes", resource_type: "auto" },
          (error, result) => {
            if (result) {
              resolve(result.secure_url);
            } else {
              reject(error);
            }
          },
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    }

    const applicationData = {
      ...req.body,
      mobile: normalizedMobile, // Map whatsapp to mobile internally
      email: normalizedEmail,
      internshipType: getInternshipType(req.body.duration),
      studentId,
      resume: resumeUrl,
      appliedAt: new Date(),
    };

    if (!user) {
      const hashedPassword = await bcrypt.hash("Welcome@123", 10);
      user = await User.create({
        name,
        email: normalizedEmail,
        mobile: normalizedMobile,
        password: hashedPassword,
        isFirstLogin: true,
        github: github || "",
        linkedin: linkedin || "",
        portfolio: portfolio || "",
        internships: [],
      });
      // Opt: sync the latest links if provided
      if (github) user.github = github;
      if (linkedin) user.linkedin = linkedin;
      if (portfolio) user.portfolio = portfolio;

      // Fix for legacy or pre-registered ambassador users missing required fields
      if (!user.name || user.name === normalizedEmail.split('@')[0]) user.name = name || user.name || "Student";
      if (!user.mobile || user.mobile === "Pending Registration" || user.mobile === "Google Auth") {
        user.mobile = normalizedMobile || user.mobile || "0000000000";
      }

      // Ensure that if the existing user has no password set (legacy or imported),
      // they get assigned the default Welcome@123 hashed password.
      if (!user.password) {
        const hashedPassword = await bcrypt.hash("Welcome@123", 10);
        user.password = hashedPassword;
        user.isFirstLogin = true;
      }
    }

    const referralCode = (req.body.referralCode || req.body.ref || '').trim().toUpperCase();
    if (referralCode) {
      if (!user.referredByCode) {
        user.referredByCode = referralCode;
        user.referredAt = new Date();
      }
      const featureLabel = `Internship (${domain || "General"})`;
      user.referredFeature = featureLabel;
      
      const { recordReferralActivity } = require('./referralController');
      await recordReferralActivity(user, referralCode, featureLabel);
    }

    // Attach offer letter status defaults safely handled by schema
    user.role = 'intern';
    user.internships.push(applicationData);
    await user.save();

    // Seamlessly merge any pre-assigned Campus Ambassador data upon signup
    const { syncAndMergeAmbassadorData } = require('./referralController');
    await syncAndMergeAmbassadorData(user, normalizedEmail);

    console.log("[Backend] Internship saved with Student ID:", studentId);

    // Send confirmation email with Nodemailer
    const mailOptions = {
      from: `"CODE-A-NOVA Internships" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Registration Confirmed - CODE-A-NOVA Internship`,
      html: `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 15px;">
  
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="https://drive.google.com/uc?export=view&id=18wSzAAQJE8LkxQDfI6RCfUmWfyqlQ_uc" alt="CODE-A-NOVA" style="width: 100%; height: auto; max-width: 600px; display: block;">
  </div>
  
  <p style="font-size: 16px; margin-bottom: 16px;">
    Dear <strong>${name}</strong>,
  </p>
  
  <p style="font-size: 16px; margin-bottom: 16px;">
    Thank you for applying to the <strong>${domain}</strong> Internship Program at CODE-A-NOVA.
  </p>
  
  <p style="font-size: 16px; margin-bottom: 16px;">
    Your application has been received successfully. Further details regarding your application status, next steps, and dashboard login credentials will be sent to you via a separate email shortly. Please keep an eye on your inbox!
  </p>
  
  <p style="font-size: 15px; color: #666666; margin-top: 30px; margin-bottom: 0;">
    For any assistance, please contact us at <a href="mailto:codeanova26@gmail.com" style="color: #2563eb; text-decoration: none;">codeanova26@gmail.com</a>.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;">
  
  <p style="font-size: 12px; color: #999999; text-align: center; margin: 0;">
    &copy; ${new Date().getFullYear()} CODE-A-NOVA. All rights reserved.<br>
    MSME Registered Organization
  </p>
  
</div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Confirmation email sent to ${email}`);
    } catch (mailErr) {
      console.error(`Failed to send confirmation email to ${email}:`, mailErr);
      // We still return 201 success because registration is complete
    }

    
    const isIntern = user.role === 'intern' || (user.internships && user.internships.length > 0);
    const role = isIntern ? 'intern' : 'interview_user';

    res.status(201).json({
      message: "Application submitted successfully",
      studentId,
      email: normalizedEmail,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: role
      },
      requiresOtp: true
    });
  

    // Queue WhatsApp Welcome Message safely in background
    if (normalizedMobile && normalizedMobile !== "0000000000") {
      const welcomeText = `🎉 *Welcome to Code-A-Nova, ${name}!*\n\nYour application for *${domain}* has been received successfully. ✅\n\n🆔 *Your Student ID:* ${studentId}\n📧 *Registered Email:* ${email}\n⏳ *Duration:* ${duration}\n\n🌐 *Join our Official Community:*\nhttps://chat.whatsapp.com/Eq34ntRCH4164W98bols7p\n\nWe will share further updates regarding your internship via email. Please keep an eye on your inbox! 📧\n\nRegards,\n*Team Code-A-Nova*`;
      queueWhatsAppMessage(normalizedMobile, welcomeText);
    }
  } catch (error) {
    console.error("[Backend] Internship registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createRegistrationOrder = async (req, res) => {
  try {
    const { email, mobile, domain, duration } = req.body;

    const normalizedEmail = email ? email.trim().toLowerCase() : "";
    const normalizedMobile = mobile ? mobile.trim() : "";

    // 1. Validation for 15-day restriction
    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.internships.length > 0) {
      const sortedInternships = [...user.internships].sort(
        (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt),
      );
      const lastApp = sortedInternships[0];

      const daysSinceLast = Math.floor(
        (new Date() - new Date(lastApp.appliedAt)) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceLast < 15) {
        return res.status(429).json({
          message: `You can reapply after 15 days from your last application (${new Date(lastApp.appliedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}). Days remaining: ${15 - daysSinceLast}`,
        });
      }

      const sameDomain = user.internships.find((app) => app.domain === domain);
      if (sameDomain) {
        const daysSinceSameDomain = Math.floor(
          (new Date() - new Date(sameDomain.appliedAt)) / (1000 * 60 * 60 * 24),
        );
        if (daysSinceSameDomain < 15) {
          return res.status(429).json({
            message: `You have already applied for ${domain} within the last 15 days.`,
          });
        }
      }
    }

    // 2. Compute Amount
    let amount = 199; // 1 or 2 months duration is 199
    if (duration && duration.includes("3")) {
      amount = 399; // 3 months duration is 399
    }

    // 3. Create Razorpay Order
    const order = await rzp.orders.create({
      amount: amount * 100, // Razorpay takes paise
      currency: "INR",
      receipt: `reg_${Date.now()}`,
    });

    res.json({
      order,
      key: process.env.RAZORPAY_KEY_ID,
      amount,
      message: "Razorpay order created successfully",
    });
  } catch (error) {
    console.error("[Backend] Create registration order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyRegistrationPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      email,
      whatsapp,
      name,
      domain,
      duration,
      course,
      branch,
      college,
      state,
      passingYear,
      github,
      linkedin,
      portfolio
    } = req.body;

    // 1. Verify Payment Signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : "";
    const normalizedMobile = whatsapp ? whatsapp.trim() : "";

    // Extra safety duplicate check
    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.internships.length > 0) {
      const sortedInternships = [...user.internships].sort(
        (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt),
      );
      const lastApp = sortedInternships[0];
      const daysSinceLast = Math.floor(
        (new Date() - new Date(lastApp.appliedAt)) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceLast < 15) {
        return res.status(429).json({
          message: `You can reapply after 15 days from your last application (${new Date(lastApp.appliedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}). Days remaining: ${15 - daysSinceLast}`,
        });
      }
    }

    const currentYear = new Date().getFullYear();
    const counterId = `internship_${currentYear}`;

    const counter = await Counter.findByIdAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    const serialNumber = String(counter.seq).padStart(3, "0");
    const studentId = `CN/INT/${currentYear}/${serialNumber}`;

    console.log("[Backend] Generated Student ID for Paid Reg:", studentId);

    let resumeUrl = "";
    if (req.file) {
      resumeUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "resumes", resource_type: "auto" },
          (error, result) => {
            if (result) {
              resolve(result.secure_url);
            } else {
              reject(error);
            }
          },
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    }

    const applicationData = {
      name,
      email: normalizedEmail,
      mobile: normalizedMobile,
      course,
      branch,
      college,
      state,
      passingYear,
      domain,
      duration,
      github,
      linkedin,
      portfolio,
      resume: resumeUrl,
      internshipType: getInternshipType(duration),
      studentId,
      appliedAt: new Date(),
      hasPaid: true, // Mark paid instantly!
      paymentAmount: duration && duration.includes("3") ? 399 : 199,
      razorpayPaymentId: razorpay_payment_id,
    };

    if (!user) {
      const hashedPassword = await bcrypt.hash("Welcome@123", 10);
      user = await User.create({
        name,
        email: normalizedEmail,
        mobile: normalizedMobile,
        password: hashedPassword,
        isFirstLogin: true,
        github: github || "",
        linkedin: linkedin || "",
        portfolio: portfolio || "",
        internships: [],
      });
    } else {
      if (github) user.github = github;
      if (linkedin) user.linkedin = linkedin;
      if (portfolio) user.portfolio = portfolio;

      // Fix for legacy users missing required fields
      if (!user.name) user.name = name || "Student";
      if (!user.mobile) user.mobile = normalizedMobile || "0000000000";

      if (!user.password) {
        const hashedPassword = await bcrypt.hash("Welcome@123", 10);
        user.password = hashedPassword;
        user.isFirstLogin = true;
      }
    }

    user.role = 'intern';
    user.internships.push(applicationData);
    await user.save();

    console.log("[Backend] Paid Internship saved with Student ID:", studentId);

    // Send confirmation email
    const mailOptions = {
      from: `"CODE-A-NOVA Internships" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Registration Confirmed - CODE-A-NOVA Internship`,
      html: `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 15px;">
  
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="https://drive.google.com/uc?export=view&id=18wSzAAQJE8LkxQDfI6RCfUmWfyqlQ_uc" alt="CODE-A-NOVA" style="width: 100%; height: auto; max-width: 600px; display: block;">
  </div>
  
  <p style="font-size: 16px; margin-bottom: 16px;">
    Dear <strong>${name}</strong>,
  </p>
  
  <p style="font-size: 16px; margin-bottom: 16px;">
    Thank you for applying to the <strong>${domain}</strong> Internship Program at CODE-A-NOVA.
  </p>
  
  <p style="font-size: 16px; margin-bottom: 16px;">
    Your application has been received successfully. Further details regarding your application status, next steps, and dashboard login credentials will be sent to you via a separate email shortly. Please keep an eye on your inbox!
  </p>
  
  <p style="font-size: 15px; color: #666666; margin-top: 30px; margin-bottom: 0;">
    For any assistance, please contact us at <a href="mailto:codeanova26@gmail.com" style="color: #2563eb; text-decoration: none;">codeanova26@gmail.com</a>.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;">
  
  <p style="font-size: 12px; color: #999999; text-align: center; margin: 0;">
    &copy; ${new Date().getFullYear()} CODE-A-NOVA. All rights reserved.<br>
    MSME Registered Organization
  </p>
  
</div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Paid Confirmation email sent to ${email}`);
    } catch (mailErr) {
      console.error(`Failed to send paid confirmation email to ${email}:`, mailErr);
      // We still return 201 success because registration and payment are complete
    }

    
    const isIntern = user.role === 'intern' || (user.internships && user.internships.length > 0);
    const role = isIntern ? 'intern' : 'interview_user';
    const tokenPayload = { 
      id: user._id,
      userId: user._id, 
      unifiedUserId: user._id, 
      unifiedRole: role 
    };
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: "Application submitted successfully",
      studentId,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: role
      }
    });
  

    // Queue WhatsApp Welcome Message safely in background
    if (normalizedMobile && normalizedMobile !== "0000000000") {
      const welcomeText = `🎉 *Welcome to Code-A-Nova, ${name}!*\n\nYour application for *${domain}* has been received successfully. ✅\n\n🆔 *Your Student ID:* ${studentId}\n📧 *Registered Email:* ${email}\n⏳ *Duration:* ${duration}\n\n🌐 *Join our Official Community:*\nhttps://chat.whatsapp.com/Eq34ntRCH4164W98bols7p\n\nWe will share further updates regarding your internship via email. Please keep an eye on your inbox! 📧\n\nRegards,\n*Team Code-A-Nova*`;
      queueWhatsAppMessage(normalizedMobile, welcomeText);
    }
  } catch (error) {
    console.error("[Backend] Verify registration payment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const sendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Save to DB
    await Otp.create({ email: user.email, otp });

    // Send Email
    const mailOptions = {
      from: `"CODE-A-NOVA" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Dashboard Login OTP",
      html: `<p>Your OTP to login to the dashboard is: <strong>${otp}</strong></p><p>It is valid for 10 minutes.</p>`
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const validOtp = await Otp.findOne({ email: user.email, otp }).sort({ createdAt: -1 });
    if (!validOtp) return res.status(400).json({ message: "Invalid or expired OTP" });

    // Delete OTP after successful verification
    await Otp.deleteMany({ email: user.email });

    const isIntern = user.role === 'intern' || (user.internships && user.internships.length > 0);
    const role = isIntern ? 'intern' : 'interview_user';
    
    const tokenPayload = { 
      id: user._id,
      userId: user._id, 
      unifiedUserId: user._id, 
      unifiedRole: role 
    };
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'secret',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: "OTP verified successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: role
      }
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

module.exports = {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  registerInternship,
  createRegistrationOrder,
  verifyRegistrationPayment,
};
