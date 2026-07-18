const User = require("../models/User");
const InternProject = require("../models/InternProject");
const { queueWhatsAppMessage } = require("../utils/whatsappClient");

const assignV2Projects = async (req, res) => {
  try {
    const { applicationId, projects } = req.body;
    if (!applicationId || !Array.isArray(projects)) {
      return res.status(400).json({ message: "Application ID and projects array are required" });
    }

    const user = await User.findOne({ "internships._id": applicationId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const internship = user.internships.id(applicationId);
    if (!internship) return res.status(404).json({ message: "Internship not found" });

    if (!internship.startDate) {
      return res.status(400).json({ message: "Internship start date is required to assign v2 projects" });
    }

    const startDate = new Date(internship.startDate);

    // Create InternProject documents
    const createdProjects = [];
    for (const p of projects) {
      // Calculate visibleFrom
      const visibleFrom = new Date(startDate);
      // Month N Project 1 -> Add N-1 months
      visibleFrom.setMonth(visibleFrom.getMonth() + (p.monthNumber - 1));
      
      // Project 2 -> Add 15 days
      if (p.projectNumber === 2) {
        visibleFrom.setDate(visibleFrom.getDate() + 15);
      }

      const project = new InternProject({
        internId: applicationId,
        studentId: internship.studentId,
        monthNumber: p.monthNumber,
        projectNumber: p.projectNumber,
        title: p.title,
        description: p.description,
        resources: p.resources,
        githubRepo: p.repository,
        visibleFrom: visibleFrom
      });

      await project.save();
      createdProjects.push(project);
    }

    // Send WhatsApp notification for initial assignment
    const whatsappNumber = internship.whatsapp || internship.mobile || user.mobile;
    if (whatsappNumber && String(whatsappNumber).replace(/[^0-9]/g, '').length >= 10) {
      const message = `Hello! 👋\n\nYour v2 projects have been assigned.\n\n` +
        `Please log in to your dashboard to view the details.\n\n` +
        `Best of luck,\nCode-A-Nova Team`;
      
      try {
        await queueWhatsAppMessage(whatsappNumber, message);
      } catch (err) {
        console.error("Failed to send WhatsApp message", err);
      }
    }

    res.json({ message: "Projects assigned successfully", projects: createdProjects });
  } catch (error) {
    console.error("[Admin] Error assigning v2 projects:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { assignV2Projects };
