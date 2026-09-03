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
// backend/routes/project.js

router.get('/current-month/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId || typeof studentId !== 'string' || studentId.trim() === '') {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const user = await User.findOne({ 'internships.studentId': studentId });
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const internship = user.internships.find(app => app.studentId === studentId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found for this student' });
    }

    const submissions = await ProjectSubmission.find({ studentId });
    const maxMonths = parseInt(internship.duration.split(' ')[0]) || 1;

    let hasTwoAssignments = false;
    if (
      (internship.startDate && new Date(internship.startDate) >= new Date('2026-08-05T00:00:00.000Z')) ||
      (internship.assignedNormalTasks && internship.assignedNormalTasks.length > maxMonths)
    ) {
      hasTwoAssignments = true;
    }
    const tasksPerMonth = hasTwoAssignments ? 2 : 1;

    const reqTargetMonth = req.query.targetMonth ? parseInt(req.query.targetMonth, 10) : null;

    let currentMonth = null;
    let canSubmit = false;

    if (reqTargetMonth && reqTargetMonth <= maxMonths) {
      const monthSub = submissions.find(s => s.month === reqTargetMonth);
      const completedTasksInTarget = monthSub ? (monthSub.assignments?.length || 0) : 0;
      if (completedTasksInTarget < tasksPerMonth) {
        currentMonth = reqTargetMonth;
        canSubmit = true;
      }
    }

    if (!canSubmit) {
      for (let m = 1; m <= maxMonths; m++) {
        const sub = submissions.find(s => s.month === m);
        const count = sub ? (sub.assignments?.length || 0) : 0;
        if (count < tasksPerMonth) {
          currentMonth = m;
          canSubmit = true;
          break;
        }
      }
    }

    if (!currentMonth) {
      currentMonth = maxMonths + 1;
    }

    // NEW: Return student basic info too
    res.json({
      currentMonth,
      maxMonths,
      canSubmit,
      hasTwoAssignments,
      needsPayment: (currentMonth === maxMonths) && !internship.hasPaid,
      name: internship.name,
      email: internship.email,
      mobile: internship.mobile,
      domain: internship.domain,
      duration: internship.duration
    });
  } catch (error) {
    console.error('[Current Month] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/submit', submitProject);
router.post('/verify', verifyPayment);

module.exports = router;