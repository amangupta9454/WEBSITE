// backend/controllers/verifyController.js

const Certificate = require('../models/Certificate');

const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber, studentId } = req.body;

    if (!certificateNumber || !studentId) {
      return res.status(400).json({ message: 'Certificate Number and Student ID are required' });
    }

    const certificate = await Certificate.findOne({ certificateNumber, studentId });

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json({
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.studentName,
      domain: certificate.domain,
      startDate: certificate.startDate,
      endDate: certificate.endDate,
      duration: certificate.duration,
      studentId: certificate.studentId
    });
  } catch (error) {
    console.error('[Verify] Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { verifyCertificate };