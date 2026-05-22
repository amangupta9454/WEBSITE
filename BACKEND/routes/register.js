// backend/routes/register.js

const express = require('express');
const { 
  registerInternship, 
  createRegistrationOrder, 
  verifyRegistrationPayment 
} = require('../controllers/registerController');

const router = express.Router();

router.post('/', registerInternship); // Legacy route
router.post('/create-order', createRegistrationOrder);
router.post('/verify-payment', verifyRegistrationPayment);

module.exports = router;