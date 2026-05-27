const Settings = require('../models/Settings');
const Waitlist = require('../models/Waitlist');
const User = require('../models/User');
const ProjectSubmission = require('../models/ProjectSubmission');

const getDashboardInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch submissions for all user internships to build the progress tracker
    const enrichedInternships = await Promise.all(
      user.internships.map(async (internship) => {
        const submissions = await ProjectSubmission.find({ studentId: internship.studentId }).sort({ month: 1 });
        const submittedMonths = submissions.length;
        
        // Parse internship duration (e.g. "2 Months" or "2" -> 2)
        const durationStr = internship.duration || '1 Month';
        const duration = parseInt(durationStr.split(' ')[0], 10) || 1;
        const currentDueMonth = submittedMonths + 1;

        let isBlocked = false;
        let blockReason = '';
        let activeAlert = null;
        let daysElapsed = 0;

        if (internship.startDate && currentDueMonth <= duration) {
          const startDate = new Date(internship.startDate);
          const today = new Date();
          const diffTime = today.getTime() - startDate.getTime();
          daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          // Compute alert parameters based on next pending month
          let completionDay = 30 * currentDueMonth;
          let yellowStartDay = 30 * currentDueMonth - (2 * currentDueMonth);
          let blockDay = currentDueMonth === 1 ? 35 : (currentDueMonth === 2 ? 80 : 120);

          // Date objects for UI display
          const completionDate = new Date(startDate.getTime() + completionDay * 24 * 60 * 60 * 1000);
          const blockDate = new Date(startDate.getTime() + blockDay * 24 * 60 * 60 * 1000);
          
          const completionDateString = completionDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          const blockDateString = blockDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

          // 1. Block Check is removed. Student is never blocked.
          isBlocked = false;
          blockReason = '';

          // 2. Alert warnings
          if (daysElapsed >= yellowStartDay && daysElapsed < completionDay) {
            activeAlert = {
              type: 'yellow',
              message: `Your Month ${currentDueMonth} assignment submission is due on ${completionDateString}. Kindly submit the project at the earliest.`
            };
          } else if (daysElapsed >= completionDay) {
            activeAlert = {
              type: 'red',
              message: `Your assignment submission is delayed! Kindly submit the project as soon as possible to keep your progress updated.`
            };
          } else if (daysElapsed >= (completionDay - 10) && daysElapsed < yellowStartDay) {
            activeAlert = {
              type: 'green',
              message: `The project submission deadline is nearing. Please submit the project as soon as possible.`
            };
          }
        }

        return {
          ...internship.toObject(),
          isBlocked,
          blockReason,
          activeAlert,
          daysElapsed,
          submissions: submissions.map(sub => ({
            month: sub.month,
            submittedAt: sub.submittedAt,
            assignmentsCount: sub.assignments ? sub.assignments.length : 0
          }))
        };
      })
    );

    const isBlocked = enrichedInternships.some(i => i.isBlocked);

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
      internships: enrichedInternships
    });

  } catch (error) {
    console.error('[Backend] Get dashboard info error:', error);
    res.status(500).json({ message: 'Server error retrieving dashboard data' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { github, linkedin, portfolio, profileImage } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (github !== undefined) user.github = github;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (portfolio !== undefined) user.portfolio = portfolio;
    if (profileImage !== undefined) user.profileImage = profileImage; // Assuming frontend handles base64 or cloudinary url upload

    await user.save();

    res.json({ message: 'Profile updated successfully', user: {
      github: user.github,
      linkedin: user.linkedin,
      portfolio: user.portfolio,
      profileImage: user.profileImage
    }});

  } catch (error) {
    console.error('[Backend] Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

const markAlertRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { internshipId, alertId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const internship = user.internships.id(internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    const alert = internship.alerts.id(alertId);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    alert.isRead = true;
    await user.save();

    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    console.error('[Backend] Mark alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getDashboardInfo,
  updateProfile,
  markAlertRead
};


exports.getRegistrationStatus = async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: 'registrationEnabled' });
    if (!setting) {
      setting = await Settings.create({ key: 'registrationEnabled', value: true });
    }
    res.json({ registrationEnabled: setting.value });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.joinWaitlist = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existing = await Waitlist.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'You are already on the waitlist!' });
    }

    await Waitlist.create({ name, email });
    res.status(201).json({ message: 'Successfully added to waitlist' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
