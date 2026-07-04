const Resume = require('../models/Resume');
const User = require('../models/User');

// GET /api/admin/resume/analytics
exports.getResumeAnalytics = async (req, res) => {
  try {
    const totalResumes = await Resume.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayResumes = await Resume.countDocuments({ createdAt: { $gte: today } });

    // Aggregate downloads
    const resumes = await Resume.find({});
    let totalDownloads = 0;
    let freeDownloads = 0;
    let paidDownloads = 0;

    resumes.forEach(r => {
      totalDownloads += r.downloadsUsed;
      if (r.downloadsUsed <= 3) {
        freeDownloads += r.downloadsUsed;
      } else {
        freeDownloads += 3;
        paidDownloads += (r.downloadsUsed - 3);
      }
    });

    const totalTokensEarned = (totalResumes - (resumes.filter(r => r.isFree).length)) * 10 + (paidDownloads * 2);

    res.json({
      success: true,
      analytics: {
        totalResumes,
        todayResumes,
        totalDownloads,
        freeDownloads,
        paidDownloads,
        totalTokensEarned
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET /api/admin/resume/all
exports.getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, resumes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET /api/admin/resume/user/:userId
exports.getUserResumes = async (req, res) => {
  try {
    const { userId } = req.params;
    const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });
    const user = await User.findById(userId).select('name email interviewCredits tokenHistory');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, resumes, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
