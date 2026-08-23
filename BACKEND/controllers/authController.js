const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const auditLogger = require("../utils/auditLogger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const loginStudent = async (req, res) => {
  try {
    const { email, studentId } = req.body;

    const normalizedEmail = email ? email.trim().toLowerCase() : "";
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or Student ID" });
    }

    // Find the specific internship by studentId
    const internship = user.internships.find(
      (app) => app.studentId === studentId,
    );
    if (!internship) {
      return res.status(401).json({ message: "Invalid email or Student ID" });
    }

    // Seamlessly sync and merge any pre-assigned Campus Ambassador data upon student login
    const { syncAndMergeAmbassadorData } = require('./referralController');
    await syncAndMergeAmbassadorData(user, normalizedEmail);

    const token = jwt.sign(
      { id: user._id, email: user.email, studentId: internship.studentId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    let verifiedPhone = null;
    if (user.mobile && user.mobile !== 'Google Auth') {
      verifiedPhone = user.mobile;
    } else if (user.internships && user.internships.length > 0) {
      for (let i = user.internships.length - 1; i >= 0; i--) {
        const intern = user.internships[i];
        if (intern.whatsapp || intern.mobile) {
          verifiedPhone = intern.whatsapp || intern.mobile;
          break;
        }
      }
    }

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: internship.studentId,
        isFirstLogin:
          user.isFirstLogin === undefined ? true : user.isFirstLogin,
        isPhoneVerified: !!verifiedPhone,
        mobile: verifiedPhone || '',
        roles: typeof user.getUserRoles === 'function' ? user.getUserRoles() : (user.roles || ['student']),
        status: user.status || 'Registered'
      },
    });

    // Log the login event
    auditLogger.log('STUDENT_LOGIN', {
      userId: user._id,
      userEmail: user.email,
      studentId: internship.studentId,
      ipAddress: req.ip
    });
  } catch (err) {
    console.error("[Backend] Login error:", err);
    res.status(500).json({ message: "Server configuration error or downtime" });
  }
};

const setupPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword || newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.isFirstLogin = false;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("[Backend] Setup password error:", err);
    res.status(500).json({ message: "Server configuration error or downtime" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email ? email.trim().toLowerCase() : "";

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = expires;
    await user.save();

    // Verify transporter connection before sending email
    transporter.verify(function (error, success) {
      if (error) {
        console.error("[Backend] Email transporter verification error:", error);
      } else {
        console.log("[Backend] Email transporter is ready to send messages");
      }
    });

    // Generate OTP and log it for debugging
    console.log("[Backend] Generated OTP for", email, ":", otp);

    // Prepare mail options
    const mailOptions = {
      from: `"CODE-A-NOVA Internships" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Password Reset OTP - CODE-A-NOVA`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Use the following OTP to proceed:</p>
          <h1 style="color: #2563eb; letter-spacing: 2px;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent to email successfully" });
  } catch (err) {
    console.error("[Backend] Forgot password error:", err);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = email ? email.trim().toLowerCase() : "";

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    user.isFirstLogin = false;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("[Backend] Reset password error:", err);
    res.status(500).json({ message: "Error resetting password" });
  }
};

module.exports = {
  loginStudent,
  setupPassword,
  forgotPassword,
  resetPassword,
};
