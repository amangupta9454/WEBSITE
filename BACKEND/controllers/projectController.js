// backend/controllers/projectController.js

const User = require('../models/User');
const ProjectSubmission = require('../models/ProjectSubmission');
const Settings = require('../models/Settings');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();
const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const submitProject = async (req, res) => {
  try {
    const { studentId, name, email, mobile, domain, duration, assignments } = req.body;

    // Find the internship by studentId
    const user = await User.findOne({ 'internships.studentId': studentId });
    if (!user) {
      return res.status(404).json({ message: 'Invalid Student ID' });
    }

    const internship = user.internships.find(app => app.studentId === studentId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Validate provided details match registered (basic check)
    if (name !== internship.name || email !== internship.email || domain !== internship.domain) {
      return res.status(400).json({ message: 'Details do not match registered information' });
    }

    const registeredDuration = parseInt(internship.duration.split(' ')[0]); // e.g., '1 Month' -> 1
    if (parseInt(duration) !== registeredDuration) {
      return res.status(400).json({ message: 'Duration does not match registered' });
    }

    // Count previous submissions
    const previousCount = await ProjectSubmission.countDocuments({ studentId });
    if (previousCount >= registeredDuration) {
      return res.status(400).json({ message: 'All monthly submissions completed' });
    }

    const currentMonth = previousCount + 1;
    
    // Check global payment setting
    let isPaymentEnabled = true; // Default to true
    const paymentSetting = await Settings.findOne({ key: 'paymentEnabled' });
    if (paymentSetting) {
      isPaymentEnabled = paymentSetting.value;
    }
    
    const paymentRequired = (currentMonth === registeredDuration && !internship.hasPaid && isPaymentEnabled);

    if (paymentRequired) {
      // Create Razorpay order
      const amount = registeredDuration === 3 ? 99 : 69; // Rs
      const order = await rzp.orders.create({
        amount: amount * 100, // in paise
        currency: 'INR',
        receipt: `proj_${studentId}_${currentMonth}`
      });

      return res.json({
        order,
        key: process.env.RAZORPAY_KEY_ID,
        amount,
        message: 'Payment required for final submission'
      });
    } else {
      // Save submission without payment
      const submission = new ProjectSubmission({
        studentId,
        name,
        email,
        mobile: internship.mobile,
        domain,
        duration: registeredDuration,
        assignments: assignments || [],
        month: currentMonth
      });

      await submission.save();
      return res.json({ message: 'Project submitted successfully' });
    }
  } catch (error) {
    console.error('[Project] Submit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body.response;
    const formData = req.body; // Full form data sent from FE

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Re-validate (similar to submit)
    const { studentId, name, email, mobile, domain, duration, assignments } = formData;
    const user = await User.findOne({ 'internships.studentId': studentId });
    if (!user) {
      return res.status(404).json({ message: 'Invalid Student ID' });
    }

    const internship = user.internships.find(app => app.studentId === studentId);
    if (!internship || internship.hasPaid) {
      return res.status(400).json({ message: 'Payment already processed or invalid' });
    }

    const registeredDuration = parseInt(internship.duration.split(' ')[0]);
    const previousCount = await ProjectSubmission.countDocuments({ studentId });
    const currentMonth = previousCount + 1;

    if (currentMonth !== registeredDuration) {
      return res.status(400).json({ message: 'Not the final submission month' });
    }

    // Save submission
    const submission = new ProjectSubmission({
      studentId,
      name,
      email,
      mobile: internship.mobile,
      domain,
      duration: registeredDuration,
      assignments: assignments || [],
      month: currentMonth
    });

    await submission.save();

    // Update hasPaid
    await User.updateOne(
      { 'internships.studentId': studentId },
      { $set: { 'internships.$.hasPaid': true } }
    );

    res.json({ message: 'Payment verified and project submitted successfully' });
  } catch (error) {
    console.error('[Project] Verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { submitProject, verifyPayment };