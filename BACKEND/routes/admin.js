
const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { adminLogin, getInternships, markDownloaded, updateInternshipDetails, uploadCertificates, updateOfferStatus } = require('../controllers/adminController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/login', adminLogin);
router.get('/internships', auth, getInternships);
router.post('/mark-downloaded', auth, markDownloaded);
router.post('/update-internship', auth, updateInternshipDetails);
router.post('/upload-certificates', auth, upload.single('excelFile'), uploadCertificates);
router.post('/update-offer-status', auth, updateOfferStatus);

module.exports = router;