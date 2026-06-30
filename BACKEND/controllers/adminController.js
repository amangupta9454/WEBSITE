const Admin = require("../models/Admin");
const User = require("../models/User");
const Certificate = require("../models/Certificate");
const SummerProject = require("../models/SummerProject");
const NormalTask = require("../models/NormalTask");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const multer = require("multer");
const ProjectSubmission = require("../models/ProjectSubmission");
const Settings = require("../models/Settings");
const Razorpay = require("razorpay");
const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
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
      expiresIn: "1h",
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
      await Certificate.insertMany(certificates, { ordered: false });
      res.json({
        message: `${certificates.length} certificates uploaded successfully`,
      });
    } catch (insertError) {
      if (insertError.code === 11000) {
        // This means some (or all) were duplicates, but others were inserted because of ordered: false
        const insertedCount = insertError.insertedDocs
          ? insertError.insertedDocs.length
          : 0;
        res.json({
          message: `Upload completed. Inserted ${insertedCount} new certificates (skipped duplicates).`,
        });
      } else {
        throw insertError;
      }
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

    internship.assignedRepos[repoIndex].reviewStatus = reviewStatus;
    internship.assignedRepos[repoIndex].feedback = feedback;
    
    // Add Synergy Points if Accepted and points not already awarded
    if (reviewStatus === 'Accepted' && !internship.assignedRepos[repoIndex].pointsAwarded) {
      internship.assignedRepos[repoIndex].pointsAwarded = true;
      internship.synergyPoints = (internship.synergyPoints || 0) + 50;
      if (!internship.pointsHistory) internship.pointsHistory = [];
      
      const project = await SummerProject.findById(projectId);
      const projectName = project ? project.name : "Summer Project";

      internship.pointsHistory.push({
        reason: `Project Accepted: ${projectName}`,
        pointsAdded: 50,
        date: new Date()
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
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Project Review Update</h2>
            <p>Hi ${user.name},</p>
            <p>Your submission for <strong>${projectName}</strong> has been reviewed.</p>
            <p><strong>Status:</strong> ${reviewStatus}</p>
            ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
            <p>Keep up the great work!</p>
            <br/>
            <p>Best regards,<br/>CODE-A-NOVA Internships Team</p>
          </div>
        `,
      };
      
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("[Admin] Failed to send email notification for project review:", emailError);
      // Don't fail the request if email fails, but log it
    }

    res.json({ message: "Project review updated successfully" });
  } catch (error) {
    console.error("[Admin] Error reviewing summer project:", error);
    res.status(500).json({ message: "Server error" });
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

module.exports = {
  adminLogin,
  getInternships,
  markDownloaded,
  updateInternshipDetails,
  uploadCertificates,
  updateOfferStatus,
  getLeaderboardSetting,
  toggleLeaderboardSetting,
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
  bulkUpdate,
  createNotification,
  getAdminNotifications,
  deleteNotification,
  syncRefunds,
};
