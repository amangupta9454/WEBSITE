const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const Waitlist = require('../models/Waitlist');

const { 
  registerInternship, 
  createRegistrationOrder, 
  verifyRegistrationPayment 
} = require('../controllers/registerController');

const router = express.Router();

router.post('/', upload.single('resume'), registerInternship); // Legacy route
router.post('/create-order', createRegistrationOrder);
router.post('/verify-payment', verifyRegistrationPayment);

// Waitlist - join when registration is closed
router.post('/waitlist', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    await Waitlist.create({ name, email });
    res.json({ message: 'You have been added to the waitlist! We will notify you when new openings are available.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ message: 'You are already on the waitlist! We will notify you when openings are available.' });
    }
    console.error('[Waitlist] Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;