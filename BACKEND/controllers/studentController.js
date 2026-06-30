const Settings = require("../models/Settings");
const Waitlist = require("../models/Waitlist");
const User = require("../models/User");
const ProjectSubmission = require("../models/ProjectSubmission");
const SummerProject = require("../models/SummerProject");
const NormalTask = require("../models/NormalTask");
const Notification = require("../models/Notification");
const { evaluateRepoWithAI, sendAIEvaluationEmail } = require("./projectController");

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
            reviewStatus: assignedRepo ? assignedRepo.reviewStatus : 'Pending',
            feedback: assignedRepo ? assignedRepo.feedback : '',
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
    const rankIndex = allInterns.findIndex(i => i.studentId === studentId);
    const globalRank = rankIndex !== -1 ? rankIndex + 1 : null;

    const enrichedInternship = {
      ...targetInternship.toObject(),
      internshipType,
      assignedNormalTasks,
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
    const { name, github, linkedin, portfolio, profileImage } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (github !== undefined) user.github = github;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (portfolio !== undefined) user.portfolio = portfolio;
    if (profileImage !== undefined) user.profileImage = profileImage; // Assuming frontend handles base64 or cloudinary url upload

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        name: user.name,
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
      internship.assignedRepos[repoIndex].submittedAt = new Date();
    } else {
      return res
        .status(400)
        .json({
          message: "Repository link must be saved before final submission.",
        });
    }

    await user.save();
    res.json({
      message: "Project final submitted successfully. AI evaluation started.",
      assignedRepos: internship.assignedRepos,
    });
    
    // Background execution (fire and forget)
    setTimeout(async () => {
      try {
        const repo = internship.assignedRepos[repoIndex];
        const project = await SummerProject.findById(repo.projectId);
        const projectName = project ? project.name : 'Summer Project';
        const evaluation = await evaluateRepoWithAI(repo.repoLink, projectName);
        
        // Re-fetch user in background to avoid race conditions
        const bgUser = await User.findById(userId);
        if (!bgUser) return;
        const bgInternship = bgUser.internships.find(app => app.studentId === studentId);
        if (!bgInternship) return;
        const bgRepo = bgInternship.assignedRepos?.find(r => r.projectId.toString() === projectId);
        if (!bgRepo) return;

        bgRepo.reviewStatus = evaluation.aiStatus;
        bgRepo.feedback = evaluation.aiFeedback;
        bgRepo.emailSent = false;
        
        if (evaluation.aiStatus === 'Accepted' && !bgRepo.pointsAwarded) {
          bgRepo.pointsAwarded = true;
          bgInternship.synergyPoints = (bgInternship.synergyPoints || 0) + 50;
          if (!bgInternship.pointsHistory) bgInternship.pointsHistory = [];
          bgInternship.pointsHistory.push({
            reason: `AI Verified Summer Project: ${projectName} (Quality: ${evaluation.codeQualityScore}/10, Complexity: ${evaluation.complexityScore}/10)`,
            pointsAdded: 50,
            date: new Date()
          });
        }
        await bgUser.save();
      } catch (err) {
        console.error("Background AI eval error:", err);
      }
    }, 0);

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
    const users = await User.find({});
    let leaderboard = [];

    users.forEach((user) => {
      user.internships.forEach((internship) => {
        if (internship.synergyPoints > 0) {
          leaderboard.push({
            name: user.name,
            profileImage: user.profileImage,
            domain: internship.domain,
            synergyPoints: internship.synergyPoints,
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
    const user = req.user; // from auth middleware

    if (!newRepoLink || !newRepoLink.startsWith('https://github.com/')) {
      return res.status(400).json({ message: 'Valid GitHub repository link is required' });
    }

    const targetInternship = user.internships.find((app) =>
      app.status === "Approved" && 
      (app.domain.toLowerCase().includes(internshipType.toLowerCase()) || 
       (internshipType === 'Summer Intern' && app.duration.includes('15 Days')))
    );

    if (!targetInternship) {
      return res.status(404).json({ message: 'Active internship not found' });
    }

    let projectName = '';
    let previousSP = 0;

    if (internshipType === 'Summer Intern') {
      const repoIndex = targetInternship.assignedRepos.findIndex(r => r.projectId.toString() === projectId);
      if (repoIndex === -1) return res.status(404).json({ message: 'Project not found' });
      
      const project = await SummerProject.findById(projectId);
      projectName = project ? project.name : 'Summer Project';
      
      targetInternship.assignedRepos[repoIndex].repoLink = newRepoLink;
      targetInternship.assignedRepos[repoIndex].reviewStatus = 'Pending';
      await user.save();

      res.json({ message: 'Project link updated! AI evaluation started in background.' });

      // Fire and forget
      setTimeout(async () => {
        try {
          const evaluation = await evaluateRepoWithAI(newRepoLink, projectName);
          const bgUser = await User.findById(user._id);
          if (!bgUser) return;
          const bgInternship = bgUser.internships.find(app => app.status === "Approved" && (app.domain.toLowerCase().includes(internshipType.toLowerCase()) || (internshipType === 'Summer Intern' && app.duration.includes('15 Days'))));
          if (!bgInternship) return;
          const bgRepoIndex = bgInternship.assignedRepos.findIndex(r => r.projectId.toString() === projectId);
          if (bgRepoIndex === -1) return;

          bgInternship.assignedRepos[bgRepoIndex].reviewStatus = evaluation.aiStatus;
          bgInternship.assignedRepos[bgRepoIndex].feedback = evaluation.aiFeedback;

          if (evaluation.aiStatus === 'Accepted') {
            const penalty = bgInternship.assignedRepos[bgRepoIndex].pointsAwarded ? 5 : 0;
            const awardedSP = Math.max(0, 50 - penalty);
            bgInternship.synergyPoints = (bgInternship.synergyPoints || 0) + (awardedSP - (bgInternship.assignedRepos[bgRepoIndex].pointsAwarded ? 50 : 0));
            bgInternship.assignedRepos[bgRepoIndex].pointsAwarded = true;
            bgInternship.assignedRepos[bgRepoIndex].emailSent = false;
            
            if (!bgInternship.pointsHistory) bgInternship.pointsHistory = [];
            bgInternship.pointsHistory.push({
              reason: `AI Re-verified Summer Project: ${projectName} (Penalty: -${penalty} SP)`,
              pointsAdded: awardedSP,
              date: new Date()
            });
          } else {
            bgInternship.assignedRepos[bgRepoIndex].emailSent = false;
          }
          await bgUser.save();
        } catch (err) {
          console.error("Background AI eval error (Summer Intern update):", err);
        }
      }, 0);

    } else {
      const submission = await ProjectSubmission.findById(projectId);
      if (!submission || submission.studentId !== targetInternship.studentId) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      const assignmentIndex = submission.assignments.findIndex(a => a._id.toString() === assignmentId);
      if (assignmentIndex === -1) return res.status(404).json({ message: 'Assignment not found' });

      projectName = submission.assignments[assignmentIndex].projectName;
      previousSP = submission.assignments[assignmentIndex].spAwarded || 0;
      submission.assignments[assignmentIndex].github = newRepoLink;
      submission.assignments[assignmentIndex].aiStatus = 'Pending';
      await submission.save();

      res.json({ message: 'Project link updated! AI evaluation started in background.' });

      // Fire and forget
      setTimeout(async () => {
        try {
          const evaluation = await evaluateRepoWithAI(newRepoLink, projectName);
          const bgSubmission = await ProjectSubmission.findById(projectId);
          if (!bgSubmission) return;
          const bgUser = await User.findById(user._id);
          if (!bgUser) return;
          const bgInternship = bgUser.internships.find(app => app.status === "Approved" && app.domain.toLowerCase().includes(internshipType.toLowerCase()));
          if (!bgInternship) return;

          bgSubmission.assignments[assignmentIndex].aiStatus = evaluation.aiStatus;
          bgSubmission.assignments[assignmentIndex].aiFeedback = evaluation.aiFeedback;

          if (evaluation.aiStatus === 'Accepted') {
            const baseSP = 20;
            const qualitySP = Math.min(20, Math.floor((evaluation.codeQualityScore || 0) * 2));
            const complexitySP = Math.min(10, Math.floor((evaluation.complexityScore || 0) * 1));
            let awardedSP = baseSP + qualitySP + complexitySP;
            
            awardedSP = Math.max(0, awardedSP - 5);
            bgSubmission.assignments[assignmentIndex].spAwarded = awardedSP;
            bgInternship.synergyPoints = (bgInternship.synergyPoints || 0) - previousSP + awardedSP;
            bgSubmission.assignments[assignmentIndex].emailSent = false;
            
            if (!bgInternship.pointsHistory) bgInternship.pointsHistory = [];
            bgInternship.pointsHistory.push({
              reason: `AI Re-verified Project: ${projectName} (Penalty: -5 SP for Resubmission)`,
              pointsAdded: awardedSP,
              date: new Date()
            });
          } else {
            bgSubmission.assignments[assignmentIndex].spAwarded = 0;
            bgSubmission.assignments[assignmentIndex].emailSent = false;
            bgInternship.synergyPoints = (bgInternship.synergyPoints || 0) - previousSP;
          }
          
          await bgSubmission.save();
          await bgUser.save();
        } catch (err) {
          console.error("Background AI eval error (Normal Intern update):", err);
        }
      }, 0);
    }
  } catch (error) {
    console.error("[Backend] Update project link error:", error);
    res.status(500).json({ message: "Server error during project update" });
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
  updateProjectLink
};
