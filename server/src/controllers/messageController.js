import { Message } from '../models/Message.js';
import { StudyGroup } from '../models/StudyGroup.js';

export const getGroupMessages = async (req, res, next) => {
  try {
    const { groupId } = req.params;

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
        message: 'You must be a member of this study group to view discussions.',
      });
    }

    const messages = await Message.find({ group: groupId })
      .populate('sender', 'name email department semester avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

export const sendGroupMessage = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty.',
      });
    }

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
        message: 'You must be a member of this group to send messages.',
      });
    }

    const message = await Message.create({
      group: groupId,
      sender: req.user._id,
      senderName: req.user.name,
      content: content.trim(),
    });

    const populated = await Message.findById(message._id).populate(
      'sender',
      'name email department semester avatar'
    );

    // If io is accessible via req.app.get('io')
    const io = req.app.get('io');
    if (io) {
      io.to(`group:${groupId}`).emit('new_message', populated);
    }

    res.status(201).json({
      success: true,
      message: populated,
    });
  } catch (error) {
    next(error);
  }
};
