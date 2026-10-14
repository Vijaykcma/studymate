import { StudyGroup } from '../models/StudyGroup.js';

export const getGroups = async (req, res, next) => {
  try {
    const {
      search,
      subject,
      skillLevel,
      location,
      department,
      semester,
      sort = '-createdAt',
      page = 1,
      limit = 9,
    } = req.query;

    const query = { visibility: 'public' };

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { subject: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (subject && subject !== 'All') {
      query.subject = { $regex: new RegExp(`^${subject}$`, 'i') };
    }

    if (skillLevel && skillLevel !== 'All Levels') {
      query.skillLevel = skillLevel;
    }

    if (location && location !== 'All') {
      query.location = { $regex: new RegExp(`^${location}$`, 'i') };
    }

    if (department && department.trim()) {
      query.$or = [
        ...(query.$or || []),
        { department: { $regex: department.trim(), $options: 'i' } },
        { department: '' },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 9;
    const skip = (pageNum - 1) * limitNum;

    const total = await StudyGroup.countDocuments(query);
    const groups = await StudyGroup.find(query)
      .populate('creator', 'name email department semester')
      .populate('members.user', 'name email department semester')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: groups.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      groups,
    });
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    const {
      name,
      subject,
      description,
      maxMembers,
      skillLevel,
      meetingDays,
      meetingTime,
      location,
      department,
      semester,
      visibility,
    } = req.body;

    const group = await StudyGroup.create({
      name,
      subject,
      description,
      maxMembers: maxMembers || 10,
      skillLevel: skillLevel || 'All Levels',
      meetingDays: meetingDays && meetingDays.length ? meetingDays : ['Monday', 'Wednesday'],
      meetingTime: meetingTime || '7:00 PM',
      location: location || 'Online',
      department: department || '',
      semester: semester || '',
      visibility: visibility || 'public',
      creator: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'admin',
          joinedAt: new Date(),
        },
      ],
    });

    const populatedGroup = await StudyGroup.findById(group._id)
      .populate('creator', 'name email department semester')
      .populate('members.user', 'name email department semester');

    res.status(201).json({
      success: true,
      message: 'Study group created successfully.',
      group: populatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.groupId)
      .populate('creator', 'name email department semester bio')
      .populate('members.user', 'name email department semester');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found.',
      });
    }

    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    let group = await StudyGroup.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found.',
      });
    }

    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can edit this group.',
      });
    }

    group = await StudyGroup.findByIdAndUpdate(req.params.groupId, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('creator', 'name email department semester')
      .populate('members.user', 'name email department semester');

    res.status(200).json({
      success: true,
      message: 'Group updated successfully.',
      group,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found.',
      });
    }

    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can delete this group.',
      });
    }

    await StudyGroup.findByIdAndDelete(req.params.groupId);

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found.',
      });
    }

    // Check if already a member
    const alreadyMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this study group.',
      });
    }

    // Check capacity
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'This study group has reached its maximum member capacity.',
      });
    }

    group.members.push({
      user: req.user._id,
      role: 'member',
      joinedAt: new Date(),
    });

    await group.save();

    const updatedGroup = await StudyGroup.findById(group._id)
      .populate('creator', 'name email department semester')
      .populate('members.user', 'name email department semester');

    res.status(200).json({
      success: true,
      message: 'Successfully joined study group!',
      group: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found.',
      });
    }

    const memberIndex = group.members.findIndex(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this study group.',
      });
    }

    // If user is creator and sole member/admin
    if (group.creator.toString() === req.user._id.toString() && group.members.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'As the sole creator and member, you must delete the group instead of leaving.',
      });
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    const updatedGroup = await StudyGroup.findById(group._id)
      .populate('creator', 'name email department semester')
      .populate('members.user', 'name email department semester');

    res.status(200).json({
      success: true,
      message: 'Successfully left the study group.',
      group: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupMembers = async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.groupId)
      .populate('members.user', 'name email department semester avatar');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found.',
      });
    }

    res.status(200).json({
      success: true,
      members: group.members,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserGroups = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Groups created by user
    const createdGroups = await StudyGroup.find({ creator: userId })
      .populate('creator', 'name email department semester')
      .populate('members.user', 'name email department semester');

    // Groups joined by user (where user is a member)
    const joinedGroups = await StudyGroup.find({ 'members.user': userId })
      .populate('creator', 'name email department semester')
      .populate('members.user', 'name email department semester');

    res.status(200).json({
      success: true,
      created: createdGroups,
      joined: joinedGroups,
    });
  } catch (error) {
    next(error);
  }
};
