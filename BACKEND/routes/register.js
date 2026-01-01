// backend/routes/register.js  (or wherever your internship route is)

const express = require('express');
const { registerInternship } = require('../controllers/registerController');
const auth = require('../middleware/auth'); // Your JWT middleware

const router = express.Router();

router.post('/register', auth, registerInternship); // Protected route

module.exports = router;