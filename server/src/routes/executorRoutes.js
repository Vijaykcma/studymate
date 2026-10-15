import express from 'express';
import { executeCode, shareCodeSnippet } from '../controllers/executorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/run', executeCode);
router.post('/share', shareCodeSnippet);

export default router;
