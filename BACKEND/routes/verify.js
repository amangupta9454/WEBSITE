// backend/routes/verify.js

const express = require('express');
const { verifyCertificate } = require('../controllers/verifyController');

const router = express.Router();

router.post('/', verifyCertificate);

module.exports = router;