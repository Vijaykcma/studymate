import { Message } from '../models/Message.js';
import { StudyGroup } from '../models/StudyGroup.js';
import { User } from '../models/User.js';

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
      .limit(200);

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
    const { content, messageType = 'text', voiceDuration = 0, codeSnippet } = req.body;

    if ((!content || !content.trim()) && messageType !== 'voice') {
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
      chatType: 'group',
      group: groupId,
      sender: req.user._id,
      senderName: req.user.name,
      content: (content || '').trim(),
      messageType,
      voiceDuration,
      codeSnippet: codeSnippet || undefined,
      status: 'read',
    });

    const populated = await Message.findById(message._id).populate(
      'sender',
      'name email department semester avatar'
    );

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

// DIRECT MESSAGING (Personal WhatsApp / Messenger Space)

export const getDirectMessages = async (req, res, next) => {
  try {
    const { userId: targetUserId } = req.params;

    const targetUser = await User.findById(targetUserId).select('name email department semester avatar bio');
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Peer contact not found.',
      });
    }

    // Mark unread messages sent by targetUser as read
    await Message.updateMany(
      {
        chatType: 'direct',
        sender: targetUserId,
        recipient: req.user._id,
        status: { $ne: 'read' },
      },
      { $set: { status: 'read' } }
    );

    const messages = await Message.find({
      chatType: 'direct',
      $or: [
        { sender: req.user._id, recipient: targetUserId },
        { sender: targetUserId, recipient: req.user._id },
      ],
    })
      .populate('sender', 'name email department semester avatar')
      .populate('recipient', 'name email department semester avatar')
      .sort({ createdAt: 1 })
      .limit(300);

    res.status(200).json({
      success: true,
      peer: targetUser,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

export const sendDirectMessage = async (req, res, next) => {
  try {
    const { userId: targetUserId } = req.params;
    const { content, messageType = 'text', voiceDuration = 0, codeSnippet } = req.body;

    if ((!content || !content.trim()) && messageType !== 'voice') {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty.',
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found.',
      });
    }

    const message = await Message.create({
      chatType: 'direct',
      recipient: targetUserId,
      sender: req.user._id,
      senderName: req.user.name,
      content: (content || '').trim(),
      messageType,
      voiceDuration,
      codeSnippet: codeSnippet || undefined,
      status: 'read',
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name email department semester avatar')
      .populate('recipient', 'name email department semester avatar');

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${targetUserId}`).emit('new_direct_message', populated);
      io.to(`user:${req.user._id}`).emit('new_direct_message', populated);
    }

    res.status(201).json({
      success: true,
      message: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const myId = req.user._id;

    // Fetch all direct messages involving current user
    const directMessages = await Message.find({
      chatType: 'direct',
      $or: [{ sender: myId }, { recipient: myId }],
    })
      .populate('sender', 'name email department semester avatar')
      .populate('recipient', 'name email department semester avatar')
      .sort({ createdAt: -1 });

    const conversationsMap = new Map();

    for (const msg of directMessages) {
      const isSender = msg.sender?._id?.toString() === myId.toString();
      const peer = isSender ? msg.recipient : msg.sender;
      if (!peer || !peer._id) continue;

      const peerId = peer._id.toString();

      if (!conversationsMap.has(peerId)) {
        conversationsMap.set(peerId, {
          peer,
          lastMessage: msg,
          unreadCount: !isSender && msg.status !== 'read' ? 1 : 0,
        });
      } else {
        if (!isSender && msg.status !== 'read') {
          const item = conversationsMap.get(peerId);
          item.unreadCount += 1;
        }
      }
    }

    const conversations = Array.from(conversationsMap.values());

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailablePeers = async (req, res, next) => {
  try {
    const { search = '' } = req.query;
    const query = {
      _id: { $ne: req.user._id },
      isSuspended: { $ne: true },
    };

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { department: regex }, { email: regex }];
    }

    const peers = await User.find(query)
      .select('name email department semester avatar bio')
      .limit(30);

    res.status(200).json({
      success: true,
      count: peers.length,
      peers,
    });
  } catch (error) {
    next(error);
  }
};

