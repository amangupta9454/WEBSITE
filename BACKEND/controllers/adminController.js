const Admin = require("../models/Admin");
const User = require("../models/User");
const Certificate = require("../models/Certificate");
const SummerProject = require("../models/SummerProject");
const NormalTask = require("../models/NormalTask");
const Notification = require("../models/Notification");
const ProjectSubmission = require("../models/ProjectSubmission");
const QuizSponsor = require("../models/QuizSponsor");
const Otp = require("../models/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const nodemailer = require("nodemailer");
const { evaluateRepoWithAI, sendAIEvaluationEmail } = require("./projectController");
const mailService = require("../services/mailService");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD,
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const multer = require("multer");
const Settings = require("../models/Settings");
const Razorpay = require("razorpay");
const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});
const upload = multer({ storage: multer.memoryStorage() });

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "365d",
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getInternships = async (req, res) => {
  try {
    const users = await User.find({ "internships.0": { $exists: true } }); // Users with at least one internship
    const allSubmissions = await ProjectSubmission.find({}); // Globally pull tracking histories
    const allCertificates = await Certificate.find({}); // Fetch all certificates to match studentId

    const allApplications = [];

    users.forEach((user) => {
      user.internships.forEach((app) => {
        const isVerified = allCertificates.some((cert) => {
          return (
            cert.studentId &&
            app.studentId &&
            cert.studentId.toString().trim().toLowerCase() ===
              app.studentId.toString().trim().toLowerCase()
          );
        });
        allApplications.push({
          _id: app._id, // ← MUST include this
          studentId: app.studentId,
          name: app.name,
          email: app.email,
          mobile: app.mobile,
          whatsapp: app.whatsapp,
          course: app.course,
          branch: app.branch,
          year: app.year,
          college: app.college,
          state: app.state,
          passingYear: app.passingYear,
          domain: app.domain,
          duration: app.duration,
          portfolio: app.portfolio,
          github: app.github,
          linkedin: app.linkedin,
          whyHire: app.whyHire,
          hearAbout: app.hearAbout,
          resumeUrl: app.resumeUrl,
          batch: app.batch,
          internshipType: app.internshipType || "Normal Intern",
          appliedAt: app.appliedAt,
          downloadedAt: app.downloadedAt,
          startDate: app.startDate,
          endDate: app.endDate,
          totalMonths: app.totalMonths,
          certificateUrl: app.certificateUrl,
          offerLetterStatus: app.offerLetterStatus,
          hasPaid: app.hasPaid,
          paidExported: app.paidExported || false,
          projectExported: app.projectExported || false,
          isCertificateSent: app.isCertificateSent || false,
          paymentAmount: app.paymentAmount || 0,
          refundAmount: app.refundAmount || 0,
          synergyPoints: app.synergyPoints || 0,
          isCertificateVerified: isVerified,
          assignedRepos: app.assignedRepos || [],
          assignedNormalTasks: app.assignedNormalTasks || [],
          submissions: allSubmissions.filter(
            (sub) => String(sub.studentId) === String(app.studentId),
          ),
        });
      });
    });

    res.json(allApplications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const markDownloaded = async (req, res) => {
  try {
    const { applicationIds } = req.body;

    if (
      !applicationIds ||
      !Array.isArray(applicationIds) ||
      applicationIds.length === 0
    ) {
      return res.status(400).json({ message: "No application IDs provided" });
    }

    let modifiedCount = 0;

    // Loop through each application ID and update individually
    for (const appId of applicationIds) {
      const result = await User.updateOne(
        { "internships._id": appId },
        { $set: { "internships.$.downloadedAt": new Date() } },
      );
      if (result.modifiedCount > 0) {
        modifiedCount++;
      }
    }

    console.log(
      `[Admin] Successfully marked ${modifiedCount} applications as downloaded`,
    );

    res.json({
      message: "Marked as downloaded",
      modifiedCount,
    });
  } catch (error) {
    console.error("[Admin] Error marking downloaded:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateInternshipDetails = async (req, res) => {
  try {
    const { applicationId, startDate, certificateUrl } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "Application ID required" });
    }

    const user = await User.findOne({ "internships._id": applicationId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const internship = user.internships.id(applicationId);
    if (!internship)
      return res.status(404).json({ message: "Internship not found" });

    const durationStr = internship.duration || "1 Month";
    const totalMonths = parseInt(durationStr.split(" ")[0], 10) || 1;

    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + totalMonths);

    internship.startDate = start;
    internship.endDate = end;
    internship.totalMonths = totalMonths;
    if (certificateUrl) {
      internship.certificateUrl = certificateUrl;
    }
    


    await user.save();

    res.json({
      message: "Internship details updated successfully",
      startDate: start,
      endDate: end,
    });
  } catch (error) {
    console.error("[Admin] Error updating internship details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const assignNormalTasks = async (req, res) => {
  try {
    const { applicationId, tasks } = req.body;
    if (!applicationId || !Array.isArray(tasks)) {
      return res.status(400).json({ message: "Application ID and tasks array are required" });
    }

    const user = await User.findOne({ "internships._id": applicationId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const internship = user.internships.id(applicationId);
    if (!internship) return res.status(404).json({ message: "Internship not found" });

    internship.assignedNormalTasks = tasks;
    await user.save();

    // Send WhatsApp notification
    const whatsappNumber = internship.whatsapp || internship.mobile || user.mobile;
    if (whatsappNumber && String(whatsappNumber).replace(/[^0-9]/g, '').length >= 10) {
      const projectNames = tasks.join(', ');
      const message = `Hello! 👋\n\nA new project has been assigned to you.\n\n` +
        `📁 *Project Name:* ${projectNames}\n` +
        `📧 *Email:* ${internship.email || user.email}\n` +
        `🆔 *Student ID:* ${internship.studentId}\n\n` +
        `Please log in to your dashboard to view the details.\n\n` +
        `Best of luck,\nCode-A-Nova Team`;
      
      const { queueWhatsAppMessage } = require("../utils/whatsappClient");
      await queueWhatsAppMessage(whatsappNumber, message);
    }

    res.json({ message: "Tasks assigned successfully", assignedNormalTasks: tasks });
  } catch (error) {
    console.error("[Admin] Error assigning normal tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateOfferStatus = async (req, res) => {
  try {
    const { applicationId, status } = req.body;
    if (!applicationId || !status) {
      return res
        .status(400)
        .json({ message: "Application ID and status required" });
    }

    const result = await User.updateOne(
      { "internships._id": applicationId },
      { $set: { "internships.$.offerLetterStatus": status } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ message: `Offer letter marked as ${status}` });
  } catch (error) {
    console.error("[Admin] Error updating offer status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// backend/controllers/adminController.js - Replace uploadCertificates with this

const uploadCertificates = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
      cellDates: true,
      raw: false,
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const certificates = data
      .map((row) => {
        let startDate = row.Start_Date;
        let endDate = row.End_Date;

        // If not Date, parse as string in dd-mm-yyyy
        const parseDate = (val) => {
          if (val instanceof Date) return val;
          if (typeof val !== "string") return null;

          const parts = val.trim().split(/[-\/.]/);
          if (parts.length !== 3) return null;

          let d = parseInt(parts[0], 10);
          let m = parseInt(parts[1], 10);
          let y = parseInt(parts[2], 10);

          if (y < 100) y += 2000;

          // Handle if accidentally mm-dd-yyyy
          if (m > 12 && d <= 12) {
            [d, m] = [m, d];
          }

          const dateObj = new Date(y, m - 1, d);
          if (isNaN(dateObj.getTime())) return null;

          dateObj.setUTCHours(0, 0, 0, 0); // Critical fix
          return dateObj;
        };

        startDate = parseDate(startDate);
        endDate = parseDate(endDate);

        if (!startDate || !endDate) {
          console.warn("Invalid date in row:", row);
          return null; // Skip invalid dates instead of throwing 500 Error
        }

        return {
          certificateNumber: row.Certificate_Number?.toString().trim(),
          studentName: row.Student_Name?.toString().trim(),
          domain: row.Domain?.toString().trim(),
          startDate,
          endDate,
          duration: row.Duration?.toString().trim(),
          studentId: row.Student_ID?.toString().trim(),
          batch: row.Batch?.toString().trim(),
          email: (row.Email || row.Email_ID || row["Email ID"])?.toString().trim() || `${row.Student_ID?.toString().trim()}@legacy.codeanova.com`,
          mobile: (row.Mobile || row.Phone || row["Phone Number"])?.toString().trim() || "0000000000",
        };
      })
      .filter((cert) => cert && cert.certificateNumber && cert.studentId); // Filter invalid

    if (certificates.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid certificates found in the Excel file" });
    }

    // Insert to DB (ignore duplicates safely)
    try {
      const studentIds = certificates.map((c) => c.studentId);

      try {
        await Certificate.insertMany(certificates, { ordered: false });
      } catch (insertError) {
        if (insertError.code !== 11000) {
          throw insertError;
        }
      }

      // Update or create users based on certificate data
      for (const cert of certificates) {
        // Find if user already exists (by email or studentId in internships)
        const existingUser = await User.findOne({
          $or: [
            { email: cert.email },
            { "internships.studentId": cert.studentId }
          ]
        });

        if (existingUser) {
          // If user exists, check if they have this specific internship
          const internshipIndex = existingUser.internships.findIndex(
            (i) => i.studentId === cert.studentId || (i.domain === cert.domain && !i.studentId)
          );

          if (internshipIndex >= 0) {
            // Update existing internship
            existingUser.internships[internshipIndex].studentId = cert.studentId;
            existingUser.internships[internshipIndex].startDate = cert.startDate;
            existingUser.internships[internshipIndex].endDate = cert.endDate;
            existingUser.internships[internshipIndex].domain = cert.domain;
            existingUser.internships[internshipIndex].duration = cert.duration;
            existingUser.internships[internshipIndex].isCertificateSent = true;
            existingUser.internships[internshipIndex].certificateUrl = cert.certificateNumber; // Storing ID for reference
          } else {
            // User exists but internship doesn't, add it
            existingUser.internships.push({
              studentId: cert.studentId,
              name: cert.studentName || existingUser.name,
              email: cert.email || existingUser.email,
              mobile: cert.mobile || existingUser.mobile,
              domain: cert.domain,
              startDate: cert.startDate,
              endDate: cert.endDate,
              duration: cert.duration,
              internshipType: "Legacy Intern",
              isCertificateSent: true,
              certificateUrl: cert.certificateNumber
            });
          }
          await existingUser.save();
        } else {
          // User doesn't exist, create legacy user
          const newUser = new User({
            name: cert.studentName || "Legacy User",
            email: cert.email,
            mobile: cert.mobile,
            password: "", // Legacy users might need to reset password
            isFirstLogin: true,
            role: "intern",
            internships: [{
              studentId: cert.studentId,
              name: cert.studentName || "Legacy User",
              email: cert.email,
              mobile: cert.mobile,
              domain: cert.domain,
              startDate: cert.startDate,
              endDate: cert.endDate,
              duration: cert.duration,
              internshipType: "Legacy Intern",
              isCertificateSent: true,
              certificateUrl: cert.certificateNumber
            }]
          });
          await newUser.save();
        }
      }

      res.json({
        message: `Upload completed. Certificates verified and ${certificates.length} users/internships updated automatically.`,
      });
    } catch (error) {
      console.error("[Admin] Error uploading certificates:", error);
      res.status(500).json({ message: "Server error: " + error.message });
    }
  } catch (error) {
    console.error("[Admin] Error uploading certificates:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};
const setStartDate = async (req, res) => {
  try {
    const { applicationId, startDate } = req.body;
    if (!applicationId || !startDate) {
      return res
        .status(400)
        .json({ message: "Application ID and start date required" });
    }

    const user = await User.findOne({ "internships._id": applicationId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const internship = user.internships.id(applicationId);
    if (!internship)
      return res.status(404).json({ message: "Internship not found" });

    const durationStr = internship.duration || "1 Month";
    const totalMonths = parseInt(durationStr.split(" ")[0], 10) || 1;

    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + totalMonths);

    internship.startDate = start;
    internship.endDate = end;
    internship.totalMonths = totalMonths;
    


    await user.save();

    res.json({
      message: "Timeline updated successfully",
      startDate: start,
      endDate: end,
    });
  } catch (error) {
    console.error("[Admin] Error setting start date:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateBatch = async (req, res) => {
  try {
    const { applicationId, batch } = req.body;
    if (!applicationId) {
      return res.status(400).json({ message: "Application ID required" });
    }

    const result = await User.updateOne(
      { "internships._id": applicationId },
      { $set: { "internships.$.batch": batch || "" } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ message: "Batch updated successfully" });
  } catch (error) {
    console.error("[Admin] Error updating batch:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateInternshipType = async (req, res) => {
  try {
    const { applicationId, internshipType } = req.body;
    console.log("[DEBUG] updateInternshipType called with:", { applicationId, internshipType });
    if (!applicationId) {
      console.log("[DEBUG] No applicationId provided");
      return res.status(400).json({ message: "Application ID required" });
    }

    const result = await User.updateOne(
      { "internships._id": applicationId },
      {
        $set: {
          "internships.$.internshipType": internshipType || "Normal Intern",
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ message: "Internship type updated successfully" });
  } catch (error) {
    console.error("[Admin] Error updating internship type:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updatePaidStatus = async (req, res) => {
  try {
    const { applicationId, hasPaid } = req.body;
    if (!applicationId) {
      return res.status(400).json({ message: "Application ID required" });
    }

    const result = await User.updateOne(
      { "internships._id": applicationId },
      {
        $set: {
          "internships.$.hasPaid": hasPaid,
          "internships.$.paidExported": false,
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ message: `Paid status updated to ${hasPaid ? "Yes" : "No"}` });
  } catch (error) {
    console.error("[Admin] Error updating paid status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateCertificateSent = async (req, res) => {
  try {
    const { applicationId, isCertificateSent } = req.body;
    if (!applicationId) {
      return res.status(400).json({ message: "Application ID required" });
    }

    const result = await User.updateOne(
      { "internships._id": applicationId },
      { $set: { "internships.$.isCertificateSent": isCertificateSent } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({
      message: `Certificate sent status updated to ${isCertificateSent ? "Yes" : "No"}`,
    });
  } catch (error) {
    console.error("[Admin] Error updating certificate sent status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const markPaidExported = async (req, res) => {
  try {
    const { applicationIds } = req.body;
    if (
      !applicationIds ||
      !Array.isArray(applicationIds) ||
      applicationIds.length === 0
    ) {
      return res.status(400).json({ message: "No application IDs provided" });
    }

    let modifiedCount = 0;
    for (const appId of applicationIds) {
      const result = await User.updateOne(
        { "internships._id": appId },
        { $set: { "internships.$.paidExported": true } },
      );
      if (result.modifiedCount > 0) {
        modifiedCount++;
      }
    }

    res.json({
      message: `Successfully marked ${modifiedCount} paid student(s) as exported.`,
      modifiedCount,
    });
  } catch (error) {
    console.error("[Admin] Error marking paid exported:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const markProjectExported = async (req, res) => {
  try {
    const { applicationIds } = req.body;
    if (
      !applicationIds ||
      !Array.isArray(applicationIds) ||
      applicationIds.length === 0
    ) {
      return res.status(400).json({ message: "No application IDs provided" });
    }

    let modifiedCount = 0;
    for (const appId of applicationIds) {
      const result = await User.updateOne(
        { "internships._id": appId },
        { $set: { "internships.$.projectExported": true } },
      );
      if (result.modifiedCount > 0) {
        modifiedCount++;
      }
    }

    res.json({
      message: `Successfully marked ${modifiedCount} submitted student(s) as exported.`,
      modifiedCount,
    });
  } catch (error) {
    console.error("[Admin] Error marking project exported:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getJobPortalSetting = async (req, res) => {
  try {
    let enabledSetting = await Settings.findOne({ key: "jobPortalEnabled" });
    if (!enabledSetting) {
      enabledSetting = await Settings.create({ key: "jobPortalEnabled", value: true });
    }

    let freeModeSetting = await Settings.findOne({ key: "jobPortalFreeMode" });
    if (!freeModeSetting) {
      freeModeSetting = await Settings.create({ key: "jobPortalFreeMode", value: true });
    }

    let priceSetting = await Settings.findOne({ key: "jobPortalPremiumPrice" });
    if (!priceSetting) {
      priceSetting = await Settings.create({ key: "jobPortalPremiumPrice", value: 199 });
    }

    let freeModeExpiresSetting = await Settings.findOne({ key: "jobPortalFreeModeExpires" });
    const freeModeExpires = freeModeExpiresSetting ? freeModeExpiresSetting.value : null;

    res.status(200).json({
      jobPortalEnabled: enabledSetting.value,
      jobPortalFreeMode: freeModeSetting.value === true,
      jobPortalFreeModeExpires: freeModeExpires,
      jobPortalPremiumPrice: Number(priceSetting.value) || 199
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const toggleJobPortalSetting = async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: "jobPortalEnabled" });
    if (!setting) {
      setting = new Settings({ key: "jobPortalEnabled", value: true });
    }

    setting.value = !setting.value;
    await setting.save();

    res.status(200).json({
      message: `Job Portal is now ${setting.value ? "Enabled" : "Disabled"}`,
      jobPortalEnabled: setting.value,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

const toggleJobPortalFreeMode = async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: "jobPortalFreeMode" });
    if (!setting) {
      setting = new Settings({ key: "jobPortalFreeMode", value: true });
    }

    setting.value = !setting.value;
    await setting.save();

    let freeModeExpires = null;
    let extensionMsg = "";

    if (setting.value === true) {
      // Set expiration to 30 days from now
      freeModeExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await Settings.findOneAndUpdate(
        { key: "jobPortalFreeModeExpires" },
        { key: "jobPortalFreeModeExpires", value: freeModeExpires },
        { upsert: true }
      );

      // Protect existing Premium users: extend active subscriptions by +30 days so tokens aren't wasted
      const activeUsers = await User.find({ jobPortalPremium: true, jobPortalPremiumExpires: { $gt: new Date() } });
      let modifiedCount = 0;
      for (const u of activeUsers) {
        if (u.jobPortalPremiumExpires) {
          u.jobPortalPremiumExpires = new Date(new Date(u.jobPortalPremiumExpires).getTime() + 30 * 24 * 60 * 60 * 1000);
          await u.save();
          modifiedCount++;
        }
      }
      if (modifiedCount > 0) {
        extensionMsg = ` Protected ${modifiedCount} existing Premium subscriber(s) by extending their plan by +30 days!`;
      }
    } else {
      await Settings.deleteOne({ key: "jobPortalFreeModeExpires" });
    }

    res.status(200).json({
      success: true,
      message: `Free Promo Mode is now ${setting.value ? `ON for 30 days!${extensionMsg}` : "OFF (Reverted to Paid Token subscription mode)"}`,
      jobPortalFreeMode: setting.value,
      jobPortalFreeModeExpires: freeModeExpires,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const updateJobPortalPrice = async (req, res) => {
  try {
    const { price } = req.body;
    if (!price || isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "Please provide a valid token price greater than 0" });
    }

    let setting = await Settings.findOne({ key: "jobPortalPremiumPrice" });
    if (!setting) {
      setting = new Settings({ key: "jobPortalPremiumPrice", value: Number(price) });
    } else {
      setting.value = Number(price);
    }
    await setting.save();

    res.status(200).json({
      success: true,
      message: `3-Month Premium Plan price successfully updated to ${setting.value} Tokens!`,
      jobPortalPremiumPrice: setting.value,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const getPaymentSetting = async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: "paymentEnabled" });
    if (!setting) {
      setting = await Settings.create({ key: "paymentEnabled", value: true });
    }
    res.json({ paymentEnabled: setting.value });
  } catch (error) {
    console.error("[Admin] Error getting payment setting:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const togglePaymentSetting = async (req, res) => {
  try {
    const { paymentEnabled } = req.body;
    const setting = await Settings.findOneAndUpdate(
      { key: "paymentEnabled" },
      { value: paymentEnabled },
      { new: true, upsert: true },
    );
    res.json({
      message: `Payment is now ${paymentEnabled ? "enabled" : "disabled"}`,
      paymentEnabled: setting.value,
    });
  } catch (error) {
    console.error("[Admin] Error toggling payment setting:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const getRegistrationSetting = async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: "registrationEnabled" });
    if (!setting) {
      setting = await Settings.create({
        key: "registrationEnabled",
        value: true,
      });
    }
    res.json({ registrationEnabled: setting.value });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const toggleRegistrationSetting = async (req, res) => {
  try {
    const { registrationEnabled } = req.body;
    let setting = await Settings.findOneAndUpdate(
      { key: "registrationEnabled" },
      { value: registrationEnabled },
      { new: true, upsert: true },
    );
    res.json({
      message: `Registration is now ${registrationEnabled ? "enabled" : "disabled"}`,
      registrationEnabled: setting.value,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const createSummerProject = async (req, res) => {
  try {
    const { domain, name, description, dueDate } = req.body;
    if (!domain || !name || !description || !dueDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let pdfUrl = "";
    if (req.file) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "summer_projects" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      pdfUrl = await uploadPromise;
    }

    const project = new SummerProject({ domain, name, description, dueDate, pdfUrl });
    await project.save();
    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    console.error("[Admin] Error creating summer project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getSummerProjects = async (req, res) => {
  try {
    const projects = await SummerProject.find({}).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error("[Admin] Error getting summer projects:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteSummerProject = async (req, res) => {
  try {
    const { id } = req.params;
    await SummerProject.findByIdAndDelete(id);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("[Admin] Error deleting summer project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateAssignedRepo = async (req, res) => {
  try {
    const { applicationId, projectId, repoLink } = req.body;
    if (!applicationId || !projectId) {
      return res.status(400).json({ message: "Application ID and Project ID required" });
    }

    const user = await User.findOne({ "internships._id": applicationId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const internship = user.internships.id(applicationId);
    if (!internship) return res.status(404).json({ message: "Internship not found" });

    // Initialize assignedRepos if missing
    if (!internship.assignedRepos) {
      internship.assignedRepos = [];
    }

    const repoIndex = internship.assignedRepos.findIndex(r => r.projectId.toString() === projectId);
    
    if (repoIndex > -1) {
      internship.assignedRepos[repoIndex].repoLink = repoLink || "";
    } else {
      internship.assignedRepos.push({ projectId, repoLink: repoLink || "" });
    }

    await user.save();

    // Fetch summer project name to send WhatsApp notification
    const SummerProject = require("../models/SummerProject");
    const projectInfo = await SummerProject.findById(projectId);
    const projectName = projectInfo ? projectInfo.name : "Summer Project";

    const whatsappNumber = internship.whatsapp || internship.mobile || user.mobile;
    if (whatsappNumber && String(whatsappNumber).replace(/[^0-9]/g, '').length >= 10) {
      const message = `Hello! 👋\n\nA new project has been assigned to you.\n\n` +
        `📁 *Project Name:* ${projectName}\n` +
        `📧 *Email:* ${internship.email || user.email}\n` +
        `🆔 *Student ID:* ${internship.studentId}\n\n` +
        `Please log in to your dashboard to view the details.\n\n` +
        `Best of luck,\nCode-A-Nova Team`;
      
      const { queueWhatsAppMessage } = require("../utils/whatsappClient");
      await queueWhatsAppMessage(whatsappNumber, message);
    }

    res.json({ message: "Repository tracked successfully" });
  } catch (error) {
    console.error("[Admin] Error updating assigned repo:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getNormalTasks = async (req, res) => {
  try {
    const tasks = await NormalTask.find().sort({ domain: 1, monthNumber: 1 });
    res.json(tasks);
  } catch (error) {
    console.error("[Admin] Error fetching normal tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createNormalTask = async (req, res) => {
  try {
    const { domain, monthNumber, description } = req.body;
    if (!domain || !monthNumber) {
      return res.status(400).json({ message: "Domain and month number are required" });
    }

    let pdfUrl = "";
    if (req.file) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "normal_tasks" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      pdfUrl = await uploadPromise;
    }

    if (!pdfUrl) {
      return res.status(400).json({ message: "Task PDF file is required" });
    }

    const existingTask = await NormalTask.findOne({ domain, monthNumber });
    if (existingTask) {
      existingTask.pdfUrl = pdfUrl;
      existingTask.description = description;
      await existingTask.save();
      return res.status(200).json({ message: "Task updated successfully", task: existingTask });
    }

    const newTask = new NormalTask({ domain, monthNumber, pdfUrl, description });
    await newTask.save();
    res.status(201).json({ message: "Task created successfully", task: newTask });
  } catch (error) {
    console.error("[Admin] Error creating normal task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteNormalTask = async (req, res) => {
  try {
    const { id } = req.params;
    await NormalTask.findByIdAndDelete(id);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("[Admin] Error deleting normal task:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const bulkUpdate = async (req, res) => {
  try {
    const { applicationIds, updates } = req.body;
    
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: "No application IDs provided" });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    let modifiedCount = 0;

    for (const appId of applicationIds) {
      const user = await User.findOne({ "internships._id": appId });
      if (!user) continue;

      const internship = user.internships.id(appId);
      if (!internship) continue;

      let needsSave = false;

      if (updates.internshipType !== undefined && updates.internshipType !== "") {
        internship.internshipType = updates.internshipType;
        needsSave = true;
      }

      if (updates.startDate !== undefined && updates.startDate !== "") {
        const durationStr = internship.duration || "1 Month";
        const totalMonths = parseInt(durationStr.split(" ")[0], 10) || 1;

        const start = new Date(updates.startDate);
        const end = new Date(start);
        end.setMonth(end.getMonth() + totalMonths);

        internship.startDate = start;
        internship.endDate = end;
        internship.totalMonths = totalMonths;
        needsSave = true;
        

      }

      if (updates.offerLetterStatus !== undefined && updates.offerLetterStatus !== "") {
        internship.offerLetterStatus = updates.offerLetterStatus;
        needsSave = true;
      }

      if (updates.hasPaid !== undefined && updates.hasPaid !== "") {
        internship.hasPaid = updates.hasPaid === "Yes" || updates.hasPaid === true;
        internship.paidExported = false; 
        needsSave = true;
      }

      if (updates.isCertificateSent !== undefined && updates.isCertificateSent !== "") {
        internship.isCertificateSent = updates.isCertificateSent === "Yes" || updates.isCertificateSent === true;
        needsSave = true;
      }

      if (needsSave) {
        await user.save();
        modifiedCount++;
      }
    }

    res.json({
      message: `Successfully updated ${modifiedCount} application(s).`,
      modifiedCount,
    });
  } catch (error) {
    console.error("[Admin] Error in bulk update:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createNotification = async (req, res) => {
  try {
    const { message, audience } = req.body;
    if (!message || !audience) {
      return res.status(400).json({ message: "Message and audience are required" });
    }
    const notification = new Notification({ message, audience });
    await notification.save();
    res.status(201).json({ message: "Notification created", notification });
  } catch (error) {
    console.error("[Admin] Error creating notification:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error("[Admin] Error getting notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("[Admin] Error deleting notification:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const syncRefunds = async (req, res) => {
  try {
    let allRefunds = [];
    let skip = 0;
    while (true) {
      const refunds = await rzp.refunds.all({ count: 100, skip });
      if (!refunds || !refunds.items || refunds.items.length === 0) break;
      allRefunds = allRefunds.concat(refunds.items);
      if (refunds.items.length < 100) break;
      skip += 100;
    }

    let updatedCount = 0;
    for (const refund of allRefunds) {
      if (refund.status === 'processed') {
        const paymentId = refund.payment_id;
        const amountRefunded = refund.amount / 100;

        const result = await User.updateOne(
          { "internships.razorpayPaymentId": paymentId },
          { $set: { "internships.$.refundAmount": amountRefunded } }
        );
        if (result.modifiedCount > 0) {
          updatedCount++;
        }
      }
    }
    res.json({ message: `Successfully synced refunds. Updated ${updatedCount} records.` });
  } catch (error) {
    console.error("[Admin] Error syncing refunds:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const reviewSummerProject = async (req, res) => {
  try {
    const { applicationId, projectId, reviewStatus, feedback } = req.body;
    if (!applicationId || !projectId) {
      return res.status(400).json({ message: "Application ID and Project ID required" });
    }

    const user = await User.findOne({ "internships._id": applicationId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const internship = user.internships.id(applicationId);
    if (!internship) return res.status(404).json({ message: "Internship not found" });

    if (!internship.assignedRepos) {
      return res.status(404).json({ message: "No assigned repositories found" });
    }

    const repoIndex = internship.assignedRepos.findIndex(r => r.projectId.toString() === projectId);
    if (repoIndex === -1) {
      return res.status(404).json({ message: "Repository assignment not found" });
    }

    if (!internship.assignedRepos[repoIndex].isFinalSubmitted) {
      return res.status(400).json({ message: "Student has not finally submitted this project yet." });
    }

    internship.assignedRepos[repoIndex].reviewStatus = reviewStatus;
    internship.assignedRepos[repoIndex].feedback = feedback;
    internship.assignedRepos[repoIndex].emailSent = false;
    
    // Add Synergy Points if Accepted and points not already awarded
    if (reviewStatus === 'Accepted' && !internship.assignedRepos[repoIndex].pointsAwarded) {
      internship.assignedRepos[repoIndex].pointsAwarded = true;
      internship.assignedRepos[repoIndex].spAwarded = 50;
      internship.synergyPoints = (internship.synergyPoints || 0) + 50;
      if (!internship.pointsHistory) internship.pointsHistory = [];
      
      const project = await SummerProject.findById(projectId);
      const projectName = project ? project.name : "Summer Project";

      internship.pointsHistory.push({
        reason: `Project Accepted: ${projectName}`,
        pointsAdded: 50,
        date: internship.assignedRepos[repoIndex].submittedAt || (project ? project.dueDate : new Date())
      });
    }
    
    await user.save();

    // Send email notification
    try {
      const project = await SummerProject.findById(projectId);
      const projectName = project ? project.name : "your project";
      
      const mailOptions = {
        from: `"CODE-A-NOVA Internships" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Update on your Summer Project Submission - ${projectName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 0;">
              <img src="https://drive.google.com/uc?export=view&id=18wSzAAQJE8LkxQDfI6RCfUmWfyqlQ_uc" alt="CODE-A-NOVA Banner" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 10px 10px 0 0;" />
            </div>
            <div style="padding: 20px; background-color: #ffffff; border-radius: 0 0 8px 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
              <h2 style="color: #333333; text-align: center; border-bottom: 2px solid #6c63ff; padding-bottom: 10px;">Project Review Update</h2>
              <p style="font-size: 16px; color: #555555;">Dear <strong>${user.name}</strong>,</p>
              <p style="font-size: 15px; color: #666666; line-height: 1.6;">
                Your recent project submission for <strong>${projectName}</strong> has been carefully reviewed by our evaluation team.
              </p>
              
              <div style="background-color: #f0f4f8; padding: 15px; border-left: 4px solid #6c63ff; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 5px 0;"><strong>Student ID:</strong> ${internship.studentId || "N/A"}</p>
                <p style="margin: 5px 0;"><strong>Registered Email:</strong> ${user.email}</p>
                <p style="margin: 5px 0;"><strong>Review Status:</strong> <span style="color: ${reviewStatus === 'Accepted' ? '#28a745' : '#dc3545'}; font-weight: bold;">${reviewStatus}</span></p>
                ${feedback ? `<p style="margin: 5px 0;"><strong>Feedback/Remarks:</strong> ${feedback}</p>` : ''}
              </div>

              <p style="font-size: 15px; color: #666666; line-height: 1.6;">
                ${reviewStatus === 'Accepted' 
                  ? 'Congratulations! Your project meets our standards and has been successfully accepted. Keep up the excellent work and continue building your skills!' 
                  : 'Please review the feedback provided above and make the necessary changes to your project repository. Once updated, our team will re-evaluate your submission.'}
              </p>

              <p style="font-size: 14px; color: #999999; margin-top: 30px; text-align: center;">
                Best regards,<br/>
                <strong style="color: #333333;">CODE-A-NOVA Internships Team</strong><br/>
                <a href="https://code-a-nova.online" style="color: #6c63ff; text-decoration: none;">www.code-a-nova.online</a>
              </p>
            </div>
          </div>
        `,
      };
      
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("[Admin] Failed to send email notification for project review:", emailError);
    }

    res.json({ message: "Project review updated successfully" });
  } catch (error) {
    console.error("[Admin] Error reviewing summer project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const manualAcceptAssignment = async (req, res) => {
  try {
    const { submissionId, assignmentId } = req.body;
    if (!submissionId || !assignmentId) {
      return res.status(400).json({ message: "Submission ID and Assignment ID required" });
    }

    const submission = await ProjectSubmission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const assignment = submission.assignments.id(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    if (assignment.aiStatus === 'Accepted') {
      return res.status(400).json({ message: "Assignment is already accepted" });
    }

    assignment.aiStatus = 'Accepted';
    assignment.aiFeedback = 'Manually Accepted by Admin';
    assignment.emailSent = false;
    await submission.save();

    const user = await User.findOne({ 'internships.studentId': submission.studentId });
    if (user) {
      const internship = user.internships.find(app => app.studentId === submission.studentId);
      if (internship) {
        internship.synergyPoints = (internship.synergyPoints || 0) + 50;
        if (!internship.pointsHistory) internship.pointsHistory = [];
        internship.pointsHistory.push({
          reason: `Project Accepted: ${assignment.projectName}`,
          pointsAdded: 50,
          date: assignment.submittedAt || new Date()
        });
        await user.save();
      }
    }

    res.json({ message: "Assignment manually accepted successfully" });
  } catch (error) {
    console.error("[Admin] Error manually accepting assignment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Submissions & SP Override ---

const getAllSubmissions = async (req, res) => {
  try {
    const normalSubmissions = await ProjectSubmission.find({}).sort({ submittedAt: -1 }).lean();
    const users = await User.find({'internships.assignedRepos': { $exists: true, $not: {$size: 0} }}).lean();
    
    let allSubmissions = [];

    // Map Normal Submissions
    for (let sub of normalSubmissions) {
      if (sub.assignments && sub.assignments.length > 0) {
        sub.assignments.forEach(assignment => {
          allSubmissions.push({
            id: assignment._id?.toString() || Math.random().toString(),
            studentId: sub.studentId,
            name: sub.name,
            email: sub.email,
            internshipType: 'Normal Intern',
            projectName: assignment.projectName,
            githubLink: assignment.github,
            hostedLink: assignment.hosted,
            aiStatus: assignment.aiStatus,
            aiFeedback: assignment.aiFeedback,
            spAwarded: assignment.spAwarded || 0,
            submittedAt: sub.submittedAt,
            isFinalSubmitted: true,
            // For overriding SP
            modelRef: 'ProjectSubmission',
            docId: sub._id.toString(),
            assignmentId: assignment._id?.toString()
          });
        });
      }
    }

    // Map Summer/Winter Submissions
    for (let user of users) {
      for (let internship of user.internships) {
        if (internship.assignedRepos && internship.assignedRepos.length > 0) {
          for (let repo of internship.assignedRepos) {
            allSubmissions.push({
              id: repo._id?.toString() || Math.random().toString(),
              studentId: internship.studentId,
              name: user.name,
              email: user.email,
              internshipType: internship.internshipType || 'Summer Intern',
              projectName: 'Summer Project',
              githubLink: repo.repoLink,
              hostedLink: '',
              aiStatus: repo.reviewStatus || 'Pending',
              aiFeedback: repo.feedback || '',
              spAwarded: repo.spAwarded || (repo.pointsAwarded ? 50 : 0), 
              submittedAt: repo.submittedAt || null,
              isFinalSubmitted: repo.isFinalSubmitted || false,
              // For overriding SP
              modelRef: 'User',
              docId: user._id.toString(),
              internshipId: internship._id.toString(),
              assignmentId: repo._id?.toString()
            });
          }
        }
      }
    }

    // Sort by submittedAt descending
    allSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({ submissions: allSubmissions });
  } catch (error) {
    console.error('[Admin] Get all submissions error:', error);
    res.status(500).json({ message: 'Server error retrieving submissions' });
  }
};

const overrideSP = async (req, res) => {
  try {
    const { modelRef, docId, internshipId, assignmentId, newSpAwarded, reason, aiStatus, aiFeedback } = req.body;
    
    // SP can't exceed 50 per project
    let finalSp = Number(newSpAwarded) || 0;
    if (finalSp > 50) finalSp = 50;

    if (modelRef === 'ProjectSubmission') {
      const sub = await ProjectSubmission.findById(docId);
      if (!sub) return res.status(404).json({ message: 'Submission not found' });
      
      const assignment = sub.assignments.id(assignmentId);
      if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
      
      const oldSp = assignment.spAwarded || 0;
      const difference = finalSp - oldSp;
      
      assignment.spAwarded = finalSp;
      if (aiStatus) assignment.aiStatus = aiStatus;
      if (aiFeedback !== undefined) assignment.aiFeedback = aiFeedback;

      await sub.save();
      
      // Update User Synergy Points
      const user = await User.findOne({ 'internships.studentId': sub.studentId });
      if (user) {
        const internship = user.internships.find(app => app.studentId === sub.studentId);
        if (internship) {
          internship.synergyPoints = (internship.synergyPoints || 0) + difference;
          if (!internship.pointsHistory) internship.pointsHistory = [];
          internship.pointsHistory.push({
            reason: `Admin SP Override for ${assignment.projectName}: ${reason || 'Manual adjustment'}`,
            pointsAdded: difference,
            date: assignment.submittedAt || new Date()
          });
          await user.save();
        }
      }
    } else if (modelRef === 'User') {
      const user = await User.findById(docId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      const internship = user.internships.id(internshipId);
      if (!internship) return res.status(404).json({ message: 'Internship not found' });
      
      const repo = internship.assignedRepos.id(assignmentId);
      if (!repo) return res.status(404).json({ message: 'Repo not found' });
      
      if (!repo.isFinalSubmitted) {
         return res.status(400).json({ message: "Student has not finally submitted this project yet." });
      }
      
      const oldSp = repo.spAwarded || (repo.pointsAwarded ? 50 : 0); 
      const difference = finalSp - oldSp;
      
      repo.spAwarded = finalSp;
      if (finalSp > 0) {
         repo.pointsAwarded = true;
      } else {
         repo.pointsAwarded = false;
      }

      if (aiStatus) repo.reviewStatus = aiStatus;
      if (aiFeedback !== undefined) repo.feedback = aiFeedback;
      
      internship.synergyPoints = (internship.synergyPoints || 0) + difference;
      if (!internship.pointsHistory) internship.pointsHistory = [];
      internship.pointsHistory.push({
        reason: `Admin SP Override for Summer/Winter Project: ${reason || 'Manual adjustment'}`,
        pointsAdded: difference,
        date: repo.submittedAt || new Date()
      });
      await user.save();
    }
    
    res.json({ message: 'SP updated successfully' });
  } catch (error) {
    console.error('[Admin] Override SP error:', error);
    res.status(500).json({ message: 'Server error updating SP' });
  }
};

const getLeaderboardSetting = async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "showLeaderboard" });
    res.json({ showLeaderboard: setting ? setting.value : false });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const toggleLeaderboardSetting = async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: "showLeaderboard" });
    if (setting) {
      setting.value = !setting.value;
      await setting.save();
    } else {
      setting = await Settings.create({ key: "showLeaderboard", value: true });
    }
    res.json({ message: "Leaderboard setting updated", showLeaderboard: setting.value });
  } catch (error) {
    console.error("[Admin] Error toggling leaderboard setting:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


const evaluatePendingAI = async (req, res) => {
  try {
    let processedCount = 0;
    const MAX_BATCH_SIZE = 1; // Process 1 at a time to avoid Vercel timeout (10s)

    // 1. Process Normal Projects
    const normalSubmissions = await ProjectSubmission.find({});
    for (let sub of normalSubmissions) {
      if (processedCount >= MAX_BATCH_SIZE) break;
      
      const user = await User.findOne({ 'internships.studentId': sub.studentId });
      if (!user) continue;
      
      const internship = user.internships.find(app => app.studentId === sub.studentId);
      if (!internship) continue;

      let subUpdated = false;
      for (let assignment of sub.assignments) {
        if (processedCount >= MAX_BATCH_SIZE) break;
        
        if (assignment.aiStatus === 'Pending' && assignment.github) {
          const NormalTask = require('../models/NormalTask');
          const monthMatch = assignment.projectName.match(/Month (\d+)/i);
          const monthNum = monthMatch ? parseInt(monthMatch[1]) : 1;
          const normalTask = await NormalTask.findOne({ domain: sub.domain, monthNumber: monthNum });

          const evaluation = await evaluateRepoWithAI(assignment.github, assignment.projectName, normalTask ? normalTask.pdfUrl : null);
          assignment.aiStatus = evaluation.aiStatus;
          assignment.aiFeedback = evaluation.aiFeedback;

          if (evaluation.aiStatus === 'Accepted') {
            const baseSP = 20;
            const qualitySP = Math.min(20, Math.floor((evaluation.codeQualityScore || 0) * 2));
            const complexitySP = Math.min(10, Math.floor((evaluation.complexityScore || 0) * 1));
            const awardedSP = baseSP + qualitySP + complexitySP;

            assignment.spAwarded = awardedSP;
            internship.synergyPoints = (internship.synergyPoints || 0) + awardedSP;
            
            if (!internship.pointsHistory) internship.pointsHistory = [];
            internship.pointsHistory.push({
              reason: `AI Verified Project (Batch): ${assignment.projectName}`,
              pointsAdded: awardedSP,
              date: assignment.submittedAt || new Date()
            });
          }
          assignment.emailSent = false;
          subUpdated = true;
          processedCount++;
        }
      }
      if (subUpdated) {
        await sub.save();
        await user.save();
      }
    }

    // 2. Process Summer Projects
    if (processedCount < MAX_BATCH_SIZE) {
      const users = await User.find({ 'internships.assignedRepos': { $exists: true, $not: {$size: 0} } });
      for (let user of users) {
        if (processedCount >= MAX_BATCH_SIZE) break;
        let userUpdated = false;
        
        for (let internship of user.internships) {
          if (processedCount >= MAX_BATCH_SIZE) break;
          
          if (internship.assignedRepos && internship.assignedRepos.length > 0) {
            for (let repo of internship.assignedRepos) {
              if (processedCount >= MAX_BATCH_SIZE) break;
              
              if (repo.reviewStatus === 'Pending' && repo.repoLink && repo.isFinalSubmitted) {
                const project = await SummerProject.findById(repo.projectId);
                const projectName = project ? project.name : 'Summer Project';
                const evaluation = await evaluateRepoWithAI(repo.repoLink, projectName, project ? project.pdfUrl : null);
                
                repo.reviewStatus = evaluation.aiStatus;
                repo.feedback = evaluation.aiFeedback;
                
                if (evaluation.aiStatus === 'Accepted' && !repo.pointsAwarded) {
                  const baseSP = 20;
                  const qualitySP = Math.min(20, Math.floor((evaluation.codeQualityScore || 0) * 2));
                  const complexitySP = Math.min(10, Math.floor((evaluation.complexityScore || 0) * 1));
                  const awardedSP = baseSP + qualitySP + complexitySP;

                  repo.pointsAwarded = true;
                  repo.spAwarded = awardedSP;
                  internship.synergyPoints = (internship.synergyPoints || 0) + awardedSP;
                  if (!internship.pointsHistory) internship.pointsHistory = [];
                  internship.pointsHistory.push({
                    reason: `AI Verified Summer Project (Batch): ${projectName}`,
                    pointsAdded: awardedSP,
                    date: repo.submittedAt || (project ? project.dueDate : new Date())
                  });
                }
                repo.emailSent = false;
                userUpdated = true;
                processedCount++;
              }
            }
          }
        }
        if (userUpdated) {
          await user.save();
        }
      }
    }

    res.json({ message: `Successfully evaluated ${processedCount} pending projects.`, processedCount });
  } catch (error) {
    console.error('[Backend] evaluatePendingAI error:', error);
    res.status(500).json({ message: 'Server error during batch AI evaluation' });
  }
};

const getRecentPayments = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const users = await User.find({
      'internships.hasPaid': true
    });

    let recentPayments = [];

    for (const user of users) {
      for (const internship of user.internships) {
        if (internship.hasPaid && internship.razorpayPaymentId) {
          let pDate = internship.paymentDate;
          
          if (!pDate) {
             // If paymentDate is missing, it was paid before this feature was added (>7 days ago)
             continue; 
          }

          if (pDate >= sevenDaysAgo) {
            recentPayments.push({
              _id: user._id,
              name: user.name,
              email: user.email,
              studentId: internship.studentId,
              paymentAmount: internship.paymentAmount || 0,
              paymentDate: pDate,
              internshipType: internship.internshipType,
              domain: internship.domain,
              razorpayPaymentId: internship.razorpayPaymentId
            });
          }
        }
      }
    }

    // Sort descending by date
    recentPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    res.json(recentPayments);
  } catch (error) {
    console.error('[Backend] getRecentPayments error:', error);
    res.status(500).json({ message: 'Server error fetching recent payments' });
  }
};

const migrateDates = async (req, res) => {
  try {
    const users = await User.find({});
    let updatedUsers = 0;

    for (let user of users) {
      let userModified = false;
      for (let internship of user.internships) {
        if (!internship.pointsHistory || internship.pointsHistory.length === 0) continue;

        const submission = await ProjectSubmission.findOne({ studentId: internship.studentId });

        for (let history of internship.pointsHistory) {
          let matchedDate = null;

          if (history.reason.includes('Summer Project') || history.reason.includes('Winter Project') || history.reason.includes('Summer/Winter Project')) {
            for (let repo of (internship.assignedRepos || [])) {
              const project = await SummerProject.findById(repo.projectId);
              if (project && history.reason.includes(project.name)) {
                matchedDate = repo.submittedAt || project.dueDate;
                break;
              }
            }
            if (!matchedDate && internship.assignedRepos && internship.assignedRepos.length > 0) {
               const firstRepo = internship.assignedRepos[0];
               const project = await SummerProject.findById(firstRepo.projectId);
               matchedDate = firstRepo.submittedAt || (project ? project.dueDate : new Date('2024-06-01'));
            }
          } 
          else if (history.reason.includes('Project Accepted') || history.reason.includes('AI Verified Project') || history.reason.includes('AI Re-verified Project') || history.reason.includes('Admin SP Override')) {
             if (submission && submission.assignments && submission.assignments.length > 0) {
                for (let assignment of submission.assignments) {
                  if (history.reason.includes(assignment.projectName)) {
                    matchedDate = assignment.submittedAt;
                    break;
                  }
                }
                if (!matchedDate) {
                  matchedDate = submission.assignments[0].submittedAt;
                }
             }
          }

          if (matchedDate) {
            history.date = matchedDate;
            userModified = true;
          } else {
             history.date = new Date('2024-06-15');
             userModified = true;
          }
        }
      }
      
      if (userModified) {
        await user.save();
        updatedUsers++;
      }
    }

    res.json({ message: `Successfully updated pointsHistory dates for ${updatedUsers} users.` });
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ message: 'Migration failed' });
  }
};

const sendEvaluationEmails = async (req, res) => {
  try {
    let emailsSent = 0;
    
    // 1. Process Normal Projects
    const normalSubmissions = await ProjectSubmission.find({});
    for (let sub of normalSubmissions) {
      let subUpdated = false;
      for (let assignment of sub.assignments) {
        if (assignment.aiStatus !== 'Pending' && assignment.emailSent === false) {
          await sendAIEvaluationEmail(
            sub.email, 
            sub.name, 
            assignment.projectName, 
            assignment.aiStatus, 
            assignment.aiFeedback, 
            assignment.spAwarded
          );
          assignment.emailSent = true;
          subUpdated = true;
          emailsSent++;
        }
      }
      if (subUpdated) {
        sub.markModified('assignments');
        await sub.save();
      }
    }

    // 2. Process Summer Projects
    const users = await User.find({ 'internships.assignedRepos': { $exists: true, $not: {$size: 0} } });
    for (let user of users) {
      let userUpdated = false;
      for (let internship of user.internships) {
        if (internship.assignedRepos && internship.assignedRepos.length > 0) {
          for (let repo of internship.assignedRepos) {
            if (repo.reviewStatus !== 'Pending' && repo.emailSent === false) {
              const project = await SummerProject.findById(repo.projectId);
              const projectName = project ? project.name : 'Summer Project';
              const spToEmail = repo.spAwarded > 0 ? repo.spAwarded : (repo.pointsAwarded ? 50 : 0);
              
              await sendAIEvaluationEmail(
                user.email, 
                user.name, 
                projectName, 
                repo.reviewStatus, 
                repo.feedback, 
                spToEmail
              );
              repo.emailSent = true;
              userUpdated = true;
              emailsSent++;
            }
          }
        }
      }
      if (userUpdated) {
        user.markModified('internships');
        await user.save();
      }
    }

    res.json({ message: `Successfully sent ${emailsSent} evaluation emails.` });
  } catch (error) {
    console.error("[Admin] Error sending evaluation emails:", error);
    res.status(500).json({ message: "Server error while sending emails." });
  }
};

const resetAIEvaluations = async (req, res) => {
  try {
    let resetCount = 0;

    // 1. Reset Normal Projects
    const normalSubmissions = await ProjectSubmission.find({});
    for (let sub of normalSubmissions) {
      const user = await User.findOne({ 'internships.studentId': sub.studentId });
      if (!user) continue;
      
      const internship = user.internships.find(app => app.studentId === sub.studentId);
      if (!internship) continue;

      let subUpdated = false;
      let totalSPToDeduct = 0;

      for (let assignment of sub.assignments) {
        if (assignment.aiStatus !== 'Pending') {
          totalSPToDeduct += (assignment.spAwarded || 0);
          assignment.aiStatus = 'Pending';
          assignment.aiFeedback = '';
          assignment.spAwarded = 0;
          assignment.emailSent = false;
          subUpdated = true;
          resetCount++;
        }
      }

      if (subUpdated) {
        await sub.save();
        if (totalSPToDeduct > 0) {
          internship.synergyPoints = Math.max(0, (internship.synergyPoints || 0) - totalSPToDeduct);
          
          // Remove AI Verification history entries
          if (internship.pointsHistory) {
            internship.pointsHistory = internship.pointsHistory.filter(h => !h.reason.includes('AI Verified Project'));
          }
          await user.save();
        }
      }
    }

    // 2. Reset Summer Projects
    const users = await User.find({ 'internships.assignedRepos': { $exists: true, $not: {$size: 0} } });
    for (let user of users) {
      let userUpdated = false;
      for (let internship of user.internships) {
        let totalSPToDeduct = 0;
        if (internship.assignedRepos && internship.assignedRepos.length > 0) {
          for (let repo of internship.assignedRepos) {
            if (repo.reviewStatus !== 'Pending') {
              if (repo.pointsAwarded) {
                totalSPToDeduct += (repo.spAwarded > 0 ? repo.spAwarded : 50);
                repo.pointsAwarded = false;
                repo.spAwarded = 0;
              }
              repo.reviewStatus = 'Pending';
              repo.feedback = '';
              repo.emailSent = false;
              userUpdated = true;
              resetCount++;
            }
          }
        }
        
        if (totalSPToDeduct > 0) {
          internship.synergyPoints = Math.max(0, (internship.synergyPoints || 0) - totalSPToDeduct);
          if (internship.pointsHistory) {
            internship.pointsHistory = internship.pointsHistory.filter(h => !h.reason.includes('AI Verified Summer Project'));
          }
          userUpdated = true;
        }
      }
      if (userUpdated) await user.save();
    }

    res.json({ message: `Successfully reset ${resetCount} AI evaluations.` });
  } catch (error) {
    console.error("[Admin] Error resetting AI evaluations:", error);
    res.status(500).json({ message: "Server error while resetting evaluations." });
  }
};

const importInterns = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const xlsx = require("xlsx");
    const workbook = xlsx.read(req.file.buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, message: "Uploaded file contains no readable data." });
    }

    let importedCount = 0;
    let updatedCount = 0;

    for (const rawRow of data) {
      try {
        // Normalize keys: lowercase and remove special characters/spaces
        const row = {};
        for (const key in rawRow) {
          const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          row[cleanKey] = rawRow[key];
        }

        const email = (row.email || row.candidatesemail || row.studentemail || "").toString().trim().toLowerCase();
        if (!email) continue;

        const name = (row.name || row.studentname || row.candidatename || "").toString().trim() || "Unknown Intern";
        const mobile = (row.mobile || row.mobileno || row.phone || row.phoneno || row.contact || row.contactno || row.whatsapp || row.whatsappno || "N/A").toString().trim() || "N/A";
        const domain = (row.domain || row.internshipdomain || row.stream || "General Internship").toString().trim();
        const duration = (row.duration || row.internshipduration || "1 Month").toString().trim();
        const studentId = (row.studentid || row.id || row.registrationid || `CN${Math.floor(1000 + Math.random() * 9000)}`).toString().trim();

        const parseDate = (val) => {
          if (!val) return undefined;
          if (val instanceof Date && !isNaN(val.getTime())) return val;
          const parsed = new Date(val);
          if (!isNaN(parsed.getTime())) return parsed;
          return undefined;
        };

        const startDate = parseDate(row.startdate || row.joiningdate) || new Date();
        const endDate = parseDate(row.enddate || row.completiondate);

        let user = await User.findOne({ email });
        if (!user) {
          user = new User({
            name,
            email,
            mobile: mobile || "N/A",
            role: "intern",
            roles: ["student"],
            status: "Registered",
            isFirstLogin: true,
            internships: []
          });
        } else {
          if (!user.name || user.name === "Unknown User") user.name = name;
          if ((!user.mobile || user.mobile === "N/A") && mobile && mobile !== "N/A") user.mobile = mobile;
          user.role = "intern";
          if (!user.roles.includes("student")) user.roles.push("student");
          if (!user.internships) user.internships = [];
        }

        // Check if internship in this domain already exists (case-insensitive)
        const existingIdx = user.internships.findIndex(
          i => i.domain && i.domain.toLowerCase().trim() === domain.toLowerCase().trim()
        );

        // Auto-derive batch from startDate (e.g. "August 2026")
        const batchFromDate = startDate
          ? startDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
          : undefined;

        if (existingIdx >= 0) {
          // Update existing internship details
          user.internships[existingIdx].studentId = studentId || user.internships[existingIdx].studentId;
          user.internships[existingIdx].duration = duration || user.internships[existingIdx].duration;
          if (startDate) user.internships[existingIdx].startDate = startDate;
          if (endDate) user.internships[existingIdx].endDate = endDate;
          if (batchFromDate) user.internships[existingIdx].batch = batchFromDate;
          updatedCount++;
        } else {
          // Push new internship record
          user.internships.push({
            studentId,
            name: user.name,
            email: user.email,
            mobile: user.mobile || mobile,
            domain,
            duration,
            internshipType: "Normal Intern",
            appliedAt: new Date(),
            startDate,
            endDate,
            batch: batchFromDate || undefined,
          });
          importedCount++;
        }

        await user.save();
      } catch (rowErr) {
        console.error("[Admin] Error processing row in importInterns:", rowErr);
      }
    }

    const totalProcessed = importedCount + updatedCount;
    res.json({
      success: true,
      message: `Successfully processed ${totalProcessed} intern records (${importedCount} new, ${updatedCount} updated).`
    });
  } catch (error) {
    console.error("[Admin] Error importing interns:", error);
    res.status(500).json({ success: false, message: error.message || "Server error during intern import." });
  }
};

const QuizApplicant = require("../models/QuizApplicant");

const importQuizUsers = async (req, res) => {
  try {
    if (!req.files || !req.files.excelFile) {
      return res.status(400).json({ success: false, message: "Excel file is required" });
    }

    const { quizName, quizDate, sponsorName, sponsorSignatoryName } = req.body;
    if (!quizName) {
      return res.status(400).json({ success: false, message: "Quiz Name is required" });
    }

    const xlsx = require("xlsx");
    const workbook = xlsx.read(req.files['excelFile'][0].buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Handle Image Uploads
    const streamifier = require("streamifier");
    const cloudinary = require("cloudinary").v2;
    
    let sponsorLogoUrl = "";
    if (req.files['sponsorLogo'] && req.files['sponsorLogo'][0]) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "quiz_sponsors" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(req.files['sponsorLogo'][0].buffer).pipe(stream);
      });
      sponsorLogoUrl = await uploadPromise;
    }

    let sponsorSignatureUrl = "";
    if (req.files['sponsorSignature'] && req.files['sponsorSignature'][0]) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "quiz_sponsors" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        streamifier.createReadStream(req.files['sponsorSignature'][0].buffer).pipe(stream);
      });
      sponsorSignatureUrl = await uploadPromise;
    }

    let importedCount = 0;
    const seenEmails = new Set();
    const seenRegistrationIds = new Set();

    for (const rawRow of data) {
      // Normalize keys: lowercase and remove special characters/spaces
      const row = {};
      for (const key in rawRow) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        row[cleanKey] = rawRow[key];
      }

      const email = (row.candidatesemail || row.email || "").toString().trim().toLowerCase();
      const registrationId = (row.registrationid || row.regnid || row.id || "").toString().trim();
      
      if (!email && !registrationId) continue;

      // Skip duplicate entries within the same excel file
      if (email && seenEmails.has(email)) continue;
      if (registrationId && seenRegistrationIds.has(registrationId)) continue;

      if (email) seenEmails.add(email);
      if (registrationId) seenRegistrationIds.add(registrationId);

      const name = (row.candidatesname || row.name || "Unknown User").toString().trim();
      const mobile = (row.candidatesmobile || row.mobile || "").toString().trim();
      const gender = (row.candidatesgender || row.gender || "").toString().trim();
      const location = (row.candidateslocation || row.location || "").toString().trim();
      const userType = (row.usertype || "").toString().trim();
      const domain = (row.domain || "").toString().trim();
      const course = (row.course || row.coursestream || "").toString().trim();
      const specialization = (row.specialization || row.coursespecialization || "").toString().trim();
      const courseDuration = (row.courseduration || "").toString().trim();
      const yearOfGraduation = (row.yearofgraduation || "").toString().trim();
      const organisation = (row.candidatesorganisation || row.organisation || "").toString().trim();
      const courseType = (row.coursetype || "").toString().trim();
      const designation = (row.designation || "").toString().trim();
      const registrationTime = (row.registrationtime || "").toString().trim();
      const differentlyAbled = (row.differentlyabled || "").toString().trim();
      const regStatus = (row.regstatus || row.registrationstatus || "").toString().trim();
      const refCode = (row.refcode || row.referralcode || "").toString().trim();
      const resumeUrl = (row.resume || "").toString().trim();

      // Result and score detection
      const score = (row.score || row.marks || row.obtainedmarks || row.effectivescoreoutof240 || "").toString().trim() || "N/A";
      const totalScore = (row.totalscore || row.maxmarks || row.total || "").toString().trim() || "N/A";
      const result = (row.result || row.rank || row.status || row.qualificationstatus || row.remarks || "").toString().trim() || "N/A";
      const percentage = (row.percentage || row.percentagescore || row.percentile || "").toString().trim() || "N/A";
      const effectiveScore = (row.effectivescore || row.effectivescoreoutof240 || "").toString().trim() || "N/A";
      const totalQuestions = (row.totalnoofquestions || row.totalquestions || row.questions || row.numberofquestionsassigned || "").toString().trim() || "N/A";
      const attemptedQuestions = (row.noofquestionattempted || row.attemptedquestions || row.attempted || row.numberofquestionsattempted || "").toString().trim() || "N/A";

      const currentQuizName = quizName.trim();
      
      const quizItem = {
        quizName: currentQuizName,
        registrationId,
        score,
        totalScore,
        result,
        percentage,
        effectiveScore,
        totalQuestions,
        attemptedQuestions,
        sponsorName: sponsorName ? sponsorName.trim() : "",
        sponsorLogo: sponsorLogoUrl,
        sponsorSignature: sponsorSignatureUrl,
        quizDate: quizDate ? quizDate.trim() : "",
        importedAt: new Date()
      };

      // Check if user with this email or registrationId already exists
      let existingApplicant = null;
      if (email) {
        existingApplicant = await QuizApplicant.findOne({ email });
      }
      if (!existingApplicant && registrationId) {
        existingApplicant = await QuizApplicant.findOne({ registrationId });
      }

      if (existingApplicant) {
        if (name && name !== "Unknown User") existingApplicant.name = name;
        if (mobile) existingApplicant.mobile = mobile;
        if (gender) existingApplicant.gender = gender;
        if (location) existingApplicant.location = location;
        if (userType) existingApplicant.userType = userType;
        if (domain) existingApplicant.domain = domain;
        if (course) existingApplicant.course = course;
        if (specialization) existingApplicant.specialization = specialization;
        if (courseDuration) existingApplicant.courseDuration = courseDuration;
        if (yearOfGraduation) existingApplicant.yearOfGraduation = yearOfGraduation;
        if (organisation) existingApplicant.organisation = organisation;
        if (courseType) existingApplicant.courseType = courseType;
        if (designation) existingApplicant.designation = designation;
        if (registrationTime) existingApplicant.registrationTime = registrationTime;
        if (differentlyAbled) existingApplicant.differentlyAbled = differentlyAbled;
        if (regStatus) existingApplicant.regStatus = regStatus;
        if (refCode) existingApplicant.refCode = refCode;
        if (resumeUrl) existingApplicant.resumeUrl = resumeUrl;

        if (!existingApplicant.quizzes || !Array.isArray(existingApplicant.quizzes)) {
          existingApplicant.quizzes = [];
        }

        // If quizzes array is empty but top level quiz exists, migrate top-level quiz to array
        if (existingApplicant.quizzes.length === 0 && existingApplicant.quizName) {
          existingApplicant.quizzes.push({
            quizName: existingApplicant.quizName,
            registrationId: existingApplicant.registrationId || "",
            score: existingApplicant.score || "N/A",
            totalScore: existingApplicant.totalScore || "N/A",
            result: existingApplicant.result || "N/A",
            percentage: existingApplicant.percentage || "N/A",
            effectiveScore: existingApplicant.effectiveScore || "N/A",
            totalQuestions: existingApplicant.totalQuestions || "N/A",
            attemptedQuestions: existingApplicant.attemptedQuestions || "N/A",
            sponsorName: existingApplicant.sponsorName || "",
            sponsorLogo: existingApplicant.sponsorLogo || "",
            sponsorSignature: existingApplicant.sponsorSignature || "",
            quizDate: existingApplicant.quizDate || "",
            importedAt: existingApplicant.createdAt || new Date()
          });
        }

        const existingQuizIdx = existingApplicant.quizzes.findIndex(
          q => q.quizName.toLowerCase() === currentQuizName.toLowerCase()
        );

        if (existingQuizIdx >= 0) {
          existingApplicant.quizzes[existingQuizIdx].registrationId = registrationId || existingApplicant.quizzes[existingQuizIdx].registrationId;
          if (score !== "N/A") existingApplicant.quizzes[existingQuizIdx].score = score;
          if (totalScore !== "N/A") existingApplicant.quizzes[existingQuizIdx].totalScore = totalScore;
          if (result !== "N/A") existingApplicant.quizzes[existingQuizIdx].result = result;
          if (percentage !== "N/A") existingApplicant.quizzes[existingQuizIdx].percentage = percentage;
          if (effectiveScore !== "N/A") existingApplicant.quizzes[existingQuizIdx].effectiveScore = effectiveScore;
          if (totalQuestions !== "N/A") existingApplicant.quizzes[existingQuizIdx].totalQuestions = totalQuestions;
          if (attemptedQuestions !== "N/A") existingApplicant.quizzes[existingQuizIdx].attemptedQuestions = attemptedQuestions;
          if (sponsorName) existingApplicant.quizzes[existingQuizIdx].sponsorName = sponsorName.trim();
          if (sponsorLogoUrl) existingApplicant.quizzes[existingQuizIdx].sponsorLogo = sponsorLogoUrl;
          if (sponsorSignatureUrl) existingApplicant.quizzes[existingQuizIdx].sponsorSignature = sponsorSignatureUrl;
          if (quizDate) existingApplicant.quizzes[existingQuizIdx].quizDate = quizDate.trim();
        } else {
          existingApplicant.quizzes.push(quizItem);
        }

        existingApplicant.quizName = currentQuizName;
        if (registrationId) existingApplicant.registrationId = registrationId;
        if (score !== "N/A") existingApplicant.score = score;
        if (totalScore !== "N/A") existingApplicant.totalScore = totalScore;
        if (result !== "N/A") existingApplicant.result = result;
        if (percentage !== "N/A") existingApplicant.percentage = percentage;
        if (effectiveScore !== "N/A") existingApplicant.effectiveScore = effectiveScore;
        if (totalQuestions !== "N/A") existingApplicant.totalQuestions = totalQuestions;
        if (attemptedQuestions !== "N/A") existingApplicant.attemptedQuestions = attemptedQuestions;
        if (sponsorName) existingApplicant.sponsorName = sponsorName.trim();
        if (sponsorLogoUrl) existingApplicant.sponsorLogo = sponsorLogoUrl;
        if (sponsorSignatureUrl) existingApplicant.sponsorSignature = sponsorSignatureUrl;
        if (sponsorSignatoryName) existingApplicant.sponsorSignatoryName = sponsorSignatoryName.trim();
        if (quizDate) existingApplicant.quizDate = quizDate.trim();

        await existingApplicant.save();
      } else {
        if (!email) {
          // Require email for new users
          continue;
        }
        const newApplicant = new QuizApplicant({
          quizName: currentQuizName,
          registrationId,
          name: name || "Unknown User",
          email,
          mobile,
          gender,
          location,
          userType,
          domain,
          course,
          specialization,
          courseDuration,
          yearOfGraduation,
          organisation,
          courseType,
          designation,
          registrationTime,
          differentlyAbled,
          regStatus,
          refCode,
          resumeUrl,
          score,
          totalScore,
          result,
          percentage,
          effectiveScore,
          totalQuestions,
          attemptedQuestions,
          sponsorName: sponsorName ? sponsorName.trim() : "",
          sponsorLogo: sponsorLogoUrl,
          sponsorSignature: sponsorSignatureUrl,
          sponsorSignatoryName: sponsorSignatoryName ? sponsorSignatoryName.trim() : "",
          quizDate: quizDate ? quizDate.trim() : "",
          quizzes: [quizItem]
        });

        await newApplicant.save();
      }

      importedCount++;
    }

    if (sponsorName || sponsorLogoUrl || sponsorSignatureUrl || sponsorSignatoryName || quizDate) {
      const updateFields = {};
      if (sponsorName) updateFields['quizzes.$[elem].sponsorName'] = sponsorName.trim();
      if (sponsorLogoUrl) updateFields['quizzes.$[elem].sponsorLogo'] = sponsorLogoUrl;
      if (sponsorSignatureUrl) updateFields['quizzes.$[elem].sponsorSignature'] = sponsorSignatureUrl;
      if (sponsorSignatoryName) updateFields['quizzes.$[elem].sponsorSignatoryName'] = sponsorSignatoryName.trim();
      if (quizDate) updateFields['quizzes.$[elem].quizDate'] = quizDate.trim();

      // Also update top-level fields
      if (sponsorName) updateFields['sponsorName'] = sponsorName.trim();
      if (sponsorLogoUrl) updateFields['sponsorLogo'] = sponsorLogoUrl;
      if (sponsorSignatureUrl) updateFields['sponsorSignature'] = sponsorSignatureUrl;
      if (sponsorSignatoryName) updateFields['sponsorSignatoryName'] = sponsorSignatoryName.trim();
      if (quizDate) updateFields['quizDate'] = quizDate.trim();

      try {
        await QuizApplicant.updateMany(
          { "quizzes.quizName": quizName.trim() },
          { $set: updateFields },
          { arrayFilters: [{ "elem.quizName": quizName.trim() }] }
        );
      } catch (err) {
        console.error("[Admin] Error updating all students with sponsor data:", err);
      }
    }

    res.json({ success: true, message: `Successfully processed and imported ${importedCount} quiz entries.` });
  } catch (error) {
    console.error("[Admin] Error importing quiz users:", error);
    res.status(500).json({ success: false, message: "Server error during quiz user import." });
  }
};

const sendQuizCertificate = async (req, res) => {
  try {
    const { email, name, quizName, result, certificateImage, customMessage } = req.body;
    if (!email || !certificateImage) {
      return res.status(400).json({ success: false, message: "Email and certificate image are required" });
    }

    let base64Data = certificateImage;
    if (certificateImage.includes("base64,")) {
      base64Data = certificateImage.split("base64,")[1];
    }
    
    // Fetch sponsor details for LinkedIn tagging
    const sponsor = await QuizSponsor.findOne({ quizName: quizName.trim() });
    
    const isWinner = result && result.match(/1st|2nd|3rd|winner/i);
    const dashboardLink = "https://codeanova.com/login"; // Replace with your actual dashboard link if different
    
    let linkedinShareHtml = `
      <div style="background-color: #f0f8ff; border-radius: 8px; padding: 15px; margin: 25px 0; border-left: 4px solid #0077b5;">
        <p style="font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 8px;">Share your achievement on LinkedIn! 🚀</p>
        <p style="font-size: 14px; color: #334155; margin-bottom: 12px; margin-top: 0;">
          Don't forget to follow and tag us in your post to get officially featured & reposted!
        </p>
        <ul style="font-size: 14px; color: #334155; padding-left: 20px; margin-bottom: 0;">
          <li style="margin-bottom: 5px;"><a href="https://www.linkedin.com/in/himanshu561hi/" style="color: #0077b5; text-decoration: none; font-weight: bold;">Himanshu Gupta</a></li>
          <li style="margin-bottom: 5px;"><a href="https://www.linkedin.com/in/amangupta9454/" style="color: #0077b5; text-decoration: none; font-weight: bold;">Aman Gupta</a></li>
          <li style="margin-bottom: 5px;"><a href="https://www.linkedin.com/company/code-a-nova/" style="color: #0077b5; text-decoration: none; font-weight: bold;">Code A Nova</a></li>
          ${sponsor && sponsor.sponsorName && sponsor.sponsorLinkedIn ? `<li style="margin-bottom: 5px;"><a href="${sponsor.sponsorLinkedIn}" style="color: #0077b5; text-decoration: none; font-weight: bold;">${sponsor.sponsorName}</a> (Sponsor)</li>` : ""}
        </ul>
      </div>
    `;

    let messageBody = "";
    if (customMessage) {
      let formattedMsg = customMessage.replace(/{{name}}/g, name || "Participant");
      formattedMsg = formattedMsg.replace(/\n/g, "<br>");
      messageBody = `
        <p style="font-size: 16px; line-height: 1.5;">${formattedMsg}</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${dashboardLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Dashboard</a>
        </div>
        <p style="font-size: 16px; line-height: 1.5;">
          Your official certificate is attached to this email. You can download and share it with your network!
        </p>
        ${linkedinShareHtml}
      `;
    } else {
      messageBody = `
        <p style="font-size: 16px; line-height: 1.5;">
          Thank you for participating in the <strong>${quizName || "Assessment"}</strong>. 
          ${isWinner 
            ? `You achieved an outstanding position: <strong>${result}</strong>! We are thrilled to present you with this Certificate of Excellence in recognition of your hard work and dedication.`
            : `We are thrilled to present you with this Certificate of Participation in recognition of your efforts.`
          }
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          Your certificate is now uploaded and available on your dashboard. You can access it anytime using the link below:
        </p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${dashboardLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Dashboard</a>
        </div>
        <p style="font-size: 16px; line-height: 1.5;">
          We have also attached your official certificate to this email for your convenience. You can download and share it with your network!
        </p>
        ${linkedinShareHtml}
      `;
    }

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: ${isWinner ? '#f59e0b' : '#4f46e5'}; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Congratulations!</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px;">Dear <strong>${name || "Participant"}</strong>,</p>
          ${messageBody}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 14px; color: #666; margin: 0;">Best regards,</p>
            <p style="font-size: 14px; color: #333; font-weight: bold; margin: 5px 0 0 0;">Code-A-Nova Team</p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Code-A-Nova" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: email,
      subject: isWinner ? `Congratulations! You secured ${result} in ${quizName}` : `Your Certificate for ${quizName} - Code-A-Nova`,
      html: htmlTemplate,
      attachments: [
        {
          filename: `Certificate_${(name || "Participant").replace(/\s+/g, "_")}.pdf`,
          content: base64Data,
          encoding: "base64",
          contentType: "application/pdf"
        }
      ],
      campaign: "Quiz Certificates",
      source: "Admin Portal",
      recipientName: name
    };

    const sendResult = await mailService.sendEmail(mailOptions);
    if (!sendResult.success) {
      throw new Error(sendResult.error || "Failed to send email via MailService");
    }

    await QuizApplicant.updateOne(
      { email, "quizzes.quizName": quizName },
      { $set: { "quizzes.$.certificateSent": true } }
    );
    res.json({ success: true, message: "Certificate sent successfully" });
  } catch (error) {
    console.error("[Admin] Error sending certificate:", error);
    res.status(500).json({ success: false, message: "Server error sending certificate" });
  }
};

const getQuizApplicants = async (req, res) => {
  try {
    const applicants = await QuizApplicant.find()
      .select('-sponsorLogo -sponsorSignature -quizzes.sponsorLogo -quizzes.sponsorSignature')
      .sort({ _id: -1 });
    res.json({ success: true, applicants });
  } catch (error) {
    console.error("[Admin] Error fetching quiz applicants:", error);
    res.status(500).json({ success: false, message: "Server error fetching quiz applicants" });
  }
};

const deleteQuizApplicant = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await QuizApplicant.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Quiz applicant not found" });
    }
    res.json({ success: true, message: "Quiz applicant deleted successfully" });
  } catch (error) {
    console.error("[Admin] Error deleting quiz applicant:", error);
    res.status(500).json({ success: false, message: "Server error deleting quiz applicant" });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ "internships._id": id });
    if (!user) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    user.internships = user.internships.filter(i => i._id.toString() !== id);
    if (user.internships.length === 0 && user.role === "intern") {
      user.role = "user";
    }

    await user.save();
    res.json({ success: true, message: "Application deleted successfully" });
  } catch (error) {
    console.error("[Admin] Error deleting application:", error);
    res.status(500).json({ success: false, message: "Server error deleting application" });
  }
};

const bulkDeleteApplications = async (req, res) => {
  try {
    const { applicationIds } = req.body;
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ success: false, message: "No application IDs provided" });
    }

    await User.updateMany(
      { "internships._id": { $in: applicationIds } },
      { $pull: { internships: { _id: { $in: applicationIds } } } }
    );

    await User.updateMany(
      { role: "intern", "internships.0": { $exists: false } },
      { $set: { role: "user" } }
    );

    res.json({
      success: true,
      message: `Successfully deleted ${applicationIds.length} application(s).`
    });
  } catch (error) {
    console.error("[Admin] Error bulk deleting applications:", error);
    res.status(500).json({ success: false, message: "Server error during bulk delete" });
  }
};


const getQuizSponsorDetails = async (req, res) => {
  try {
    const { quizName } = req.params;
    
    // First try to find it in the dedicated QuizSponsor collection (new optimized way)
    const sponsor = await QuizSponsor.findOne({ quizName: quizName.trim() });
    
    if (sponsor) {
      return res.json({
        success: true,
        sponsorDetails: {
          sponsorLogo: sponsor.sponsorLogo || "",
          sponsorSignature: sponsor.sponsorSignature || "",
          sponsorLinkedIn: sponsor.sponsorLinkedIn || ""
        }
      });
    }

    // Fallback: Check if it's still in QuizApplicant (legacy way, in case migration missed some)
    const applicant = await QuizApplicant.findOne({ "quizzes.quizName": quizName }, { "quizzes.$": 1, sponsorLogo: 1, sponsorSignature: 1 });
    if (!applicant) {
      return res.json({ success: true, sponsorDetails: { sponsorLogo: "", sponsorSignature: "" } });
    }
    const qz = applicant.quizzes && applicant.quizzes.length > 0 ? applicant.quizzes[0] : applicant;
    res.json({
      success: true,
      sponsorDetails: {
        sponsorLogo: qz.sponsorLogo || applicant.sponsorLogo || "",
        sponsorSignature: qz.sponsorSignature || applicant.sponsorSignature || ""
      }
    });
  } catch (error) {
    console.error("[Admin] Error fetching sponsor details:", error);
    res.status(500).json({ success: false, message: "Server error fetching sponsor details" });
  }
};



const updateQuizSponsor = async (req, res) => {
  try {
    const { quizName, sponsorName, sponsorLogoUrl, sponsorSignatureUrl, sponsorSignatoryName, quizDate, sponsorLinkedIn } = req.body;
    
    if (!quizName) {
      return res.status(400).json({ success: false, message: "Quiz Name is required" });
    }

    // 1. Update QuizSponsor Document (only stores one copy of the huge base64 images per quiz)
    await QuizSponsor.updateOne(
      { quizName: quizName.trim() },
      {
        $set: {
          sponsorName: sponsorName !== undefined ? sponsorName.trim() : "",
          sponsorSignatoryName: sponsorSignatoryName !== undefined ? sponsorSignatoryName.trim() : "",
          quizDate: quizDate !== undefined ? quizDate.trim() : "",
          sponsorLinkedIn: sponsorLinkedIn !== undefined ? sponsorLinkedIn.trim() : "",
          ...(sponsorLogoUrl !== undefined && { sponsorLogo: sponsorLogoUrl }),
          ...(sponsorSignatureUrl !== undefined && { sponsorSignature: sponsorSignatureUrl })
        }
      },
      { upsert: true }
    );

    // 2. Update all QuizApplicants with text fields and UNSET the base64 fields to free up MongoDB space
    const updateFields = {};
    if (sponsorName !== undefined) {
      updateFields['quizzes.$[elem].sponsorName'] = sponsorName.trim();
      updateFields['sponsorName'] = sponsorName.trim();
    }
    if (sponsorSignatoryName !== undefined) {
      updateFields['quizzes.$[elem].sponsorSignatoryName'] = sponsorSignatoryName.trim();
      updateFields['sponsorSignatoryName'] = sponsorSignatoryName.trim();
    }
    if (quizDate !== undefined) {
      updateFields['quizzes.$[elem].quizDate'] = quizDate.trim();
      updateFields['quizDate'] = quizDate.trim();
    }

    const unsetFields = { 
      'quizzes.$[elem].sponsorLogo': "", 
      'quizzes.$[elem].sponsorSignature': "",
      'sponsorLogo': "",
      'sponsorSignature': ""
    };

    const updatePayload = { $unset: unsetFields };
    if (Object.keys(updateFields).length > 0) {
      updatePayload.$set = updateFields;
    }

    const result = await QuizApplicant.updateMany(
      { "quizzes.quizName": quizName.trim() },
      updatePayload,
      { arrayFilters: [{ "elem.quizName": quizName.trim() }] }
    );

    res.json({
      success: true,
      message: `Successfully updated sponsor details for ${result.modifiedCount} applicants.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("[Admin] Error updating quiz sponsor:", error);
    res.status(500).json({ success: false, message: "Server error updating sponsor details" });
  }
};

const sendDeleteQuizOtp = async (req, res) => {
  try {
    const adminEmail = "himanshu561hi@gmail.com";
    const quizName = req.params.quizName;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete existing OTP for this email if any
    await Otp.deleteMany({ phone: adminEmail });

    const otpEntry = new Otp({
      phone: adminEmail,
      otp: otp,
    });
    await otpEntry.save();

    await mailService.sendEmail({
      to: adminEmail,
      subject: `Code-A-Nova: Confirm Quiz Deletion (${quizName})`,
      text: `Hello Admin,

An attempt was made to delete the quiz "${quizName}" and all its participants. 
Your verification OTP is: ${otp}

This OTP is valid for 10 minutes. If you did not request this, please ignore this email.

Best regards,
Code-A-Nova Team`,
      html: `<p>Hello Admin,</p><p>An attempt was made to delete the quiz "<b>${quizName}</b>" and all its participants.</p><p>Your verification OTP is: <b>${otp}</b></p><p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p><p>Best regards,<br/>Code-A-Nova Team</p>`,
      campaign: "Admin Action",
      source: "Quiz Deletion OTP",
      recipientName: "Admin",
    });

    res.json({ success: true, message: `OTP sent successfully to ${adminEmail}` });
  } catch (error) {
    console.error("[Admin] Error sending delete quiz OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP email" });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    const { quizName } = req.params;
    const { otp } = req.body;
    const adminEmail = "himanshu561hi@gmail.com";

    // 1. Verify OTP
    const otpRecord = await Otp.findOne({ phone: adminEmail }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP expired or not found. Please request a new one." });
    }
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
    }

    // 2. Delete Quiz Sponsor
    await QuizSponsor.findOneAndDelete({ quizName: quizName.trim() });

    // 3. Remove quiz from all applicants' quizzes array
    await QuizApplicant.updateMany(
      { "quizzes.quizName": quizName.trim() },
      { $pull: { quizzes: { quizName: quizName.trim() } } }
    );

    // 4. Delete applicants who no longer have any quizzes and whose root quizName matches (legacy cleanup)
    // We safely delete those who have empty quizzes array OR who only ever took this quiz.
    await QuizApplicant.deleteMany({
      quizName: quizName.trim(),
      quizzes: { $size: 0 }
    });

    // Clean up OTP
    await Otp.deleteMany({ phone: adminEmail });

    res.json({ success: true, message: `Successfully deleted quiz '${quizName}' and removed it from all participants.` });
  } catch (error) {
    console.error("[Admin] Error deleting quiz:", error);
    res.status(500).json({ success: false, message: "Server error while deleting quiz" });
  }
};

module.exports = {
  adminLogin,
  getInternships,
  markDownloaded,
  updateInternshipDetails,
  uploadCertificates,
  updateOfferStatus,
  getLeaderboardSetting,
  manualAcceptAssignment,
  importInterns,
  importQuizUsers,
  sendQuizCertificate,
  getQuizApplicants,
  getQuizSponsorDetails,
  deleteQuizApplicant,
  sendDeleteQuizOtp,
  deleteQuiz,
  deleteApplication,
  bulkDeleteApplications,
  toggleLeaderboardSetting,
  getJobPortalSetting,
  toggleJobPortalSetting,
  toggleJobPortalFreeMode,
  updateJobPortalPrice,
  setStartDate,
  updateBatch,
  updateInternshipType,
  updatePaidStatus,
  updateCertificateSent,
  markPaidExported,
  markProjectExported,
  assignNormalTasks,
  getNormalTasks,
  createNormalTask,
  deleteNormalTask,
  getPaymentSetting,
  togglePaymentSetting,
  getRegistrationSetting,
  toggleRegistrationSetting,
  createSummerProject,
  getSummerProjects,
  deleteSummerProject,
  updateAssignedRepo,
  reviewSummerProject,
  getAllSubmissions,
  overrideSP,
  evaluatePendingAI,
  bulkUpdate,
  createNotification,
  getAdminNotifications,
  deleteNotification,
  syncRefunds,
  getRecentPayments,
  sendEvaluationEmails,
  resetAIEvaluations,
  migrateDates,
  updateQuizSponsor,
  makeAllInterns: async (req, res) => {
    try {
      const result = await User.updateMany({}, { $set: { role: 'intern' } });
      res.json({ success: true, message: `Updated ${result.modifiedCount} users to intern role.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
  fixMergedAccounts: async (req, res) => {
    try {
      // Find all users with internships
      const users = await User.find({ "internships.0": { $exists: true } });
      let extractedCount = 0;
      
      for (let user of users) {
        const rootEmail = user.email.toLowerCase();
        
        // Find internships that don't match the root email
        const mismatchedInternships = user.internships.filter(
          app => app.email && app.email.toLowerCase() !== rootEmail
        );
        
        if (mismatchedInternships.length > 0) {
          // Remove them from this user
          user.internships = user.internships.filter(
            app => !app.email || app.email.toLowerCase() === rootEmail
          );
          
          if (user.internships.length === 0) {
            user.role = 'user'; // Demote if they have no internships left
          }
          await user.save();
          
          // Re-insert them into their correct user documents
          for (let app of mismatchedInternships) {
            const correctEmail = app.email.toLowerCase();
            let correctUser = await User.findOne({ email: correctEmail });
            
            if (!correctUser) {
              const bcrypt = require('bcryptjs');
              const hashedPassword = await bcrypt.hash("Welcome@123", 10);
              correctUser = new User({
                name: app.name,
                email: correctEmail,
                mobile: app.mobile || "0000000000",
                password: hashedPassword,
                role: 'intern'
              });
            } else {
              correctUser.role = 'intern';
            }
            
            correctUser.internships.push(app);
            await correctUser.save();
            extractedCount++;
          }
        }
      }
      
      res.json({ success: true, message: `Fixed ${extractedCount} improperly merged internships.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
