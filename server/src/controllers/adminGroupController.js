import { StudyGroup } from '../models/StudyGroup.js';
import { StudySession } from '../models/StudySession.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { Message } from '../models/Message.js';
import { Report } from '../models/Report.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const getAdminGroups = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      visibility = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { subject: searchRegex }, { description: searchRegex }];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (visibility && visibility !== 'all') {
      query.visibility = visibility;
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const allowedSort = ['name', 'subject', 'createdAt', 'status', 'visibility'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';

    const [groups, totalCount] = await Promise.all([
      StudyGroup.find(query)
        .populate('creator', 'name email department')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      StudyGroup.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        groups,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum) || 1,
          totalGroups: totalCount,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminGroupDetails = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await StudyGroup.findById(groupId)
      .populate('creator', 'name email department semester')
      .populate('members.user', 'name email department semester avatar');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found.',
      });
    }

    const [sessions, materials, reports, messageCount] = await Promise.all([
      StudySession.find({ group: group._id }).sort({ date: -1 }).limit(10),
      StudyMaterial.find({ group: group._id }).populate('uploader', 'name email').sort({ createdAt: -1 }).limit(10),
      Report.find({ resourceType: 'StudyGroup', resourceId: group._id }).populate('reporter', 'name email'),
      Message.countDocuments({ group: group._id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        group,
        sessions,
        materials,
        reports,
        messageCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroupStatus = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { status, moderationReason = '' } = req.body;

    const allowedStatuses = ['active', 'hidden', 'archived', 'suspended'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found.',
      });
    }

    const oldStatus = group.status;
    group.status = status;
    group.moderationReason = moderationReason.trim();
    await group.save();

    await recordAuditLog({
      actor: req.user,
      action: `GROUP_${status.toUpperCase()}`,
      resourceType: 'StudyGroup',
      resourceId: String(group._id),
      status: 'SUCCESS',
      details: {
        groupName: group.name,
        oldStatus,
        newStatus: status,
        moderationReason: group.moderationReason,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Group status changed to "${status}".`,
      group,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroupByAdmin = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found.',
      });
    }

    // Cascade cleanups
    await Promise.all([
      StudySession.deleteMany({ group: group._id }),
      StudyMaterial.deleteMany({ group: group._id }),
      Message.deleteMany({ group: group._id }),
      Report.deleteMany({ resourceType: 'StudyGroup', resourceId: group._id }),
      StudyGroup.findByIdAndDelete(group._id),
    ]);

    await recordAuditLog({
      actor: req.user,
      action: 'GROUP_DELETE',
      resourceType: 'StudyGroup',
      resourceId: String(group._id),
      status: 'SUCCESS',
      details: {
        groupName: group.name,
        subject: group.subject,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Study group and associated sessions, materials, and messages were permanently removed.',
    });
  } catch (error) {
    next(error);
  }
};
