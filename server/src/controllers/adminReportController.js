import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { StudyGroup } from '../models/StudyGroup.js';
import { StudySession } from '../models/StudySession.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { Message } from '../models/Message.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const getAdminReports = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      category = 'all',
      resourceType = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (resourceType && resourceType !== 'all') {
      query.resourceType = resourceType;
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const allowedSort = ['createdAt', 'status', 'category', 'resourceType'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';

    const [reports, totalCount] = await Promise.all([
      Report.find(query)
        .populate('reporter', 'name email department')
        .populate('assignedTo', 'name email')
        .populate('resolvedBy', 'name email')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum) || 1,
          totalReports: totalCount,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminReportDetails = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId)
      .populate('reporter', 'name email department semester registrationNumber')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    // Load the specific target resource
    let targetResource = null;
    switch (report.resourceType) {
      case 'User':
        targetResource = await User.findById(report.resourceId).select('-password');
        break;
      case 'StudyGroup':
        targetResource = await StudyGroup.findById(report.resourceId).populate('creator', 'name email');
        break;
      case 'StudySession':
        targetResource = await StudySession.findById(report.resourceId).populate('organizer', 'name email').populate('group', 'name');
        break;
      case 'StudyMaterial':
        targetResource = await StudyMaterial.findById(report.resourceId).populate('uploader', 'name email').populate('group', 'name');
        break;
      case 'Message':
        targetResource = await Message.findById(report.resourceId).populate('sender', 'name email').populate('group', 'name');
        break;
      default:
        break;
    }

    res.status(200).json({
      success: true,
      data: {
        report,
        targetResource,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const assignReportModerator = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { assignedTo } = req.body; // User ID or null to unassign

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    if (assignedTo) {
      const moderator = await User.findById(assignedTo);
      if (!moderator || moderator.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Can only assign reports to verified administrators.',
        });
      }
      report.assignedTo = moderator._id;
      if (report.status === 'pending') {
        report.status = 'under_review';
      }
    } else {
      report.assignedTo = null;
    }

    await report.save();

    await recordAuditLog({
      actor: req.user,
      action: 'REPORT_ASSIGNED',
      resourceType: 'Report',
      resourceId: String(report._id),
      status: 'SUCCESS',
      details: {
        assignedTo: report.assignedTo ? String(report.assignedTo) : 'Unassigned',
      },
      req,
    });

    const populatedReport = await Report.findById(report._id)
      .populate('reporter', 'name email')
      .populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      message: 'Report assignment updated.',
      data: populatedReport,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReportStatus = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { status, resolutionReason = '', moderatorNotes = '' } = req.body;

    const allowedStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    const oldStatus = report.status;
    report.status = status;
    if (moderatorNotes !== undefined) report.moderatorNotes = moderatorNotes.trim();

    if (status === 'resolved' || status === 'dismissed') {
      report.resolutionReason = resolutionReason.trim();
      report.resolvedAt = new Date();
      report.resolvedBy = req.user._id;
    } else {
      report.resolvedAt = null;
      report.resolvedBy = null;
    }

    await report.save();

    await recordAuditLog({
      actor: req.user,
      action: `REPORT_${status.toUpperCase()}`,
      resourceType: 'Report',
      resourceId: String(report._id),
      status: 'SUCCESS',
      details: {
        resourceType: report.resourceType,
        targetResourceId: String(report.resourceId),
        oldStatus,
        newStatus: status,
        resolutionReason: report.resolutionReason,
        moderatorNotes: report.moderatorNotes,
      },
      req,
    });

    const populated = await Report.findById(report._id)
      .populate('reporter', 'name email')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Report has been updated to "${status}".`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public/Student endpoint for submitting reports against inappropriate content.
 */
export const createStudentReport = async (req, res, next) => {
  try {
    const { resourceType, resourceId, category, description } = req.body;

    if (!resourceType || !resourceId || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resourceType, resourceId, category, and description.',
      });
    }

    const validTypes = ['User', 'StudyGroup', 'StudySession', 'StudyMaterial', 'Message'];
    if (!validTypes.includes(resourceType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid resourceType. Allowed types: ${validTypes.join(', ')}`,
      });
    }

    // Prevent duplicate pending reports from the same student for the same resource
    const existing = await Report.findOne({
      reporter: req.user._id,
      resourceType,
      resourceId,
      status: { $in: ['pending', 'under_review'] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a pending report for this item. Our moderation team is reviewing it.',
      });
    }

    const newReport = await Report.create({
      reporter: req.user._id,
      resourceType,
      resourceId,
      category,
      description: description.trim(),
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Thank you for helping keep StudyMate safe and collaborative.',
      reportId: newReport._id,
    });
  } catch (error) {
    next(error);
  }
};
