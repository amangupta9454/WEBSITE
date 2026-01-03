// // backend/routes/admin.js

// const express = require('express');
// const { adminLogin, getInternships, markDownloaded } = require('../controllers/adminController');
// const auth = require('../middleware/auth');

// const router = express.Router();

// router.post('/login', adminLogin);
// router.get('/internships', auth, getInternships);
// router.post('/mark-downloaded', auth, markDownloaded);

// module.exports = router;

// backend/routes/admin.js with certificate update route

// const express = require('express');
// const { adminLogin, getInternships, markDownloaded, updateInternshipDetails } = require('../controllers/adminController');
// const auth = require('../middleware/auth');

// const router = express.Router();

// router.post('/login', adminLogin);
// router.get('/internships', auth, getInternships);
// router.post('/mark-downloaded', auth, markDownloaded);
// router.post('/update-internship', auth, updateInternshipDetails);

// module.exports = router;

// with verification route
// backend/routes/admin.js

const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { adminLogin, getInternships, markDownloaded, updateInternshipDetails, uploadCertificates } = require('../controllers/adminController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/login', adminLogin);
router.get('/internships', auth, getInternships);
router.post('/mark-downloaded', auth, markDownloaded);
router.post('/update-internship', auth, updateInternshipDetails);
router.post('/upload-certificates', auth, upload.single('excelFile'), uploadCertificates);

module.exports = router;