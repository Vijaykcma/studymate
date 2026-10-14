import { User } from '../models/User.js';
import { StudyGroup } from '../models/StudyGroup.js';
import { StudySession } from '../models/StudySession.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { Report } from '../models/Report.js';
import { AuditLog } from '../models/AuditLog.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const dateThreshold = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    // 1. User metrics
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ status: 'active' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const recentSignupsCount = await User.countDocuments({ createdAt: { $gte: dateThreshold } });

    // 2. Study Group metrics
    const totalGroups = await StudyGroup.countDocuments();
    const recentGroupsCount = await StudyGroup.countDocuments({ createdAt: { $gte: dateThreshold } });
    const publicGroups = await StudyGroup.countDocuments({ visibility: 'public' });
    const privateGroups = await StudyGroup.countDocuments({ visibility: 'private' });

    // 3. Study Session metrics
    const totalSessions = await StudySession.countDocuments();
    const upcomingSessions = await StudySession.countDocuments({ status: 'Upcoming' });
    const completedSessions = await StudySession.countDocuments({ status: 'Completed' });
    const cancelledSessions = await StudySession.countDocuments({ status: 'Cancelled' });

    // 4. Study Material metrics
    const totalMaterials = await StudyMaterial.countDocuments();
    const recentMaterialsCount = await StudyMaterial.countDocuments({ createdAt: { $gte: dateThreshold } });
    
    // Calculate total storage bytes
    const storageAggregation = await StudyMaterial.aggregate([
      { $group: { _id: null, totalBytes: { $sum: '$fileSize' } } },
    ]);
    const totalStorageBytes = storageAggregation[0]?.totalBytes || 0;

    // 5. Moderation Reports
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const underReviewReports = await Report.countDocuments({ status: 'under_review' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const dismissedReports = await Report.countDocuments({ status: 'dismissed' });

    // 6. Recent Audit Activities
    const recentAuditLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(8);

    // 7. Recent Registrations list
    const recentUsers = await User.find()
      .select('name email role status department semester createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // 8. 7-Day Growth Trend (Real calculated points)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const userSignupsTrend = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          students: totalStudents,
          admins: totalAdmins,
          active: activeUsers,
          suspended: suspendedUsers,
          recent: recentSignupsCount,
        },
        groups: {
          total: totalGroups,
          recent: recentGroupsCount,
          public: publicGroups,
          private: privateGroups,
        },
        sessions: {
          total: totalSessions,
          upcoming: upcomingSessions,
          completed: completedSessions,
          cancelled: cancelledSessions,
        },
        materials: {
          total: totalMaterials,
          recent: recentMaterialsCount,
          storageBytes: totalStorageBytes,
          storageFormattedMB: (totalStorageBytes / (1024 * 1024)).toFixed(2),
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
          underReview: underReviewReports,
          resolved: resolvedReports,
          dismissed: dismissedReports,
          unresolved: pendingReports + underReviewReports,
        },
        recentAuditLogs,
        recentUsers,
        growthTrend: userSignupsTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};
