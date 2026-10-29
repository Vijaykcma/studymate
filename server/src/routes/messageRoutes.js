import express from 'express';
import {
  getGroupMessages,
  sendGroupMessage,
  getDirectMessages,
  sendDirectMessage,
  getConversations,
  getAvailablePeers,
  reactToMessage,
  editMessage,
  deleteMessage,
  toggleStarMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

// Group discussions (backward compatible with /api/v1/groups/:groupId/messages)
router.get('/:groupId/messages', getGroupMessages);
router.post('/:groupId/messages', sendGroupMessage);

// Personal WhatsApp-style Direct Messaging
router.get('/conversations', getConversations);
router.get('/peers', getAvailablePeers);
router.get('/direct/:userId', getDirectMessages);
router.post('/direct/:userId', sendDirectMessage);

// WhatsApp Message Actions: Reactions, Edit, Delete, Star
router.post('/:messageId/reactions', reactToMessage);
router.put('/:messageId', editMessage);
router.post('/:messageId/delete', deleteMessage);
router.post('/:messageId/star', toggleStarMessage);

export default router;
