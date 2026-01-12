// backend/config/nodemailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,   // ← Use App Password, not normal password
  },
  // Helps avoid some connection issues in serverless (Vercel)
  tls: {
    rejectUnauthorized: false,
  },
});

// Optional: Verify connection once on startup (useful for debugging)
transporter.verify((error, success) => {
  if (error) {
    console.error('[Nodemailer] Transporter verification failed:', error);
  } else {
    console.log('[Nodemailer] Transporter is ready');
  }
});

module.exports = transporter;