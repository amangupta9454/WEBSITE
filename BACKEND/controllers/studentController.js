const Settings = require("../models/Settings");
const Waitlist = require("../models/Waitlist");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const ProjectSubmission = require("../models/ProjectSubmission");
const SummerProject = require("../models/SummerProject");
const NormalTask = require("../models/NormalTask");
const Notification = require("../models/Notification");
const QuizApplicant = require("../models/QuizApplicant");
const QuizSponsor = require("../models/QuizSponsor");
const Certificate = require("../models/Certificate");
const { evaluateRepoWithAI, sendAIEvaluationEmail, isFigmaDomain } = require("./projectController");
const { queueWhatsAppMessage } = require('../utils/whatsappClient');

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

    // Default to empty array if no internships exist yet
    const internships = user.internships || [];

    const enrichedInternships = [];

    // Calculate global rank
    const allUsers = await User.find({});
    let allInterns = [];
    allUsers.forEach(u => {
      u.internships.forEach(int => {
        if (int.synergyPoints > 0) {
          allInterns.push({ studentId: int.studentId, sp: int.synergyPoints });
        }
      });
    });
    
    allInterns.sort((a, b) => b.sp - a.sp);

    for (const targetInternship of internships) {
      // Fetch submissions for the specific internship
      const submissions = await ProjectSubmission.find({
        studentId: targetInternship.studentId,
      }).sort({ month: 1 });
      const submittedMonths = submissions.length;

      // Parse internship duration
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

        let completionDay = 30 * currentDueMonth;
        let yellowStartDay = 30 * currentDueMonth - 2 * currentDueMonth;
        let blockDay =
          currentDueMonth === 1 ? 35 : currentDueMonth === 2 ? 80 : 120;

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

        isBlocked = false;
        blockReason = "";

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
              reviewStatus: assignedRepo ? assignedRepo.reviewStatus : 'Pending',
              feedback: assignedRepo ? assignedRepo.feedback : '',
              spAwarded: assignedRepo ? assignedRepo.spAwarded : 0,
            };
          });
      }

      let assignedNormalTasks = targetInternship.assignedNormalTasks || [];
      let fullNormalTasks = [];
      if (internshipType === "Normal Intern") {
        const domainTasks = allNormalTasks
          .filter((t) => t.domain === targetInternship.domain)
          .sort((a, b) => a.monthNumber - b.monthNumber);

        if (domainTasks.length > 0) {
          if (!assignedNormalTasks || assignedNormalTasks.length === 0) {
            assignedNormalTasks = Array.from({ length: duration }).map((_, idx) => {
              const task = domainTasks.find((t) => t.monthNumber === idx + 1);
              return task ? task.pdfUrl : "";
            });
          }
          // Always send the full tasks metadata for the new UI to handle both multi-tasks and single tasks
          fullNormalTasks = Array.from({ length: duration }).map((_, idx) => {
            const task = domainTasks.find((t) => t.monthNumber === idx + 1);
            if (!task) return null;
            return {
               pdfUrl: task.pdfUrl,
               description: task.description,
               tasks: task.tasks || []
            };
          });
        }
      }

      const rankIndex = allInterns.findIndex(i => i.studentId === targetInternship.studentId);
      const globalRank = rankIndex !== -1 ? rankIndex + 1 : null;

      enrichedInternships.push({
        ...targetInternship.toObject(),
        internshipType,
        assignedNormalTasks,
        fullNormalTasks,
        projects,
        isBlocked,
        blockReason,
        activeAlert,
        daysElapsed,
        globalRank,
        submissions: submissions.map((sub) => ({
          id: sub._id,
          month: sub.month,
          submittedAt: sub.submittedAt,
          assignmentsCount: sub.assignments ? sub.assignments.length : 0,
          assignments: sub.assignments
        })),
      });
    }

    // Get unique internship types to fetch relevant notifications
    const userInternshipTypes = [...new Set(enrichedInternships.map(i => i.internshipType))];
    const allNotifications = await Notification.find({
      $or: [
        { audience: 'All' },
        { audience: { $in: userInternshipTypes } }
      ]
    }).sort({ createdAt: -1 });

    const activeNotifications = allNotifications.filter(
      (n) => !user.dismissedNotifications.includes(n._id)
    );

    let verifiedPhone = user.mobile;
    if (verifiedPhone === 'Google Auth') {
      verifiedPhone = '';
      if (user.internships && user.internships.length > 0) {
        for (let i = user.internships.length - 1; i >= 0; i--) {
          const intern = user.internships[i];
          if (intern.whatsapp || intern.mobile) {
            verifiedPhone = intern.whatsapp || intern.mobile;
            break;
          }
        }
      }
    }

    const GraphicResource = require('../models/GraphicResource');
    const graphicResources = await GraphicResource.find({
      $or: [
        { target: 'All' },
        { targetUserId: user._id }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: verifiedPhone,
        profileImage: user.profileImage,
        github: user.github,
        linkedin: user.linkedin,
        portfolio: user.portfolio,
        resumeData: user.resumeData || {},
        roles: typeof user.getUserRoles === 'function' ? user.getUserRoles() : (user.roles || ['student']),
        status: user.status || 'Registered'
      },
      internships: enrichedInternships,
      notifications: activeNotifications,
      graphicResources,
    });
  } catch (error) {
    console.error("[Backend] Get dashboard info error:", error);
    res.status(500).json({ message: "Server error retrieving dashboard data" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, github, linkedin, portfolio, profileImage, mobile, resumeData } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldMobile = user.mobile;

    if (name !== undefined) user.name = name;
    if (github !== undefined) user.github = github;
    let extractedMobile = mobile;

    if (linkedin !== undefined) user.linkedin = linkedin;
    if (portfolio !== undefined) user.portfolio = portfolio;
    if (profileImage !== undefined) user.profileImage = profileImage;
    
    if (resumeData !== undefined) {
      user.resumeData = resumeData;
      // Extract phone from Master Profile if available
      if (resumeData.personalInfo && resumeData.personalInfo.phone) {
        extractedMobile = resumeData.personalInfo.phone;
      }
    }

    if (extractedMobile !== undefined) user.mobile = extractedMobile;

    await user.save();

    if (oldMobile === 'Google Auth' && extractedMobile && extractedMobile !== 'Google Auth') {
      const welcomeText = `👋 *Hi ${user.name || 'there'}!*\n\nWelcome to the *Code-A-Nova Student Dashboard*! 🚀\n\nYour WhatsApp number has been successfully linked. We will send you important updates and notifications right here. 🔔\n\nRegards,\n*Team Code-A-Nova*`;
      queueWhatsAppMessage(extractedMobile, welcomeText);
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        name: user.name,
        github: user.github,
        linkedin: user.linkedin,
        portfolio: user.portfolio,
        profileImage: user.profileImage,
        mobile: user.mobile,
        resumeData: user.resumeData || {}
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

    // Prefer explicit internshipId if passed, then fallback to studentId from JWT
    let internship;
    if (internshipId) {
      internship = user.internships.find(
        (app) => app._id.toString() === internshipId.toString(),
      );
    }
    if (!internship && studentId) {
      internship = user.internships.find(
        (app) => app.studentId === studentId,
      );
    }
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

    // Prefer explicit internshipId sent from frontend first
    let internship;
    if (req.body.internshipId) {
      internship = user.internships.find(
        (app) => app._id.toString() === req.body.internshipId.toString(),
      );
    }
    if (!internship && req.body.studentId) {
      internship = user.internships.find(
        (app) => app.studentId === req.body.studentId,
      );
    }
    if (!internship && studentId) {
      internship = user.internships.find((app) => app.studentId === studentId);
    }
    if (!internship && user.internships && user.internships.length > 0) {
      internship = user.internships[0];
    }

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

    // Prefer explicit internshipId sent from frontend first
    let internship;
    if (req.body.internshipId) {
      internship = user.internships.find(
        (app) => app._id.toString() === req.body.internshipId.toString(),
      );
    }
    if (!internship && req.body.studentId) {
      internship = user.internships.find(
        (app) => app.studentId === req.body.studentId,
      );
    }
    if (!internship && studentId) {
      internship = user.internships.find((app) => app.studentId === studentId);
    }
    if (!internship && user.internships && user.internships.length > 0) {
      internship = user.internships[0];
    }

    if (!internship)
      return res.status(404).json({ message: "Internship not found" });

    const repoIndex = internship.assignedRepos?.findIndex(
      (r) => r.projectId.toString() === projectId,
    );

    if (repoIndex !== undefined && repoIndex > -1) {
      internship.assignedRepos[repoIndex].isFinalSubmitted = true;
      internship.assignedRepos[repoIndex].submittedAt = new Date();
    } else {
      return res
        .status(400)
        .json({
          message: "Repository link must be saved before final submission.",
        });
    }

    const project = await SummerProject.findById(projectId);
    const projectName = project ? project.name : 'Summer Project';
    const evaluation = await evaluateRepoWithAI(internship.assignedRepos[repoIndex].repoLink, projectName, project ? project.pdfUrl : null, internship.domain);
    
    internship.assignedRepos[repoIndex].reviewStatus = evaluation.aiStatus;
    internship.assignedRepos[repoIndex].feedback = evaluation.aiFeedback;
    internship.assignedRepos[repoIndex].emailSent = false;
    
    if (evaluation.aiStatus === 'Accepted' && !internship.assignedRepos[repoIndex].pointsAwarded) {
      internship.assignedRepos[repoIndex].pointsAwarded = true;
      internship.synergyPoints = (internship.synergyPoints || 0) + 50;
      if (!internship.pointsHistory) internship.pointsHistory = [];
      internship.pointsHistory.push({
        reason: `AI Verified Summer Project: ${projectName} (Quality: ${evaluation.codeQualityScore}/10, Complexity: ${evaluation.complexityScore}/10)`,
        pointsAdded: 50,
        date: internship.assignedRepos[repoIndex].submittedAt || (project ? project.dueDate : new Date())
      });
    }

    await user.save();
    res.json({
      message: "Project final submitted and AI evaluated successfully",
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

const getRegistrationStatus = async (req, res) => {
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

const joinWaitlist = async (req, res) => {
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

const getPublicLeaderboard = async (req, res) => {
  try {
    const { timeframe } = req.query; // 'current_month' or 'all'
    const users = await User.find({});
    let leaderboard = [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    users.forEach((user) => {
      user.internships.forEach((internship) => {
        let calculatedPoints = 0;

        if (timeframe === 'current_month') {
          if (internship.pointsHistory && internship.pointsHistory.length > 0) {
            calculatedPoints = internship.pointsHistory.reduce((sum, entry) => {
              const entryDate = new Date(entry.date);
              if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
                return sum + (entry.pointsAdded || 0);
              }
              return sum;
            }, 0);
          }
          calculatedPoints = Math.min(calculatedPoints, internship.synergyPoints || 0);
        } else {
          calculatedPoints = internship.synergyPoints || 0;
        }

        if (calculatedPoints > 0) {
            leaderboard.push({
              name: user.name,
              profileImage: user.profileImage,
              github: user.github,
              linkedin: user.linkedin,
              domain: internship.domain,
              synergyPoints: calculatedPoints,
              studentId: internship.studentId,
              internshipId: internship._id,
              internshipType: internship.internshipType || "Normal Intern"
            });
        }
      });
    });

    leaderboard.sort((a, b) => b.synergyPoints - a.synergyPoints);
    leaderboard = leaderboard.slice(0, 50); // Top 50

    res.json({ leaderboard });
  } catch (error) {
    console.error("[Backend] Get leaderboard error:", error);
    res.status(500).json({ message: "Server error retrieving leaderboard" });
  }
};

const updateProjectLink = async (req, res) => {
  try {
    const { internshipType, projectId, assignmentId, newRepoLink } = req.body;
    const studentId = req.user.studentId;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let targetInternship;
    // 1. Prefer explicit internshipId sent from the frontend
    if (req.body.internshipId) {
      targetInternship = user.internships.find((app) => app._id.toString() === req.body.internshipId.toString());
    }
    // 2. Fall back to studentId stored in JWT
    if (!targetInternship && studentId) {
      targetInternship = user.internships.find((app) => app.studentId === studentId);
    }
    // 3. Last resort: first internship
    if (!targetInternship && user.internships && user.internships.length > 0) {
      targetInternship = user.internships[0];
    }

    if (!targetInternship) {
      return res.status(404).json({ message: 'Active internship not found' });
    }

    const isFigma = isFigmaDomain(targetInternship.domain);
    if (!newRepoLink || (!isFigma && !newRepoLink.startsWith('https://github.com/'))) {
      return res.status(400).json({ 
        message: isFigma ? 'Valid project or design link is required' : 'Valid GitHub repository link is required' 
      });
    }

    let projectName = '';
    let previousSP = 0;

    if (internshipType === 'Summer Intern') {
      const repoIndex = targetInternship.assignedRepos.findIndex(r => r.projectId.toString() === projectId);
      if (repoIndex === -1) return res.status(404).json({ message: 'Project not found' });
      
      const project = await SummerProject.findById(projectId);
      projectName = project ? project.name : 'Summer Project';
      
      targetInternship.assignedRepos[repoIndex].repoLink = newRepoLink;
      const evaluation = await evaluateRepoWithAI(newRepoLink, projectName, project ? project.pdfUrl : null, targetInternship.domain);
      targetInternship.assignedRepos[repoIndex].reviewStatus = evaluation.aiStatus;
      targetInternship.assignedRepos[repoIndex].feedback = evaluation.aiFeedback;

      if (evaluation.aiStatus === 'Accepted') {
        const penalty = targetInternship.assignedRepos[repoIndex].pointsAwarded ? 5 : 0;
        const awardedSP = Math.max(0, 50 - penalty);
        targetInternship.synergyPoints = (targetInternship.synergyPoints || 0) + (awardedSP - (targetInternship.assignedRepos[repoIndex].pointsAwarded ? 50 : 0));
        targetInternship.assignedRepos[repoIndex].pointsAwarded = true;
        targetInternship.assignedRepos[repoIndex].emailSent = false;
        
        if (!targetInternship.pointsHistory) targetInternship.pointsHistory = [];
        targetInternship.pointsHistory.push({
          reason: `AI Re-verified Summer Project: ${projectName} (Penalty: -${penalty} SP)`,
          pointsAdded: awardedSP,
          date: targetInternship.assignedRepos[repoIndex].submittedAt || (project ? project.dueDate : new Date())
        });
      } else {
        targetInternship.assignedRepos[repoIndex].emailSent = false;
      }
      await user.save();

    } else {
      const submission = await ProjectSubmission.findById(projectId);
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      // Verify the submission belongs to this user by matching their email or studentId
      const userEmail = user.email;
      const userStudentIds = user.internships.map(i => i.studentId).filter(Boolean);
      const ownedByUser =
        submission.email === userEmail ||
        (submission.studentId && userStudentIds.includes(submission.studentId)) ||
        (targetInternship && submission.studentId === targetInternship.studentId);

      if (!ownedByUser) {
        return res.status(403).json({ message: 'Submission does not belong to this user' });
      }

      const assignmentIndex = submission.assignments.findIndex(a => a._id.toString() === assignmentId);
      if (assignmentIndex === -1) return res.status(404).json({ message: 'Assignment not found' });

      projectName = submission.assignments[assignmentIndex].projectName;
      previousSP = submission.assignments[assignmentIndex].spAwarded || 0;
      submission.assignments[assignmentIndex].github = newRepoLink;

      const NormalTask = require('../models/NormalTask');
      const monthMatch = projectName.match(/Month (\d+)/i);
      const monthNum = monthMatch ? parseInt(monthMatch[1]) : 1;
      const normalTask = await NormalTask.findOne({ domain: submission.domain, monthNumber: monthNum });

      const evaluation = await evaluateRepoWithAI(newRepoLink, projectName, normalTask ? normalTask.pdfUrl : null, submission.domain || targetInternship.domain);
      submission.assignments[assignmentIndex].aiStatus = evaluation.aiStatus;
      submission.assignments[assignmentIndex].aiFeedback = evaluation.aiFeedback;

      if (evaluation.aiStatus === 'Accepted') {
        const baseSP = 20;
        const qualitySP = Math.min(20, Math.floor((evaluation.codeQualityScore || 0) * 2));
        const complexitySP = Math.min(10, Math.floor((evaluation.complexityScore || 0) * 1));
        let awardedSP = baseSP + qualitySP + complexitySP;
        
        awardedSP = Math.max(0, awardedSP - 5);
        submission.assignments[assignmentIndex].spAwarded = awardedSP;
        targetInternship.synergyPoints = (targetInternship.synergyPoints || 0) - previousSP + awardedSP;
        submission.assignments[assignmentIndex].emailSent = false;
        
        if (!targetInternship.pointsHistory) targetInternship.pointsHistory = [];
        targetInternship.pointsHistory.push({
          reason: `AI Re-verified Project: ${projectName} (Penalty: -5 SP for Resubmission)`,
          pointsAdded: awardedSP,
          date: submission.assignments[assignmentIndex].submittedAt || new Date()
        });
      } else {
        submission.assignments[assignmentIndex].spAwarded = 0;
        submission.assignments[assignmentIndex].emailSent = false;
        targetInternship.synergyPoints = (targetInternship.synergyPoints || 0) - previousSP;
      }
      
      await submission.save();
      await user.save();
    }
    res.json({ message: 'Project link updated and AI evaluated successfully.' });
  } catch (error) {
    console.error("[Backend] Update project link error:", error);
    res.status(500).json({ message: "Server error during project update" });
  }
};

const getMyCertificates = async (req, res) => {
  try {
    let userEmail = req.user?.email || "";
    let userName = req.user?.name || "";
    let studentId = req.user?.studentId || "";
    const userId = req.user?.unifiedUserId || req.user?.id || req.user?.userId || "";

    if (!userEmail || !userName) {
      if (userId) {
        const User = require('../models/User'); // Ensure User model is required
        const dbUser = await User.findById(userId).lean();
        if (dbUser) {
          userEmail = userEmail || dbUser.email || "";
          userName = userName || dbUser.name || "";
          if (!studentId && dbUser.internships && dbUser.internships.length > 0) {
             studentId = dbUser.internships[0].studentId || "";
          }
        }
      }
    }

    let certificates = [];

    // 1. Fetch Quiz Certificates for this user
    let userApplicants = [];
    if (userEmail || userName) {
      const queryArr = [];
      if (userEmail) {
        queryArr.push({ email: new RegExp(`^${userEmail.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") });
      }
      if (userName) {
        queryArr.push({ name: new RegExp(`^${userName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") });
      }
      userApplicants = await QuizApplicant.find({ $or: queryArr }).lean();
    }

    for (const app of userApplicants) {
      if (app.quizName && !certificates.some(c => c.quizName === app.quizName)) {
        certificates.push({
          id: app.registrationId || String(app._id),
          certificateId: app.registrationId || String(app._id),
          title: app.quizName,
          quizName: app.quizName,
          recipientName: app.name || userName || "Participant",
          email: app.email || userEmail,
          issueDate: app.quizDate || app.createdAt,
          score: app.score || "N/A",
          totalScore: app.totalScore || "N/A",
          result: app.result || "Participant",
          percentage: app.percentage || "N/A",
          effectiveScore: app.effectiveScore || "N/A",
          sponsorName: app.sponsorName || "",
          sponsorLogo: app.sponsorLogo || "",
          sponsorSignature: app.sponsorSignature || "",
          sponsorSignatoryName: app.sponsorSignatoryName || "",
          type: "Quiz Certificate",
          category: "Quiz & Assessment",
          status: "VERIFIED & ISSUED"
        });
      }

      if (Array.isArray(app.quizzes)) {
        for (const q of app.quizzes) {
          if (q.quizName && !certificates.some(c => c.quizName === q.quizName)) {
            certificates.push({
              id: q.registrationId || String(q._id),
              certificateId: q.registrationId || String(q._id),
              title: q.quizName,
              quizName: q.quizName,
              recipientName: app.name || userName || "Participant",
              email: app.email || userEmail,
              issueDate: q.quizDate || q.importedAt || app.createdAt,
              score: q.score || "N/A",
              totalScore: q.totalScore || "N/A",
              result: q.result || "Participant",
              percentage: q.percentage || "N/A",
              effectiveScore: q.effectiveScore || "N/A",
              sponsorName: q.sponsorName || app.sponsorName || "",
              sponsorLogo: q.sponsorLogo || app.sponsorLogo || "",
              sponsorSignature: q.sponsorSignature || app.sponsorSignature || "",
              sponsorSignatoryName: q.sponsorSignatoryName || app.sponsorSignatoryName || "",
              type: "Quiz Certificate",
              category: "Quiz & Assessment",
              status: "VERIFIED & ISSUED"
            });
          }
        }
      }
    }
    // Removed mock data fallback blocks here

    // 2. Fetch Internship/Domain Certificates from Certificate collection
    if (studentId || userName) {
      const query = [];
      if (studentId) query.push({ studentId });
      if (userName) query.push({ studentName: new RegExp(`^${userName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") });
      
      const domainCerts = await Certificate.find({ $or: query }).lean();
      for (const dc of domainCerts) {
        if (!certificates.some(c => c.certificateId === dc.certificateNumber)) {
          certificates.push({
            id: dc.certificateNumber,
            certificateId: dc.certificateNumber,
            title: `${dc.domain} Internship Certificate`,
            quizName: `${dc.domain} Internship`,
            recipientName: dc.studentName,
            issueDate: dc.endDate,
            startDate: dc.startDate,
            endDate: dc.endDate,
            duration: dc.duration,
            type: "Internship Certificate",
            category: "Internship Program",
            status: "VERIFIED & ISSUED"
          });
        }
      }
    }

    // 3. Fetch from AssessmentCertificate
    try {
      const AssessmentCertificate = require('../models/assessment/AssessmentCertificate');
      const assessmentQuery = [];
      if (userId) assessmentQuery.push({ candidateId: String(userId) });
      if (userName) assessmentQuery.push({ candidateName: new RegExp(`^${userName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") });
      
      if (assessmentQuery.length > 0) {
        const assessmentCerts = await AssessmentCertificate.find({ $or: assessmentQuery }).lean();
        for (const ac of assessmentCerts) {
          if (!certificates.some(c => c.certificateId === ac.certificateId)) {
            certificates.push({
              id: ac.certificateId,
              certificateId: ac.certificateId,
              title: ac.assessmentName || "Assessment Certificate",
              quizName: ac.assessmentName || "Assessment",
              recipientName: ac.candidateName || userName || "Participant",
              email: userEmail,
              issueDate: ac.issuedAt || ac.createdAt,
              score: ac.score || "N/A",
              totalScore: ac.maxScore || "N/A",
              result: ac.result || "N/A",
              percentage: ac.percentage ? `${ac.percentage}%` : "N/A",
              effectiveScore: ac.score || "N/A",
              sponsorName: "Code-A-Nova Assessments",
              type: "Assessment Certificate",
              category: ac.category || "Assessment",
              status: "VERIFIED & ISSUED"
            });
          }
        }
      }
    } catch(e) {
      console.log("[Backend] AssessmentCertificate fetch error:", e);
    }

    res.json({ success: true, certificates });
  } catch (error) {
    console.error("[Backend] Error fetching student certificates:", error);
    res.status(500).json({ message: "Server error fetching certificates" });
  }
};

const getMyQuizzes = async (req, res) => {
  try {
    let userEmail = req.user?.email || "";
    let userName = req.user?.name || "";
    const userId = req.user?.unifiedUserId || req.user?.id || req.user?.userId || "";

    if (!userEmail || !userName) {
      if (userId) {
        const User = require('../models/User'); // Ensure User model is required
        const dbUser = await User.findById(userId).lean();
        if (dbUser) {
          userEmail = userEmail || dbUser.email || "";
          userName = userName || dbUser.name || "";
        }
      }
    }

    let pastQuizzes = [];

    // 1. Fetch from QuizApplicant
    let userApplicants = [];
    if (userEmail || userName) {
      const queryArr = [];
      if (userEmail) {
        queryArr.push({ email: new RegExp(`^${userEmail.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") });
      }
      if (userName) {
        queryArr.push({ name: new RegExp(`^${userName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") });
      }
      userApplicants = await QuizApplicant.find({ $or: queryArr }).lean();
    }

    for (const app of userApplicants) {
      if (app.quizName && !pastQuizzes.some(pq => pq.quizName === app.quizName)) {
        pastQuizzes.push({
          id: app.registrationId || String(app._id),
          quizName: app.quizName,
          registrationId: app.registrationId || "",
          quizDate: app.quizDate || app.createdAt,
          score: app.score || "N/A",
          totalScore: app.totalScore || "N/A",
          result: app.result || "Participant",
          percentage: app.percentage || "N/A",
          effectiveScore: app.effectiveScore || "N/A",
          totalQuestions: app.totalQuestions || "N/A",
          attemptedQuestions: app.attemptedQuestions || "N/A",
          sponsorName: app.sponsorName || "",
          sponsorLogo: app.sponsorLogo || "",
          sponsorSignature: app.sponsorSignature || "",
          sponsorSignatoryName: app.sponsorSignatoryName || "",
          name: app.name || userName || "Participant",
          email: app.email || userEmail,
          hasCertificate: true,
          status: "COMPLETED"
        });
      }

      if (Array.isArray(app.quizzes)) {
        for (const q of app.quizzes) {
          if (q.quizName && !pastQuizzes.some(pq => pq.quizName === q.quizName)) {
            pastQuizzes.push({
              id: q.registrationId || String(q._id),
              quizName: q.quizName,
              registrationId: q.registrationId || "",
              quizDate: q.quizDate || q.importedAt || app.createdAt,
              score: q.score || "N/A",
              totalScore: q.totalScore || "N/A",
              result: q.result || "Participant",
              percentage: q.percentage || "N/A",
              effectiveScore: q.effectiveScore || "N/A",
              totalQuestions: q.totalQuestions || "N/A",
              attemptedQuestions: q.attemptedQuestions || "N/A",
              sponsorName: q.sponsorName || app.sponsorName || "",
              sponsorLogo: q.sponsorLogo || app.sponsorLogo || "",
              sponsorSignature: q.sponsorSignature || app.sponsorSignature || "",
              sponsorSignatoryName: q.sponsorSignatoryName || app.sponsorSignatoryName || "",
              name: app.name || userName || "Participant",
              email: app.email || userEmail,
              hasCertificate: true,
              status: "COMPLETED"
            });
          }
        }
      }
    }

    // Removed mock data fallback blocks here


    // 3. Fetch from AssessmentCertificate
    try {
      const AssessmentCertificate = require('../models/assessment/AssessmentCertificate');
      const assessmentQuery = [];
      if (userId) assessmentQuery.push({ candidateId: String(userId) });
      if (userName) assessmentQuery.push({ candidateName: new RegExp(`^${userName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") });
      
      if (assessmentQuery.length > 0) {
        const assessmentCerts = await AssessmentCertificate.find({ $or: assessmentQuery }).lean();
        for (const ac of assessmentCerts) {
          if (!pastQuizzes.some(pq => pq.quizName === ac.assessmentName)) {
            pastQuizzes.push({
              id: ac.certificateId,
              quizName: ac.assessmentName || "Assessment",
              registrationId: ac.certificateId,
              quizDate: ac.issuedAt || ac.createdAt,
              score: ac.score || "N/A",
              totalScore: ac.maxScore || "N/A",
              result: ac.result || "N/A",
              percentage: ac.percentage ? `${ac.percentage}%` : "N/A",
              effectiveScore: ac.score || "N/A",
              sponsorName: "Code-A-Nova Assessments",
              name: ac.candidateName || userName || "Participant",
              email: userEmail,
              hasCertificate: true,
              status: "COMPLETED"
            });
          }
        }
      }
    } catch(e) {
      console.log("[Backend] AssessmentCertificate fetch error:", e);
    }

    const liveQuizzes = [];

    res.json({
      success: true,
      liveQuizzes,
      pastQuizzes
    });
  } catch (error) {
    console.error("[Backend] Error fetching student quizzes:", error);
    res.status(500).json({ message: "Server error fetching quizzes" });
  }
};

const submitGraphicDesign = async (req, res) => {
  try {
    const userId = req.user.id;
    const { link, linkedinCaption, instagramCaption } = req.body;
    let fileUrls = [];

    if (!linkedinCaption || !instagramCaption) {
      return res.status(400).json({ message: "Both LinkedIn and Instagram captions are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find the graphic designer internship
    const internshipIndex = user.internships.findIndex(i => i.domain === 'Graphic Designer' || i.domain === 'Graphic Design');
    if (internshipIndex === -1) {
      return res.status(403).json({ message: "No active Graphic Designer internship found" });
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "graphic_submissions", resource_type: "auto" },
            (error, result) => {
              if (result) {
                resolve(result.secure_url);
              } else {
                reject(error);
              }
            }
          );
          streamifier.createReadStream(file.buffer).pipe(stream);
        });
      });
      fileUrls = await Promise.all(uploadPromises);
    } else if (req.file) {
      // Fallback for older frontend version just in case
      const fileUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "graphic_submissions", resource_type: "auto" },
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
      fileUrls = [fileUrl];
    }

    if (!link && fileUrls.length === 0) {
      return res.status(400).json({ message: "Please provide either a file or a link" });
    }

    user.internships[internshipIndex].graphicSubmissions = user.internships[internshipIndex].graphicSubmissions || [];
    user.internships[internshipIndex].graphicSubmissions.push({
      link: link || "",
      fileUrls: fileUrls,
      linkedinCaption,
      instagramCaption,
      submittedAt: new Date(),
      status: "Pending"
    });

    await user.save();
    res.status(200).json({ message: "Graphic design submitted successfully" });

  } catch (error) {
    console.error("[Backend] Error submitting graphic design:", error);
    res.status(500).json({ message: "Server error submitting graphic design" });
  }
};

const deleteGraphicSubmission = async (req, res) => {
  try {
    const userId = req.user.id;
    const { submissionId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const internshipIndex = user.internships.findIndex(i => i.domain === 'Graphic Designer' || i.domain === 'Graphic Design');
    if (internshipIndex === -1) {
      return res.status(403).json({ message: "No active Graphic Designer internship found" });
    }

    const submissionIndex = user.internships[internshipIndex].graphicSubmissions.findIndex(
      sub => sub._id.toString() === submissionId
    );

    if (submissionIndex === -1) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (user.internships[internshipIndex].graphicSubmissions[submissionIndex].status === 'Reviewed') {
      return res.status(400).json({ message: "Cannot delete a reviewed submission" });
    }

    user.internships[internshipIndex].graphicSubmissions.splice(submissionIndex, 1);
    await user.save();
    
    res.status(200).json({ message: "Submission deleted successfully" });
  } catch (error) {
    console.error("[Backend] Error deleting graphic submission:", error);
    res.status(500).json({ message: "Server error deleting graphic submission" });
  }
};

module.exports = {
  getDashboardInfo,
  updateProfile,
  markAlertRead,
  submitProjectRepo,
  finalSubmitProjectRepo,
  dismissNotification,
  getRegistrationStatus,
  joinWaitlist,
  getPublicLeaderboard,
  updateProjectLink,
  getMyCertificates,
  getMyQuizzes,
  submitGraphicDesign,
  deleteGraphicSubmission
};
