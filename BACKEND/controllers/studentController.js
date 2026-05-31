const Settings = require("../models/Settings");
const Waitlist = require("../models/Waitlist");
const User = require("../models/User");
const ProjectSubmission = require("../models/ProjectSubmission");
const SummerProject = require("../models/SummerProject");
const NormalTask = require("../models/NormalTask");
const Notification = require("../models/Notification");

const getInternshipType = (duration) => {
  const months = parseInt(String(duration || "").match(/\d+/)?.[0] || "1", 10);
  return months > 1 ? "Summer/Winter Intern" : "Normal Intern";
};

const getDashboardInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentId = req.user.studentId; // Get studentId from JWT token
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const allSummerProjects = await SummerProject.find({});
    const allNormalTasks = await NormalTask.find({});

    // Filter for only the internship that matches the studentId
    const targetInternship = user.internships.find(
      (app) => app.studentId === studentId,
    );

    if (!targetInternship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    // Fetch submissions for the specific internship
    const submissions = await ProjectSubmission.find({
      studentId: targetInternship.studentId,
    }).sort({ month: 1 });
    const submittedMonths = submissions.length;

    // Parse internship duration (e.g. "2 Months" or "2" -> 2)
    const durationStr = targetInternship.duration || "1 Month";
    const duration = parseInt(durationStr.split(" ")[0], 10) || 1;
    const currentDueMonth = submittedMonths + 1;

    let isBlocked = false;
    let blockReason = "";
    let activeAlert = null;
    let daysElapsed = 0;

    if (targetInternship.startDate && currentDueMonth <= duration) {
      const startDate = new Date(targetInternship.startDate);
      const today = new Date();
      const diffTime = today.getTime() - startDate.getTime();
      daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Compute alert parameters based on next pending month
      let completionDay = 30 * currentDueMonth;
      let yellowStartDay = 30 * currentDueMonth - 2 * currentDueMonth;
      let blockDay =
        currentDueMonth === 1 ? 35 : currentDueMonth === 2 ? 80 : 120;

      // Date objects for UI display
      const completionDate = new Date(
        startDate.getTime() + completionDay * 24 * 60 * 60 * 1000,
      );
      const blockDate = new Date(
        startDate.getTime() + blockDay * 24 * 60 * 60 * 1000,
      );

      const completionDateString = completionDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const blockDateString = blockDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // 1. Block Check is removed. Student is never blocked.
      isBlocked = false;
      blockReason = "";

      // 2. Alert warnings
      if (daysElapsed >= yellowStartDay && daysElapsed < completionDay) {
        activeAlert = {
          type: "yellow",
          message: `Your Month ${currentDueMonth} assignment submission is due on ${completionDateString}. Kindly submit the project at the earliest.`,
        };
      } else if (daysElapsed >= completionDay) {
        activeAlert = {
          type: "red",
          message: `Your assignment submission is delayed! Kindly submit the project as soon as possible to keep your progress updated.`,
        };
      } else if (
        daysElapsed >= completionDay - 10 &&
        daysElapsed < yellowStartDay
      ) {
        activeAlert = {
          type: "green",
          message: `The project submission deadline is nearing. Please submit the project as soon as possible.`,
        };
      }
    }

    const internshipType =
      targetInternship.internshipType ||
      getInternshipType(targetInternship.duration);

    // Populate projects for Summer/Winter Interns
    let projects = [];
    if (internshipType === "Summer/Winter Intern") {
      projects = allSummerProjects
        .filter((p) => p.domain === targetInternship.domain)
        .map((p) => {
          const assignedRepo = targetInternship.assignedRepos?.find(
            (r) => r.projectId.toString() === p._id.toString(),
          );
          return {
            id: p._id,
            name: p.name,
            description: p.description,
            pdfUrl: p.pdfUrl,
            createdAt: p.createdAt,
            dueDate: p.dueDate,
            repoLink: assignedRepo ? assignedRepo.repoLink : null,
            isFinalSubmitted: assignedRepo
              ? assignedRepo.isFinalSubmitted
              : false,
          };
        });
    }

    let assignedNormalTasks = targetInternship.assignedNormalTasks || [];
    if (
      internshipType === "Normal Intern" &&
      (!assignedNormalTasks || assignedNormalTasks.length === 0)
    ) {
      // Fetch default templates for this domain
      const domainTasks = allNormalTasks
        .filter((t) => t.domain === targetInternship.domain)
        .sort((a, b) => a.monthNumber - b.monthNumber);

      if (domainTasks.length > 0) {
        assignedNormalTasks = Array.from({ length: duration }).map((_, idx) => {
          const task = domainTasks.find((t) => t.monthNumber === idx + 1);
          return task ? task.pdfUrl : "";
        });
      }
    }

    const enrichedInternship = {
      ...targetInternship.toObject(),
      internshipType,
      assignedNormalTasks,
      projects,
      isBlocked,
      blockReason,
      activeAlert,
      daysElapsed,
      submissions: submissions.map((sub) => ({
        month: sub.month,
        submittedAt: sub.submittedAt,
        assignmentsCount: sub.assignments ? sub.assignments.length : 0,
      })),
    };

    // Fetch notifications
    const allNotifications = await Notification.find({
      $or: [
        { audience: 'All' },
        { audience: internshipType }
      ]
    }).sort({ createdAt: -1 });

    const activeNotifications = allNotifications.filter(
      (n) => !user.dismissedNotifications.includes(n._id)
    );

    res.json({
      isBlocked,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profileImage: user.profileImage,
        github: user.github,
        linkedin: user.linkedin,
        portfolio: user.portfolio,
      },
      internships: [enrichedInternship],
      notifications: activeNotifications,
    });
  } catch (error) {
    console.error("[Backend] Get dashboard info error:", error);
    res.status(500).json({ message: "Server error retrieving dashboard data" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { github, linkedin, portfolio, profileImage } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (github !== undefined) user.github = github;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (portfolio !== undefined) user.portfolio = portfolio;
    if (profileImage !== undefined) user.profileImage = profileImage; // Assuming frontend handles base64 or cloudinary url upload

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        github: user.github,
        linkedin: user.linkedin,
        portfolio: user.portfolio,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("[Backend] Update profile error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

const markAlertRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentId = req.user.studentId; // Get studentId from JWT
    const { internshipId, alertId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find internship by studentId from JWT (security: ensure user can only access their specific internship)
    const internship = user.internships.find(
      (app) => app.studentId === studentId,
    );
    if (!internship)
      return res.status(404).json({ message: "Internship not found" });

    const alert = internship.alerts.id(alertId);
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    alert.isRead = true;
    await user.save();

    res.json({ message: "Alert marked as read" });
  } catch (error) {
    console.error("[Backend] Mark alert error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const submitProjectRepo = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentId = req.user.studentId; // Get studentId from JWT
    const { projectId, repoLink } = req.body;

    if (!projectId || !repoLink) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find internship by studentId from JWT
    const internship = user.internships.find(
      (app) => app.studentId === studentId,
    );
    if (!internship)
      return res.status(404).json({ message: "Internship not found" });

    if (!internship.assignedRepos) {
      internship.assignedRepos = [];
    }

    const existingRepoIndex = internship.assignedRepos.findIndex(
      (r) => r.projectId.toString() === projectId,
    );

    if (existingRepoIndex > -1) {
      internship.assignedRepos[existingRepoIndex].repoLink = repoLink;
    } else {
      internship.assignedRepos.push({ projectId, repoLink });
    }

    await user.save();
    res.json({
      message: "Repository link submitted successfully",
      assignedRepos: internship.assignedRepos,
    });
  } catch (error) {
    console.error("[Backend] Error submitting repo:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const finalSubmitProjectRepo = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentId = req.user.studentId; // Get studentId from JWT
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find internship by studentId from JWT
    const internship = user.internships.find(
      (app) => app.studentId === studentId,
    );
    if (!internship)
      return res.status(404).json({ message: "Internship not found" });

    const repoIndex = internship.assignedRepos?.findIndex(
      (r) => r.projectId.toString() === projectId,
    );

    if (repoIndex !== undefined && repoIndex > -1) {
      internship.assignedRepos[repoIndex].isFinalSubmitted = true;
    } else {
      return res
        .status(400)
        .json({
          message: "Repository link must be saved before final submission.",
        });
    }

    await user.save();
    res.json({
      message: "Project final submitted successfully",
      assignedRepos: internship.assignedRepos,
    });
  } catch (error) {
    console.error("[Backend] Error final submitting project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const dismissNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.dismissedNotifications.includes(notificationId)) {
      user.dismissedNotifications.push(notificationId);
      await user.save();
    }

    res.json({ message: "Notification dismissed successfully" });
  } catch (error) {
    console.error("[Backend] Dismiss notification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getDashboardInfo,
  updateProfile,
  markAlertRead,
  submitProjectRepo,
  finalSubmitProjectRepo,
  dismissNotification,
};

exports.getRegistrationStatus = async (req, res) => {
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

exports.joinWaitlist = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const existing = await Waitlist.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ error: "You are already on the waitlist!" });
    }

    await Waitlist.create({ name, email });
    res.status(201).json({ message: "Successfully added to waitlist" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
