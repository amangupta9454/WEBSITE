const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/auth'); // Assuming we have an auth middleware

// Public routes
router.get('/', jobController.getAllJobs);

// Admin route to manually sync
router.post('/sync', jobController.manualSync); // Ideally add adminMiddleware

// Protected routes for students
router.post('/save/:id', authMiddleware, jobController.saveJob);
router.delete('/save/:id', authMiddleware, jobController.unsaveJob);
router.get('/saved', authMiddleware, jobController.getSavedJobs);

// Admin routes for managing jobs (Ideally these should use an admin middleware)
router.patch('/:id/toggle', jobController.toggleJobStatus);
router.put('/:id', jobController.editJob);
router.delete('/:id', jobController.deleteJob);

// Public route for ID must be at the bottom to avoid matching literal paths like /saved
router.get('/:id', jobController.getJobById);

module.exports = router;
