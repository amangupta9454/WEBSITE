const InternProject = require('../models/InternProject');
const User = require('../models/User');

const getV2Projects = async (req, res) => {
  try {
    const studentId = req.user.id;
    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const allInternProjects = await InternProject.find({ studentId: { $in: user.internships.map(i => i.studentId) } });

    const now = new Date();
    
    const projects = allInternProjects.map(p => {
      let currentStatus = p.status;
      if (currentStatus === 'Available' && new Date(p.visibleFrom) > now) {
        currentStatus = 'Locked'; 
      }
      return {
        ...p.toObject(),
        status: currentStatus,
        isLocked: new Date(p.visibleFrom) > now
      };
    });

    res.json(projects);
  } catch (error) {
    console.error('[StudentV2] Error getting projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const submitV2Project = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { projectId, githubLink, liveLink, files, remarks } = req.body;

    const project = await InternProject.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const user = await User.findById(studentId);
    if (!user || !user.internships.some(i => i.studentId === project.studentId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    project.submission = {
      githubLink,
      liveLink,
      files: files || [],
      remarks
    };
    project.status = 'Under Review';
    project.submittedAt = new Date();
    await project.save();

    res.json({ message: 'Project submitted successfully', project });
  } catch (error) {
    console.error('[StudentV2] Error submitting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getV2Projects,
  submitV2Project
};
