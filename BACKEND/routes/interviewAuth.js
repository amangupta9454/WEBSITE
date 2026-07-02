const express = require('express');
const { googleLogin } = require('../controllers/interviewAuthController');

const router = express.Router();

router.post('/google', googleLogin);

module.exports = router;
