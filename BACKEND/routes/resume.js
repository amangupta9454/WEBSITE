const express = require('express');
const { getAllResumes, getResume, createResume, updateResume, recordDownload, duplicateResume, deleteResume } = require('../controllers/resumeController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, getAllResumes);
router.get('/:id', authMiddleware, getResume);
router.post('/create', authMiddleware, createResume);
router.put('/:id', authMiddleware, updateResume);
router.post('/:id/download', authMiddleware, recordDownload);
router.post('/:id/duplicate', authMiddleware, duplicateResume);
router.delete('/:id', authMiddleware, deleteResume);

module.exports = router;
