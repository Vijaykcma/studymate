import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { StudyGroup } from '../models/StudyGroup.js';
import { Message } from '../models/Message.js';

// Global map tracking online users: userId -> count of connected sockets
const onlineUsers = new Map();

export const setupSocket = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie
          .split(';')
          .reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            if (key && value) acc[key] = decodeURIComponent(value);
            return acc;
          }, {});
        token = cookies.token;
      }

      if (!token) {
        return next(new Error('Authentication required for socket connection'));
      }

      const secret = process.env.JWT_SECRET || 'studymate_default_secret_key_123456';
      const decoded = jwt.verify(token, secret);

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Join personal user room for 1-on-1 direct messages & notifications
    socket.join(`user:${userId}`);

    // Update online status presence
    const currentCount = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, currentCount + 1);

    // Broadcast updated online users list
    io.emit('online_users', Array.from(onlineUsers.keys()));
    socket.emit('online_users', Array.from(onlineUsers.keys()));

    // Join group room with authorization check
    socket.on('join_group', async ({ groupId }, callback) => {
      try {
        const group = await StudyGroup.findById(groupId);
        if (!group) {
          if (callback) callback({ success: false, message: 'Group not found' });
          return;
        }

        const isMember = group.members.some(
          (m) => m.user.toString() === socket.user._id.toString()
        );

        if (!isMember) {
          if (callback) callback({ success: false, message: 'You must be a member to join this discussion room' });
          return;
        }

        socket.join(`group:${groupId}`);
        if (callback) callback({ success: true, message: `Joined group room: ${groupId}` });
      } catch (error) {
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // Leave group room
    socket.on('leave_group', ({ groupId }) => {
      socket.leave(`group:${groupId}`);
    });

    // Send group message
    socket.on('send_message', async ({ groupId, content, messageType = 'text', voiceDuration = 0, audioUrl = '', codeSnippet, replyTo, attachments = [] }, callback) => {
      try {
        if ((!content || !content.trim()) && messageType !== 'voice' && attachments.length === 0) {
          if (callback) callback({ success: false, message: 'Message content cannot be empty' });
          return;
        }

        const group = await StudyGroup.findById(groupId);
        if (!group) {
          if (callback) callback({ success: false, message: 'Group not found' });
          return;
        }

        const isMember = group.members.some(
          (m) => m.user.toString() === socket.user._id.toString()
        );

        if (!isMember) {
          if (callback) callback({ success: false, message: 'Not authorized to post to this group' });
          return;
        }

        const savedMsg = await Message.create({
          chatType: 'group',
          group: groupId,
          sender: socket.user._id,
          senderName: socket.user.name,
          content: (content || '').trim(),
          messageType,
          voiceDuration,
          audioUrl,
          codeSnippet: codeSnippet || undefined,
          replyTo: replyTo || undefined,
          attachments: attachments || [],
          poll: arguments[0]?.poll || undefined,
          callInfo: arguments[0]?.callInfo || undefined,
          status: 'read',
        });

        const populated = await Message.findById(savedMsg._id)
          .populate('sender', 'name email department semester avatar')
          .populate({
            path: 'replyTo',
            select: 'content sender senderName messageType codeSnippet',
          })
          .populate('reactions.user', 'name avatar');

        io.to(`group:${groupId}`).emit('new_message', populated);

        if (callback) callback({ success: true, message: populated });
      } catch (error) {
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // Send direct 1-on-1 personalized message (WhatsApp Style)
    socket.on('send_direct_message', async ({ recipientId, content, messageType = 'text', voiceDuration = 0, audioUrl = '', codeSnippet, replyTo, attachments = [] }, callback) => {
      try {
        if ((!content || !content.trim()) && messageType !== 'voice' && attachments.length === 0) {
          if (callback) callback({ success: false, message: 'Message content cannot be empty' });
          return;
        }

        const recipientUser = await User.findById(recipientId);
        if (!recipientUser) {
          if (callback) callback({ success: false, message: 'Recipient not found' });
          return;
        }

        const isRecipientOnline = onlineUsers.has(recipientId.toString());

        const savedMsg = await Message.create({
          chatType: 'direct',
          recipient: recipientId,
          sender: socket.user._id,
          senderName: socket.user.name,
          content: (content || '').trim(),
          messageType,
          voiceDuration,
          audioUrl,
          codeSnippet: codeSnippet || undefined,
          replyTo: replyTo || undefined,
          attachments: attachments || [],
          poll: arguments[0]?.poll || undefined,
          callInfo: arguments[0]?.callInfo || undefined,
          status: isRecipientOnline ? 'delivered' : 'sent',
        });

        const populated = await Message.findById(savedMsg._id)
          .populate('sender', 'name email department semester avatar')
          .populate('recipient', 'name email department semester avatar')
          .populate({
            path: 'replyTo',
            select: 'content sender senderName messageType codeSnippet',
          })
          .populate('reactions.user', 'name avatar');

        // Emit to recipient & sender rooms
        io.to(`user:${recipientId}`).emit('new_direct_message', populated);
        io.to(`user:${userId}`).emit('new_direct_message', populated);

        if (callback) callback({ success: true, message: populated });
      } catch (error) {
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // Mark messages as read (turns checks to blue double ticks ✓✓)
    socket.on('mark_as_read', async ({ peerId, groupId }) => {
      try {
        if (peerId) {
          await Message.updateMany(
            {
              chatType: 'direct',
              sender: peerId,
              recipient: socket.user._id,
              status: { $ne: 'read' },
            },
            {
              $set: { status: 'read' },
              $push: { readBy: { user: socket.user._id, readAt: new Date() } },
            }
          );

          io.to(`user:${peerId}`).emit('messages_read_receipt', {
            readBy: socket.user._id,
            peerId,
            chatType: 'direct',
          });
        }
      } catch (err) {
        console.error('[Socket] mark_as_read error:', err.message);
      }
    });

    // Toggle emoji reaction
    socket.on('send_reaction', async ({ messageId, emoji }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          if (callback) callback({ success: false, message: 'Message not found' });
          return;
        }

        const existingIndex = message.reactions.findIndex(
          (r) => r.user.toString() === socket.user._id.toString()
        );

        if (existingIndex > -1) {
          if (message.reactions[existingIndex].emoji === emoji) {
            message.reactions.splice(existingIndex, 1);
          } else {
            message.reactions[existingIndex].emoji = emoji;
            message.reactions[existingIndex].createdAt = new Date();
          }
        } else {
          message.reactions.push({
            user: socket.user._id,
            emoji,
            createdAt: new Date(),
          });
        }

        await message.save();

        const populated = await Message.findById(message._id).populate('reactions.user', 'name avatar');

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

        if (callback) callback({ success: true, reactions: populated.reactions });
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Delete message (everyone vs me)
    socket.on('delete_message', async ({ messageId, deleteType = 'for_me' }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          if (callback) callback({ success: false, message: 'Message not found' });
          return;
        }

        if (deleteType === 'for_everyone') {
          const isSender = message.sender.toString() === socket.user._id.toString();
          if (!isSender && socket.user.role !== 'admin') {
            if (callback) callback({ success: false, message: 'Not allowed to delete for everyone' });
            return;
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

          if (message.chatType === 'group') {
            io.to(`group:${message.group}`).emit('message_deleted_everyone', payload);
          } else {
            io.to(`user:${message.sender}`).emit('message_deleted_everyone', payload);
            io.to(`user:${message.recipient}`).emit('message_deleted_everyone', payload);
          }

          if (callback) callback({ success: true, deleteType: 'for_everyone' });
          return;
        }

        // Delete for me
        if (!message.deletedFor.includes(socket.user._id)) {
          message.deletedFor.push(socket.user._id);
          await message.save();
        }

        if (callback) callback({ success: true, deleteType: 'for_me' });
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Typing indicators
    socket.on('typing_direct', ({ toUserId, isTyping }) => {
      io.to(`user:${toUserId}`).emit('user_typing_direct', {
        fromUserId: userId,
        fromUserName: socket.user.name,
        isTyping: !!isTyping,
      });
    });

    socket.on('typing_group', ({ groupId, isTyping }) => {
      socket.to(`group:${groupId}`).emit('user_typing_group', {
        groupId,
        userId,
        userName: socket.user.name,
        isTyping: !!isTyping,
      });
    });

    // WebRTC 1-on-1 Voice & Video Calling Signaling
    socket.on('webrtc_call_user', ({ toUserId, offer, callType }) => {
      io.to(`user:${toUserId}`).emit('webrtc_incoming_call', {
        fromUser: {
          _id: socket.user._id,
          name: socket.user.name,
          avatar: socket.user.avatar,
        },
        offer,
        callType: callType || 'audio',
      });
    });

    socket.on('webrtc_answer_call', ({ toUserId, answer }) => {
      io.to(`user:${toUserId}`).emit('webrtc_call_answered', {
        fromUserId: socket.user._id,
        answer,
      });
    });

    socket.on('webrtc_ice_candidate', ({ toUserId, candidate }) => {
      io.to(`user:${toUserId}`).emit('webrtc_ice_candidate', {
        fromUserId: socket.user._id,
        candidate,
      });
    });

    socket.on('webrtc_reject_call', ({ toUserId, reason }) => {
      io.to(`user:${toUserId}`).emit('webrtc_call_rejected', {
        fromUserId: socket.user._id,
        reason: reason || 'declined',
      });
    });

    socket.on('webrtc_end_call', async ({ toUserId, duration, callType, callStatus }) => {
      io.to(`user:${toUserId}`).emit('webrtc_call_ended', {
        fromUserId: socket.user._id,
        duration: duration || 0,
      });

      // Save a call log message into direct chat history
      try {
        if (toUserId) {
          const callMsg = await Message.create({
            chatType: 'direct',
            sender: socket.user._id,
            senderName: socket.user.name,
            recipient: toUserId,
            content: `${callType === 'video' ? '📹 Video' : '📞 Voice'} Call (${duration ? `${Math.floor(duration / 60)}m ${duration % 60}s` : 'Missed'})`,
            messageType: 'call_log',
            callInfo: {
              callType: callType || 'audio',
              duration: duration || 0,
              callStatus: callStatus || (duration > 0 ? 'completed' : 'missed'),
            },
            status: 'sent',
          });

          const populated = await Message.findById(callMsg._id)
            .populate('sender', 'name email department semester avatar')
            .populate('recipient', 'name email department semester avatar');

          io.to(`user:${toUserId}`).emit('new_direct_message', populated);
          io.to(`user:${socket.user._id}`).emit('new_direct_message', populated);
        }
      } catch (err) {
        console.error('[Socket] call_log save error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      const remaining = (onlineUsers.get(userId) || 1) - 1;
      if (remaining <= 0) {
        onlineUsers.delete(userId);
      } else {
        onlineUsers.set(userId, remaining);
      }
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });
  });
};
