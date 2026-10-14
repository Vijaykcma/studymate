import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  getUserSettings,
  updateUserSettings,
  deleteAccount,
} from '../controllers/userController.js';
import { getUserGroups } from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  updateProfileSchema,
  updatePasswordSchema,
  updateSettingsSchema,
} from '../validators/authValidator.js';

const router = express.Router();

router.use(protect);

router.get('/me', getUserProfile);
router.patch('/me', validate(updateProfileSchema), updateUserProfile);
router.patch('/me/password', validate(updatePasswordSchema), updatePassword);
router.get('/me/settings', getUserSettings);
router.patch('/me/settings', validate(updateSettingsSchema), updateUserSettings);
router.delete('/me/account', deleteAccount);
router.get('/me/groups', getUserGroups);

export default router;
