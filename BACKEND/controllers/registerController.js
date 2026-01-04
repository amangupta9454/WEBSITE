// backend/controllers/registerController.js

const User = require('../models/User');
const Counter = require('../models/Counter');

const registerInternship = async (req, res) => {
  try {
    console.log('[Backend] Public internship application received:', req.body.email || 'No email');

    const currentYear = new Date().getFullYear();
    const counterId = `internship_${currentYear}`;

    // Atomically increment counter
    const counter = await Counter.findByIdAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const serialNumber = String(counter.seq).padStart(3, '0');
    const studentId = `CN/INT/${currentYear}/${serialNumber}`;

    console.log('[Backend] Generated Student ID:', studentId);

    const applicationData = {
      ...req.body,
      studentId,
      appliedAt: new Date()
    };

    // Create a temporary user-like entry or just push to internships array
    // Since no login, we create a minimal user if email doesn't exist
    let user = await User.findOne({ email: req.body.email });

    if (!user) {
      // Create new user without password (since no login)
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        // No password, profileImage, etc.
        internships: []
      });
    }

    user.internships.push(applicationData);
    await user.save();

    console.log('[Backend] Internship saved with Student ID:', studentId);

    res.status(201).json({ 
      message: 'Application submitted successfully',
      studentId 
    });
  } catch (error) {
    console.error('[Backend] Internship registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerInternship };