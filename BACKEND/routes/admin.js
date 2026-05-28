
const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { 
  adminLogin, 
  getInternships, 
  markDownloaded, 
  updateInternshipDetails, 
  uploadCertificates, 
  updateOfferStatus, 
  setStartDate,
  updatePaidStatus,
  updateBypassBlock,
  markPaidExported,
  markProjectExported,
  getPaymentSetting,
  togglePaymentSetting
} = require('../controllers/adminController');
const { getRegistrationSetting, toggleRegistrationSetting } = require('../controllers/adminController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/login', adminLogin);
router.get('/internships', auth, getInternships);
router.post('/mark-downloaded', auth, markDownloaded);
router.post('/update-internship', auth, updateInternshipDetails);
router.post('/upload-certificates', auth, upload.single('excelFile'), uploadCertificates);
router.post('/update-offer-status', auth, updateOfferStatus);
router.post('/set-start-date', auth, setStartDate);
router.post('/update-paid-status', auth, updatePaidStatus);
router.post('/update-bypass-block', auth, updateBypassBlock);
router.post('/mark-paid-exported', auth, markPaidExported);
router.post('/mark-project-exported', auth, markProjectExported);
router.get('/settings/payment', auth, getPaymentSetting);
router.post('/settings/payment', auth, togglePaymentSetting);
router.get('/settings/registration', getRegistrationSetting);
router.post('/settings/registration', auth, toggleRegistrationSetting);

module.exports = router;