const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/auth'); // Assuming we have an auth middleware

// Public routes
router.get('/', jobController.getAllJobs);

// Admin route to manually sync, import excel and monitor student interactions
router.post('/sync', jobController.manualSync);
router.post('/import-excel', upload.single('excelFile'), jobController.importJobsFromExcel);
router.get('/admin/interactions', jobController.getAdminInteractions);
router.get('/admin/users', jobController.getAdminUsers);
router.put('/admin/user-plan/:userId', jobController.updateUserPlan);

// Protected routes for students (saved & applied jobs)
router.post('/save/:id', authMiddleware, jobController.saveJob);
router.delete('/save/:id', authMiddleware, jobController.unsaveJob);
router.get('/saved', authMiddleware, jobController.getSavedJobs);
router.post('/apply/:id', authMiddleware, jobController.toggleAppliedJob);
router.get('/applied', authMiddleware, jobController.getAppliedJobs);

// Admin routes for managing jobs
router.post('/create', jobController.createJob);
router.patch('/:id/toggle', jobController.toggleJobStatus);
router.put('/:id', jobController.editJob);
router.delete('/:id', jobController.deleteJob);

// Protected routes for Job Portal Premium membership and tokens
router.get('/user-status', authMiddleware, jobController.getUserStatus);
router.post('/purchase-premium', authMiddleware, jobController.purchasePremium);

// Public route for ID must be at the bottom to avoid matching literal paths like /saved
router.get('/:id', jobController.getJobById);

module.exports = router;
