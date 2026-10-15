import express from 'express';
import {
  getGroups,
  createGroup,
  getGroupById,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getGroupMembers,
  getGroupJoinRequests,
  handleJoinRequest,
} from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createGroupSchema, updateGroupSchema } from '../validators/groupValidator.js';

const router = express.Router();

router.get('/', getGroups);
router.post('/', protect, validate(createGroupSchema), createGroup);
router.get('/:groupId', getGroupById);
router.patch('/:groupId', protect, validate(updateGroupSchema), updateGroup);
router.delete('/:groupId', protect, deleteGroup);
router.post('/:groupId/join', protect, joinGroup);
router.post('/:groupId/leave', protect, leaveGroup);
router.get('/:groupId/members', getGroupMembers);
router.get('/:groupId/requests', protect, getGroupJoinRequests);
router.patch('/:groupId/requests/:userId', protect, handleJoinRequest);

export default router;
