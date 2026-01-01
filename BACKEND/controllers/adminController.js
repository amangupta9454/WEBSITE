// backend/controllers/adminController.js

const Admin = require('../models/Admin');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getInternships = async (req, res) => {
  try {
    const users = await User.find({ 'internships.0': { $exists: true } }); // Users with at least one internship

    const allApplications = [];

    users.forEach(user => {
      user.internships.forEach(app => {
        allApplications.push({
          _id: app._id, // ← MUST include this
          studentId: app.studentId,
          name: app.name,
          email: app.email,
          mobile: app.mobile,
          whatsapp: app.whatsapp,
          course: app.course,
          branch: app.branch,
          year: app.year,
          college: app.college,
          state: app.state,
          domain: app.domain,
          duration: app.duration,
          appliedAt: app.appliedAt,
          downloadedAt: app.downloadedAt,
          // Add other fields
        });
      });
    });

    res.json(allApplications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// backend/controllers/adminController.js

const markDownloaded = async (req, res) => {
  try {
    const { applicationIds } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: 'No application IDs provided' });
    }

    let modifiedCount = 0;

    // Loop through each application ID and update individually
    for (const appId of applicationIds) {
      const result = await User.updateOne(
        { 'internships._id': appId },
        { $set: { 'internships.$.downloadedAt': new Date() } }
      );
      if (result.modifiedCount > 0) {
        modifiedCount++;
      }
    }

    console.log(`[Admin] Successfully marked ${modifiedCount} applications as downloaded`);

    res.json({
      message: 'Marked as downloaded',
      modifiedCount
    });
  } catch (error) {
    console.error('[Admin] Error marking downloaded:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { adminLogin, getInternships, markDownloaded };