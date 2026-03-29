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
        
        return {
          ...internship.toObject(),
          submissions: submissions.map(sub => ({
            month: sub.month,
            submittedAt: sub.submittedAt,
            assignmentsCount: sub.assignments ? sub.assignments.length : 0
          }))
        };
      })
    );

    res.json({
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

module.exports = {
  getDashboardInfo,
  updateProfile
};
