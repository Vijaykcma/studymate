import { User } from '../models/User.js';
import { StudyGroup } from '../models/StudyGroup.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { StudySession } from '../models/StudySession.js';

export const getPublicStats = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments();
    const totalGroups = await StudyGroup.countDocuments();
    const totalMaterials = await StudyMaterial.countDocuments();
    const totalSessions = await StudySession.countDocuments();

    // Fetch popular public groups
    const popularGroups = await StudyGroup.find({ visibility: 'public' })
      .populate('creator', 'name department')
      .populate('members.user', 'name')
      .sort({ 'members.length': -1, createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalGroups,
        totalMaterials,
        totalSessions,
      },
      popularGroups,
    });
  } catch (error) {
    next(error);
  }
};
