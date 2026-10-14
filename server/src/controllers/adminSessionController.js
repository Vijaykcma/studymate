import { StudySession } from '../models/StudySession.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const getAdminSessions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
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
      query.$or = [{ title: searchRegex }, { location: searchRegex }];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const allowedSort = ['title', 'date', 'status', 'createdAt'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';

    const [sessions, totalCount] = await Promise.all([
      StudySession.find(query)
        .populate('organizer', 'name email department')
        .populate('group', 'name subject')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      StudySession.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum) || 1,
          totalSessions: totalCount,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSessionStatusByAdmin = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { status, cancellationReason = '' } = req.body;

    const allowedStatuses = ['Upcoming', 'Completed', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid session status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const session = await StudySession.findById(sessionId).populate('group', 'name');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found.',
      });
    }

    const oldStatus = session.status;
    session.status = status;
    session.cancellationReason = cancellationReason.trim();
    session.moderatedBy = req.user._id;
    await session.save();

    await recordAuditLog({
      actor: req.user,
      action: status === 'Cancelled' ? 'SESSION_CANCELLED' : 'SESSION_STATUS_UPDATE',
      resourceType: 'StudySession',
      resourceId: String(session._id),
      status: 'SUCCESS',
      details: {
        sessionTitle: session.title,
        groupName: session.group?.name,
        oldStatus,
        newStatus: status,
        reason: session.cancellationReason,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Session status updated to "${status}".`,
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSessionByAdmin = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await StudySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found.',
      });
    }

    await StudySession.findByIdAndDelete(session._id);

    await recordAuditLog({
      actor: req.user,
      action: 'SESSION_DELETE',
      resourceType: 'StudySession',
      resourceId: String(session._id),
      status: 'SUCCESS',
      details: {
        sessionTitle: session.title,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Study session was deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
