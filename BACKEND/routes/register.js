// backend/routes/register.js

const express = require('express');
const { registerInternship } = require('../controllers/registerController');
// Removed auth middleware — now fully public

const router = express.Router();

router.post('/', registerInternship); // No authentication needed

module.exports = router;