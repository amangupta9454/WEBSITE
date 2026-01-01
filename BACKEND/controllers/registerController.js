// backend/controllers/registerController.js

const User = require('../models/User');
const Counter = require('../models/Counter');
const jwt = require('jsonwebtoken');

const registerInternship = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    console.log('[Backend] Internship application from user:', userId);

    const currentYear = new Date().getFullYear();
    const counterId = `internship_${currentYear}`;

    // Atomically increment counter
    const counter = await Counter.findByIdAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true } // create if not exists
    );

    const serialNumber = String(counter.seq).padStart(3, '0');
    const studentId = `CN/INT/${currentYear}/${serialNumber}`;

    console.log('[Backend] Generated Student ID:', studentId);

    const applicationData = {
      ...req.body,
      studentId,
      appliedAt: new Date()
    };

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerInternship };