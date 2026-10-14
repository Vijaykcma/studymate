import { User } from '../models/User.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      user: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminProfile = async (req, res, next) => {
  try {
    const { name, bio, department } = req.body;

    const admin = await User.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found.',
      });
    }

    if (name) admin.name = name.trim();
    if (bio !== undefined) admin.bio = bio.trim();
    if (department) admin.department = department.trim();

    await admin.save();

    await recordAuditLog({
      actor: admin,
      action: 'ADMIN_PROFILE_UPDATE',
      resourceType: 'User',
      resourceId: String(admin._id),
      status: 'SUCCESS',
      details: { email: admin.email },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Admin profile updated successfully.',
      user: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    const admin = await User.findById(req.user._id).select('+password');
    const isMatch = await admin.matchPassword(currentPassword);

    if (!isMatch) {
      await recordAuditLog({
        actor: admin,
        action: 'ADMIN_PASSWORD_CHANGE_FAILED',
        resourceType: 'User',
        resourceId: String(admin._id),
        status: 'FAILURE',
        details: { reason: 'Incorrect current password' },
        req,
      });

      return res.status(400).json({
        success: false,
        message: 'Current password verification failed.',
      });
    }

    admin.password = newPassword;
    await admin.save();

    await recordAuditLog({
      actor: admin,
      action: 'ADMIN_PASSWORD_CHANGED',
      resourceType: 'User',
      resourceId: String(admin._id),
      status: 'SUCCESS',
      details: { email: admin.email },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Administrator password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
