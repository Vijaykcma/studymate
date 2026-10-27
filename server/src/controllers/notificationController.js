import { Notification } from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const filter = { recipient: req.user._id };

    if (req.query.unreadOnly === 'true') {
      filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('sender', 'name email avatar')
        .populate('relatedGroup', 'name subject')
        .populate('relatedSession', 'title date startTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    notification.isRead = true;
    await notification.save();

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: 'Notification removed successfully.',
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// Helper utility to create notifications from other actions
export const createNotificationHelper = async ({
  recipient,
  sender = null,
  type = 'system',
  title,
  message,
  relatedGroup = null,
  relatedSession = null,
  actionUrl = '',
}) => {
  try {
    return await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      relatedGroup,
      relatedSession,
      actionUrl,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};
