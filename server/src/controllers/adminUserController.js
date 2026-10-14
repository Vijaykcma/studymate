import { User } from '../models/User.js';
import { StudyGroup } from '../models/StudyGroup.js';
import { StudySession } from '../models/StudySession.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { Message } from '../models/Message.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const getAdminUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = 'all',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { registrationNumber: searchRegex }];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const allowedSortFields = ['name', 'email', 'createdAt', 'role', 'status', 'department'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum) || 1,
          totalUsers: totalCount,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUserDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const [groupsCreated, groupsJoined, sessionsOrganized, materialsUploaded] = await Promise.all([
      StudyGroup.find({ creator: user._id }).select('name subject members visibility createdAt'),
      StudyGroup.find({ 'members.user': user._id }).select('name subject members visibility createdAt'),
      StudySession.find({ organizer: user._id }).select('title date startTime status'),
      StudyMaterial.find({ uploader: user._id }).select('title originalFilename fileType fileSize createdAt'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        activity: {
          groupsCreated,
          groupsJoined,
          sessionsOrganized,
          materialsUploaded,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, reason = '', suspendedUntil = null } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be either "active" or "suspended".',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Safeguard: Prevent admin self-suspension
    if (targetUser._id.toString() === req.user._id.toString() && status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'Self-lockout protection: You cannot suspend your own administrator account.',
      });
    }

    // Safeguard: Prevent suspending the last active administrator
    if (targetUser.role === 'admin' && status === 'suspended') {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        status: 'active',
        _id: { $ne: targetUser._id },
      });

      if (activeAdminCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Operation denied: Cannot suspend the last remaining active platform administrator.',
        });
      }
    }

    const oldStatus = targetUser.status;
    targetUser.status = status;
    targetUser.suspendedReason = status === 'suspended' ? reason.trim() : '';
    targetUser.suspendedUntil = status === 'suspended' && suspendedUntil ? new Date(suspendedUntil) : null;

    await targetUser.save();

    await recordAuditLog({
      actor: req.user,
      action: status === 'suspended' ? 'USER_SUSPEND' : 'USER_REACTIVATE',
      resourceType: 'User',
      resourceId: String(targetUser._id),
      status: 'SUCCESS',
      details: {
        targetUserEmail: targetUser.email,
        oldStatus,
        newStatus: status,
        reason: targetUser.suspendedReason,
        suspendedUntil: targetUser.suspendedUntil,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User account has been successfully ${status === 'suspended' ? 'suspended' : 'reactivated'}.`,
      user: targetUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Role must be either "user" or "admin".',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Safeguard: Prevent admin from demoting themselves
    if (targetUser._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Self-lockout protection: You cannot remove administrator privileges from yourself.',
      });
    }

    // Safeguard: Prevent demoting the last active administrator
    if (targetUser.role === 'admin' && role === 'user') {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        status: 'active',
        _id: { $ne: targetUser._id },
      });

      if (activeAdminCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Operation denied: Cannot demote the last remaining active platform administrator.',
        });
      }
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await recordAuditLog({
      actor: req.user,
      action: 'USER_ROLE_CHANGE',
      resourceType: 'User',
      resourceId: String(targetUser._id),
      status: 'SUCCESS',
      details: {
        targetUserEmail: targetUser.email,
        oldRole,
        newRole: role,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User role has been updated to "${role}".`,
      user: targetUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, department, semester, college, registrationNumber, bio } = req.body;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (name) targetUser.name = name.trim();
    if (department) targetUser.department = department.trim();
    if (semester) targetUser.semester = semester.trim();
    if (college !== undefined) targetUser.college = college.trim();
    if (registrationNumber !== undefined) targetUser.registrationNumber = registrationNumber.trim();
    if (bio !== undefined) targetUser.bio = bio.trim();

    await targetUser.save();

    await recordAuditLog({
      actor: req.user,
      action: 'USER_PROFILE_ADMIN_UPDATE',
      resourceType: 'User',
      resourceId: String(targetUser._id),
      status: 'SUCCESS',
      details: { targetUserEmail: targetUser.email },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'User details updated successfully by administrator.',
      user: targetUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserByAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Safeguard: Prevent deleting self
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Self-lockout protection: You cannot delete your own administrator account.',
      });
    }

    // Safeguard: Prevent deleting the last administrator
    if (targetUser.role === 'admin') {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        _id: { $ne: targetUser._id },
      });

      if (activeAdminCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Operation denied: Cannot delete the last remaining platform administrator.',
        });
      }
    }

    // Cascade cleanups
    await StudyGroup.updateMany(
      { 'members.user': targetUser._id },
      { $pull: { members: { user: targetUser._id } } }
    );
    await StudyGroup.deleteMany({ creator: targetUser._id });
    await StudySession.deleteMany({ organizer: targetUser._id });
    await StudyMaterial.deleteMany({ uploader: targetUser._id });
    await Message.deleteMany({ sender: targetUser._id });
    await User.findByIdAndDelete(targetUser._id);

    await recordAuditLog({
      actor: req.user,
      action: 'USER_DELETE',
      resourceType: 'User',
      resourceId: String(targetUser._id),
      status: 'SUCCESS',
      details: {
        deletedUserEmail: targetUser.email,
        deletedUserName: targetUser.name,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'User account and associated resources have been successfully deleted.',
    });
  } catch (error) {
    next(error);
  }
};
