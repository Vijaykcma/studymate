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
  uploadMedia,
  votePoll,
  createStatus,
  getStatuses,
  viewStatus,
  togglePinChat,
  toggleMuteChat,
  toggleBlockUser,
  clearChatHistory,
  sendBroadcast,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

// Media & Audio Attachment Upload
router.post('/upload', upload.single('file'), uploadMedia);

// Status Stories (24h Ephemeral)
router.get('/status', getStatuses);
router.post('/status', createStatus);
router.post('/status/:statusId/view', viewStatus);

// Personal WhatsApp-style Direct Messaging & Chat Controls
router.get('/conversations', getConversations);
router.get('/peers', getAvailablePeers);
router.post('/pin-chat', togglePinChat);
router.post('/mute-chat', toggleMuteChat);
router.post('/block/:userId', toggleBlockUser);
router.post('/clear', clearChatHistory);
router.post('/broadcast', sendBroadcast);

router.get('/direct/:userId', getDirectMessages);
router.post('/direct/:userId', sendDirectMessage);

// Group discussions (backward compatible with /api/v1/groups/:groupId/messages)
router.get('/:groupId/messages', getGroupMessages);
router.post('/:groupId/messages', sendGroupMessage);

// WhatsApp Message Actions: Reactions, Edit, Delete, Star, Poll Voting
router.post('/:messageId/reactions', reactToMessage);
router.put('/:messageId', editMessage);
router.post('/:messageId/delete', deleteMessage);
router.post('/:messageId/star', toggleStarMessage);
router.post('/:messageId/poll/vote', votePoll);

export default router;

