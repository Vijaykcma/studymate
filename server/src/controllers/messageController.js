import { Message } from '../models/Message.js';
import { StudyGroup } from '../models/StudyGroup.js';
import { User } from '../models/User.js';
import { Status } from '../models/Status.js';

// ==========================================
// GROUP MESSAGES
// ==========================================

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

    const messages = await Message.find({
      group: groupId,
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'name email department semester avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender senderName messageType codeSnippet',
      })
      .populate('reactions.user', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(300);

    // Format deleted for everyone messages
    const formatted = messages.map((m) => {
      const doc = m.toObject();
      if (doc.isDeletedForEveryone) {
        doc.content = '🚫 This message was deleted';
        doc.codeSnippet = undefined;
        doc.attachments = [];
      }
      return doc;
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      messages: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const sendGroupMessage = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const {
      content,
      messageType = 'text',
      voiceDuration = 0,
      audioUrl = '',
      codeSnippet,
      replyTo,
      attachments = [],
    } = req.body;

    if (
      (!content || !content.trim()) &&
      messageType !== 'voice' &&
      attachments.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Message content or attachment is required.',
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
      audioUrl,
      codeSnippet: codeSnippet || undefined,
      replyTo: replyTo || undefined,
      attachments: attachments || [],
      poll: req.body.poll || undefined,
      callInfo: req.body.callInfo || undefined,
      status: 'read',
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name email department semester avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender senderName messageType codeSnippet',
      })
      .populate('reactions.user', 'name avatar');

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

// ==========================================
// DIRECT MESSAGES (1-on-1 Personal WhatsApp Space)
// ==========================================

export const getDirectMessages = async (req, res, next) => {
  try {
    const { userId: targetUserId } = req.params;

    const targetUser = await User.findById(targetUserId).select(
      'name email department semester avatar bio'
    );
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
      {
        $set: { status: 'read' },
        $push: { readBy: { user: req.user._id, readAt: new Date() } },
      }
    );

    // Notify sender via Socket that their messages were read (blue ticks ✓✓)
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${targetUserId}`).emit('messages_read_receipt', {
        readBy: req.user._id,
        chatType: 'direct',
      });
    }

    const messages = await Message.find({
      chatType: 'direct',
      deletedFor: { $ne: req.user._id },
      $or: [
        { sender: req.user._id, recipient: targetUserId },
        { sender: targetUserId, recipient: req.user._id },
      ],
    })
      .populate('sender', 'name email department semester avatar')
      .populate('recipient', 'name email department semester avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender senderName messageType codeSnippet',
      })
      .populate('reactions.user', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(300);

    const formatted = messages.map((m) => {
      const doc = m.toObject();
      if (doc.isDeletedForEveryone) {
        doc.content = '🚫 This message was deleted';
        doc.codeSnippet = undefined;
        doc.attachments = [];
      }
      return doc;
    });

    res.status(200).json({
      success: true,
      peer: targetUser,
      count: formatted.length,
      messages: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const sendDirectMessage = async (req, res, next) => {
  try {
    const { userId: targetUserId } = req.params;
    const {
      content,
      messageType = 'text',
      voiceDuration = 0,
      audioUrl = '',
      codeSnippet,
      replyTo,
      attachments = [],
    } = req.body;

    if (
      (!content || !content.trim()) &&
      messageType !== 'voice' &&
      attachments.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Message content or attachment is required.',
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found.',
      });
    }

    const isBlocked =
      (targetUser.blockedUsers || []).some((id) => id.toString() === req.user._id.toString()) ||
      (req.user.blockedUsers || []).some((id) => id.toString() === targetUserId.toString());

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send message. This user is blocked.',
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
      audioUrl,
      codeSnippet: codeSnippet || undefined,
      replyTo: replyTo || undefined,
      attachments: attachments || [],
      poll: req.body.poll || undefined,
      callInfo: req.body.callInfo || undefined,
      status: 'sent',
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name email department semester avatar')
      .populate('recipient', 'name email department semester avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender senderName messageType codeSnippet',
      })
      .populate('reactions.user', 'name avatar');

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

// ==========================================
// WHATSAPP MESSAGE ACTIONS: EDIT, DELETE, REACT, STAR, PIN
// ==========================================

export const reactToMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required.' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        // Toggle off if same emoji clicked again
        message.reactions.splice(existingIndex, 1);
      } else {
        // Update to new emoji
        message.reactions[existingIndex].emoji = emoji;
        message.reactions[existingIndex].createdAt = new Date();
      }
    } else {
      // Add new reaction
      message.reactions.push({
        user: req.user._id,
        emoji,
        createdAt: new Date(),
      });
    }

    await message.save();

    const populated = await Message.findById(message._id).populate('reactions.user', 'name avatar');

    const io = req.app.get('io');
    if (io) {
      const payload = {
        messageId: message._id,
        reactions: populated.reactions,
      };
      if (message.chatType === 'group') {
        io.to(`group:${message.group}`).emit('message_reaction_updated', payload);
      } else {
        io.to(`user:${message.sender}`).emit('message_reaction_updated', payload);
        io.to(`user:${message.recipient}`).emit('message_reaction_updated', payload);
      }
    }

    res.status(200).json({
      success: true,
      reactions: populated.reactions,
    });
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Updated content is required.' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the original sender can edit this message.' });
    }

    if (message.isDeletedForEveryone) {
      return res.status(400).json({ success: false, message: 'Cannot edit a deleted message.' });
    }

    // WhatsApp 15-minute edit window check
    const diffMins = (Date.now() - new Date(message.createdAt).getTime()) / (1000 * 60);
    if (diffMins > 60) {
      return res.status(400).json({ success: false, message: 'Messages can only be edited within 60 minutes of sending.' });
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'name email department semester avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender senderName messageType codeSnippet',
      })
      .populate('reactions.user', 'name avatar');

    const io = req.app.get('io');
    if (io) {
      if (message.chatType === 'group') {
        io.to(`group:${message.group}`).emit('message_edited', populated);
      } else {
        io.to(`user:${message.sender}`).emit('message_edited', populated);
        io.to(`user:${message.recipient}`).emit('message_edited', populated);
      }
    }

    res.status(200).json({
      success: true,
      message: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { deleteType = 'for_me' } = req.body; // 'for_me' | 'for_everyone'

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const io = req.app.get('io');

    if (deleteType === 'for_everyone') {
      const isSender = message.sender.toString() === req.user._id.toString();
      if (!isSender && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'You can only delete your own messages for everyone.' });
      }

      message.isDeletedForEveryone = true;
      message.content = '🚫 This message was deleted';
      message.codeSnippet = undefined;
      message.attachments = [];
      await message.save();

      const payload = {
        messageId: message._id,
        isDeletedForEveryone: true,
        content: '🚫 This message was deleted',
      };

      if (io) {
        if (message.chatType === 'group') {
          io.to(`group:${message.group}`).emit('message_deleted_everyone', payload);
        } else {
          io.to(`user:${message.sender}`).emit('message_deleted_everyone', payload);
          io.to(`user:${message.recipient}`).emit('message_deleted_everyone', payload);
        }
      }

      return res.status(200).json({
        success: true,
        messageId: message._id,
        deleteType: 'for_everyone',
      });
    }

    // Delete for me
    if (!message.deletedFor.includes(req.user._id)) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }

    res.status(200).json({
      success: true,
      messageId: message._id,
      deleteType: 'for_me',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleStarMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const index = message.starredBy.indexOf(req.user._id);
    let isStarred = false;

    if (index > -1) {
      message.starredBy.splice(index, 1);
      isStarred = false;
    } else {
      message.starredBy.push(req.user._id);
      isStarred = true;
    }

    await message.save();

    res.status(200).json({
      success: true,
      messageId: message._id,
      isStarred,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CONVERSATIONS & PEERS DIRECTORY
// ==========================================

export const getConversations = async (req, res, next) => {
  try {
    const myId = req.user._id;

    const directMessages = await Message.find({
      chatType: 'direct',
      deletedFor: { $ne: myId },
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
    const currentUser = await User.findById(myId).select('pinnedChats mutedChats blockedUsers');

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
      pinnedChats: currentUser?.pinnedChats || [],
      mutedChats: currentUser?.mutedChats || [],
      blockedUsers: currentUser?.blockedUsers || [],
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

// ==========================================
// MEDIA & ATTACHMENT UPLOAD
// ==========================================

export const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      file: {
        url: fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// POLL VOTING
// ==========================================

export const votePoll = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message || !message.poll || !message.poll.options) {
      return res.status(404).json({ success: false, message: 'Poll message not found.' });
    }

    if (optionIndex < 0 || optionIndex >= message.poll.options.length) {
      return res.status(400).json({ success: false, message: 'Invalid option index.' });
    }

    // Toggle or vote
    message.poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter((v) => v.toString() !== userId.toString());
    });

    message.poll.options[optionIndex].votes.push(userId);
    await message.save();

    const io = req.app.get('io');
    if (io) {
      if (message.chatType === 'direct') {
        io.to(`user:${message.recipient}`).emit('poll_voted', { messageId, poll: message.poll });
        io.to(`user:${message.sender}`).emit('poll_voted', { messageId, poll: message.poll });
      } else if (message.group) {
        io.to(`group:${message.group}`).emit('poll_voted', { messageId, poll: message.poll });
      }
    }

    res.status(200).json({
      success: true,
      poll: message.poll,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 24-HOUR STATUS UPDATES (STORIES)
// ==========================================

export const createStatus = async (req, res, next) => {
  try {
    const { content, mediaUrl, mediaType = 'text', backgroundColor = '#4f46e5' } = req.body;
    const newStatus = await Status.create({
      user: req.user._id,
      userName: req.user.name,
      userAvatar: req.user.avatar || '',
      content: content || '',
      mediaUrl: mediaUrl || '',
      mediaType,
      backgroundColor,
    });
    res.status(201).json({ success: true, status: newStatus });
  } catch (error) {
    next(error);
  }
};

export const getStatuses = async (req, res, next) => {
  try {
    const now = new Date();
    const activeStatuses = await Status.find({ expiresAt: { $gt: now } })
      .populate('user', 'name avatar department')
      .populate('viewers.user', 'name avatar')
      .sort({ createdAt: -1 });

    const grouped = new Map();
    for (const st of activeStatuses) {
      const uId = st.user?._id?.toString() || st.user?.toString();
      if (!grouped.has(uId)) {
        grouped.set(uId, {
          user: st.user,
          statuses: [st],
          hasUnviewed: !st.viewers.some((v) => v.user?._id?.toString() === req.user._id.toString()),
        });
      } else {
        const item = grouped.get(uId);
        item.statuses.push(st);
        if (!st.viewers.some((v) => v.user?._id?.toString() === req.user._id.toString())) {
          item.hasUnviewed = true;
        }
      }
    }

    res.status(200).json({
      success: true,
      stories: Array.from(grouped.values()),
    });
  } catch (error) {
    next(error);
  }
};

export const viewStatus = async (req, res, next) => {
  try {
    const { statusId } = req.params;
    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ success: false, message: 'Status not found.' });
    }
    const alreadyViewed = status.viewers.some(
      (v) => v.user?.toString() === req.user._id.toString()
    );
    if (!alreadyViewed) {
      status.viewers.push({ user: req.user._id, viewedAt: new Date() });
      await status.save();
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PIN & MUTE CONVERSATIONS
// ==========================================

export const togglePinChat = async (req, res, next) => {
  try {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ success: false, message: 'chatId is required' });

    const user = await User.findById(req.user._id);
    const pinnedSet = new Set(user.pinnedChats || []);
    let isPinned = false;

    if (pinnedSet.has(chatId)) {
      pinnedSet.delete(chatId);
    } else {
      pinnedSet.add(chatId);
      isPinned = true;
    }

    user.pinnedChats = Array.from(pinnedSet);
    await user.save();

    res.status(200).json({ success: true, isPinned, pinnedChats: user.pinnedChats });
  } catch (error) {
    next(error);
  }
};

export const toggleMuteChat = async (req, res, next) => {
  try {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ success: false, message: 'chatId is required' });

    const user = await User.findById(req.user._id);
    const mutedSet = new Set(user.mutedChats || []);
    let isMuted = false;

    if (mutedSet.has(chatId)) {
      mutedSet.delete(chatId);
    } else {
      mutedSet.add(chatId);
      isMuted = true;
    }

    user.mutedChats = Array.from(mutedSet);
    await user.save();

    res.status(200).json({ success: true, isMuted, mutedChats: user.mutedChats });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BLOCK / UNBLOCK USERS
// ==========================================

export const toggleBlockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user._id);
    const blockedSet = new Set((user.blockedUsers || []).map((id) => id.toString()));
    let isBlocked = false;

    if (blockedSet.has(userId)) {
      blockedSet.delete(userId);
    } else {
      blockedSet.add(userId);
      isBlocked = true;
    }

    user.blockedUsers = Array.from(blockedSet);
    await user.save();

    res.status(200).json({ success: true, isBlocked, blockedUsers: user.blockedUsers });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CLEAR CHAT HISTORY
// ==========================================

export const clearChatHistory = async (req, res, next) => {
  try {
    const { chatType, targetId } = req.body;
    const myId = req.user._id;

    if (chatType === 'direct') {
      await Message.updateMany(
        {
          chatType: 'direct',
          $or: [
            { sender: myId, recipient: targetId },
            { sender: targetId, recipient: myId },
          ],
        },
        { $addToSet: { deletedFor: myId } }
      );
    } else {
      await Message.updateMany(
        { group: targetId },
        { $addToSet: { deletedFor: myId } }
      );
    }

    res.status(200).json({ success: true, message: 'Chat history cleared for you.' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BROADCAST MESSAGING
// ==========================================

export const sendBroadcast = async (req, res, next) => {
  try {
    const { recipientIds, content, attachments, audioUrl } = req.body;
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ success: false, message: 'recipientIds array is required.' });
    }

    const createdMessages = [];
    const io = req.app.get('io');

    for (const recipientId of recipientIds) {
      const msg = await Message.create({
        chatType: 'direct',
        sender: req.user._id,
        senderName: req.user.name,
        recipient: recipientId,
        content: content || '',
        messageType: audioUrl ? 'voice' : attachments?.length ? 'file' : 'text',
        attachments: attachments || [],
        audioUrl: audioUrl || '',
        status: 'sent',
      });

      const populated = await Message.findById(msg._id)
        .populate('sender', 'name email department semester avatar')
        .populate('recipient', 'name email department semester avatar');

      if (io) {
        io.to(`user:${recipientId}`).emit('new_direct_message', populated);
        io.to(`user:${req.user._id}`).emit('new_direct_message', populated);
      }

      createdMessages.push(populated);
    }

    res.status(201).json({ success: true, count: createdMessages.length, messages: createdMessages });
  } catch (error) {
    next(error);
  }
};
