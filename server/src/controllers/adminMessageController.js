import { Message } from '../models/Message.js';
import { Report } from '../models/Report.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const getReportedMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Find all reports filed against messages
    const messageReports = await Report.find({ resourceType: 'Message' })
      .populate('reporter', 'name email department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalCount = await Report.countDocuments({ resourceType: 'Message' });

    // For each report, load the target message and 2 surrounding context messages
    const reportsWithContext = await Promise.all(
      messageReports.map(async (report) => {
        const message = await Message.findById(report.resourceId)
          .populate('sender', 'name email department avatar')
          .populate('group', 'name subject');

        let contextBefore = [];
        let contextAfter = [];

        if (message) {
          contextBefore = await Message.find({
            group: message.group?._id || message.group,
            createdAt: { $lt: message.createdAt },
          })
            .sort({ createdAt: -1 })
            .limit(2)
            .populate('sender', 'name');

          contextBefore = contextBefore.reverse();

          contextAfter = await Message.find({
            group: message.group?._id || message.group,
            createdAt: { $gt: message.createdAt },
          })
            .sort({ createdAt: 1 })
            .limit(2)
            .populate('sender', 'name');
        }

        return {
          report,
          message,
          context: {
            before: contextBefore,
            target: message,
            after: contextAfter,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        cases: reportsWithContext,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum) || 1,
          totalCases: totalCount,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const moderateMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { isDeleted, deletedReason = '' } = req.body;

    const message = await Message.findById(messageId).populate('group', 'name');
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      });
    }

    const previousState = message.isDeleted;
    message.isDeleted = Boolean(isDeleted);
    message.deletedReason = deletedReason.trim();
    message.moderatedBy = req.user._id;
    await message.save();

    await recordAuditLog({
      actor: req.user,
      action: message.isDeleted ? 'MESSAGE_HIDDEN' : 'MESSAGE_RESTORED',
      resourceType: 'Message',
      resourceId: String(message._id),
      status: 'SUCCESS',
      details: {
        groupName: message.group?.name,
        previousState,
        newState: message.isDeleted,
        reason: message.deletedReason,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Message has been successfully ${message.isDeleted ? 'hidden' : 'restored'}.`,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};
