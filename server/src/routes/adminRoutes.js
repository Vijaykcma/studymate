import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

import {
  adminLogin,
  adminGetMe,
  adminLogout,
} from '../controllers/adminAuthController.js';

import { getAdminStats } from '../controllers/adminStatsController.js';

import {
  getAdminUsers,
  getAdminUserDetails,
  updateUserStatus,
  updateUserRole,
  updateUserDetails,
  updateUserVerification,
  deleteUserByAdmin,
} from '../controllers/adminUserController.js';

import {
  getAdminGroups,
  getAdminGroupDetails,
  updateGroupStatus,
  deleteGroupByAdmin,
} from '../controllers/adminGroupController.js';

import {
  getAdminSessions,
  updateSessionStatusByAdmin,
  deleteSessionByAdmin,
} from '../controllers/adminSessionController.js';

import {
  getAdminMaterials,
  updateMaterialStatusByAdmin,
  deleteMaterialByAdmin,
  downloadMaterialByAdmin,
} from '../controllers/adminMaterialController.js';

import {
  getReportedMessages,
  moderateMessage,
} from '../controllers/adminMessageController.js';

import {
  getAdminReports,
  getAdminReportDetails,
  assignReportModerator,
  updateReportStatus,
} from '../controllers/adminReportController.js';

import { getAdminAuditLogs } from '../controllers/adminAuditLogController.js';

import {
  getAdminSettings,
  updateAdminSettings,
} from '../controllers/adminSettingsController.js';

import {
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
} from '../controllers/adminProfileController.js';

const router = express.Router();

// Stricter rate limiting specifically for admin login brute-force prevention
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many administrator login attempts. Please wait 15 minutes before trying again.',
  },
});

// Admin Auth Routes
router.post('/auth/login', adminAuthLimiter, adminLogin);
router.get('/auth/me', protect, requireAdmin, adminGetMe);
router.post('/auth/logout', protect, requireAdmin, adminLogout);

// All subsequent routes require active administrator authentication
router.use(protect, requireAdmin);

// Dashboard Statistics
router.get('/stats', getAdminStats);

// User Management
router.get('/users', getAdminUsers);
router.get('/users/:userId', getAdminUserDetails);
router.patch('/users/:userId/status', updateUserStatus);
router.patch('/users/:userId/role', updateUserRole);
router.patch('/users/:userId/verification', updateUserVerification);
router.patch('/users/:userId', updateUserDetails);
router.delete('/users/:userId', deleteUserByAdmin);

// Study Group Management
router.get('/groups', getAdminGroups);
router.get('/groups/:groupId', getAdminGroupDetails);
router.patch('/groups/:groupId/status', updateGroupStatus);
router.delete('/groups/:groupId', deleteGroupByAdmin);

// Study Session Management
router.get('/sessions', getAdminSessions);
router.patch('/sessions/:sessionId/status', updateSessionStatusByAdmin);
router.delete('/sessions/:sessionId', deleteSessionByAdmin);

// Study Material Management
router.get('/materials', getAdminMaterials);
router.patch('/materials/:materialId/status', updateMaterialStatusByAdmin);
router.delete('/materials/:materialId', deleteMaterialByAdmin);
router.get('/materials/:materialId/download', downloadMaterialByAdmin);

// Message & Moderation
router.get('/messages/reported', getReportedMessages);
router.patch('/messages/:messageId/moderate', moderateMessage);

// Reports Management
router.get('/reports', getAdminReports);
router.get('/reports/:reportId', getAdminReportDetails);
router.patch('/reports/:reportId/assign', assignReportModerator);
router.patch('/reports/:reportId/status', updateReportStatus);

// Audit Logs
router.get('/audit-logs', getAdminAuditLogs);

// Platform Settings
router.get('/settings', getAdminSettings);
router.patch('/settings', updateAdminSettings);

// Admin Profile
router.get('/profile', getAdminProfile);
router.patch('/profile', updateAdminProfile);
router.patch('/profile/password', updateAdminPassword);

export default router;
