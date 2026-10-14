import express from 'express';
import {
  getSessions,
  createSession,
  getSessionById,
  updateSession,
  deleteSession,
} from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createSessionSchema, updateSessionSchema } from '../validators/sessionValidator.js';

const router = express.Router();

router.use(protect);

router.get('/', getSessions);
router.post('/', validate(createSessionSchema), createSession);
router.get('/:sessionId', getSessionById);
router.patch('/:sessionId', validate(updateSessionSchema), updateSession);
router.delete('/:sessionId', deleteSession);

export default router;
