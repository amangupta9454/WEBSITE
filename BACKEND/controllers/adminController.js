const Admin = require("../models/Admin");
const User = require("../models/User");
const Certificate = require("../models/Certificate");
const SummerProject = require("../models/SummerProject");
const NormalTask = require("../models/NormalTask");
const Notification = require("../models/Notification");
const ProjectSubmission = require("../models/ProjectSubmission");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const nodemailer = require("nodemailer");
const { evaluateRepoWithAI } = require("./projectController");

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
      // Don't fail the request if email fails, but log it
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
    await submission.save();

    const user = await User.findOne({ 'internships.studentId': submission.studentId });
    if (user) {
      const internship = user.internships.find(app => app.studentId === submission.studentId);
      if (internship) {
        internship.synergyPoints = (internship.synergyPoints || 0) + 50;
        if (!internship.pointsHistory) internship.pointsHistory = [];
        internship.pointsHistory.push({
          reason: `Admin Manually Accepted Project: ${assignment.projectName}`,
          pointsAdded: 50,
          date: new Date()
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
              spAwarded: repo.pointsAwarded ? 50 : 0, 
              submittedAt: repo.submittedAt || null,
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
            date: new Date()
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
      
      const oldSp = repo.pointsAwarded ? 50 : 0; 
      const difference = finalSp - oldSp;
      
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
        date: new Date()
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
              date: new Date()
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
              
              if (repo.reviewStatus === 'Pending' && repo.repoLink) {
                const project = await SummerProject.findById(repo.projectId);
                const projectName = project ? project.name : 'Summer Project';
                const evaluation = await evaluateRepoWithAI(repo.repoLink, projectName, project ? project.pdfUrl : null);
                
                repo.reviewStatus = evaluation.aiStatus;
                repo.feedback = evaluation.aiFeedback;
                
                if (evaluation.aiStatus === 'Accepted' && !repo.pointsAwarded) {
                  repo.pointsAwarded = true;
                  internship.synergyPoints = (internship.synergyPoints || 0) + 50;
                  if (!internship.pointsHistory) internship.pointsHistory = [];
                  internship.pointsHistory.push({
                    reason: `AI Verified Summer Project (Batch): ${projectName}`,
                    pointsAdded: 50,
                    date: new Date()
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
             // Fallback to ProjectSubmission date for payments made before paymentDate feature
             const submission = await ProjectSubmission.findOne({ studentId: internship.studentId }).sort({ submittedAt: -1 });
             if (submission && submission.submittedAt) {
                pDate = submission.submittedAt;
             } else {
                continue; // Skip if no valid date found
             }
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
      if (subUpdated) await sub.save();
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
              const spToEmail = repo.pointsAwarded ? 50 : 0;
              
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
      if (userUpdated) await user.save();
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
                totalSPToDeduct += 50;
                repo.pointsAwarded = false;
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

module.exports = {
  adminLogin,
  getInternships,
  markDownloaded,
  updateInternshipDetails,
  uploadCertificates,
  updateOfferStatus,
  getLeaderboardSetting,
  manualAcceptAssignment,
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
  resetAIEvaluations
};
