// backend/routes/project.js
const express = require('express');
const { submitProject, verifyPayment } = require('../controllers/projectController');
const ProjectSubmission = require('../models/ProjectSubmission');
const User = require('../models/User');

const router = express.Router();

// ── Debug helper ── remove later if you want
router.get('/test', (req, res) => {
  res.json({ message: "Project routes are mounted correctly" });
});

// Get current submission month status
router.get('/current-month/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId || typeof studentId !== 'string' || studentId.trim() === '') {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const submittedCount = await ProjectSubmission.countDocuments({ studentId });

    const user = await User.findOne({ 'internships.studentId': studentId });
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const internship = user.internships.find(app => app.studentId === studentId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found for this student' });
    }

    const maxMonths = parseInt(internship.duration.split(' ')[0]) || 0;
    const currentMonth = submittedCount + 1;

    res.json({
      currentMonth,
      maxMonths,
      canSubmit: currentMonth <= maxMonths,
      needsPayment: (currentMonth === maxMonths) && !internship.hasPaid
    });
  } catch (error) {
    console.error('[Current Month] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/submit', submitProject);
router.post('/verify', verifyPayment);

module.exports = router;