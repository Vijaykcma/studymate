import { AuditLog } from '../models/AuditLog.js';

export const getAdminAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 15,
      action = 'all',
      resourceType = 'all',
      status = 'all',
      search = '',
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (action && action !== 'all') {
      query.action = action;
    }

    if (resourceType && resourceType !== 'all') {
      query.resourceType = resourceType;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { action: searchRegex },
        { actorName: searchRegex },
        { actorEmail: searchRegex },
        { resourceId: searchRegex },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [logs, totalCount] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum) || 1,
          totalLogs: totalCount,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
