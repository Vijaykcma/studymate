import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createStudentReport } from '../controllers/adminReportController.js';

const router = express.Router();

// Protected student endpoint for reporting inappropriate content
router.post('/', protect, createStudentReport);

export default router;
