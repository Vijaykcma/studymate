import { StudySession } from '../models/StudySession.js';
import { StudyGroup } from '../models/StudyGroup.js';

export const getSessions = async (req, res, next) => {
  try {
    const { groupId } = req.query;
    let query = {};

    if (groupId) {
      query.group = groupId;
    } else {
      // Find all groups user belongs to
      const userGroups = await StudyGroup.find({ 'members.user': req.user._id }).select('_id');
      const groupIds = userGroups.map((g) => g._id);
      query.group = { $in: groupIds };
    }

    const sessions = await StudySession.find(query)
      .populate('group', 'name subject location')
      .populate('organizer', 'name email department')
      .populate('participants', 'name email')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

export const createSession = async (req, res, next) => {
  try {
    const {
      title,
      group: groupId,
      description,
      date,
      startTime,
      endTime,
      location,
      meetingType,
      meetingLink,
    } = req.body;

    const group = await StudyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found.',
      });
    }

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only members of this study group can schedule study sessions.',
      });
    }

    const session = await StudySession.create({
      title,
      group: groupId,
      description,
      date,
      startTime,
      endTime,
      location: location || 'Online',
      meetingType: meetingType || 'Online',
      meetingLink: meetingLink || '',
      organizer: req.user._id,
      participants: [req.user._id],
    });

    const populatedSession = await StudySession.findById(session._id)
      .populate('group', 'name subject location')
      .populate('organizer', 'name email department');

    res.status(201).json({
      success: true,
      message: 'Study session created successfully.',
      session: populatedSession,
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (req, res, next) => {
  try {
    const session = await StudySession.findById(req.params.sessionId)
      .populate('group', 'name subject location')
      .populate('organizer', 'name email department')
      .populate('participants', 'name email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found.',
      });
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (req, res, next) => {
  try {
    const session = await StudySession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found.',
      });
    }

    if (session.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the session organizer can update this session.',
      });
    }

    const updated = await StudySession.findByIdAndUpdate(
      req.params.sessionId,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('group', 'name subject location')
      .populate('organizer', 'name email department');

    res.status(200).json({
      success: true,
      message: 'Session updated successfully.',
      session: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (req, res, next) => {
  try {
    const session = await StudySession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Study session not found.',
      });
    }

    if (session.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the session organizer can delete this session.',
      });
    }

    await StudySession.findByIdAndDelete(req.params.sessionId);

    res.status(200).json({
      success: true,
      message: 'Session cancelled and deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
