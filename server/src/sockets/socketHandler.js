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
    console.log(`[Socket] User connected: ${socket.user.name} (${userId})`);

    // Join personal user room for 1-on-1 direct messages & notifications
    socket.join(`user:${userId}`);

    // Update online status presence
    const currentCount = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, currentCount + 1);

    // Broadcast updated online users list
    io.emit('online_users', Array.from(onlineUsers.keys()));

    // Send initial list of online users to this socket
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
    socket.on('send_message', async ({ groupId, content, messageType = 'text', voiceDuration = 0, codeSnippet }, callback) => {
      try {
        if ((!content || !content.trim()) && messageType !== 'voice') {
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
          codeSnippet: codeSnippet || undefined,
          status: 'read',
        });

        const populated = await Message.findById(savedMsg._id).populate(
          'sender',
          'name email department semester avatar'
        );

        io.to(`group:${groupId}`).emit('new_message', populated);

        if (callback) callback({ success: true, message: populated });
      } catch (error) {
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // Send direct 1-on-1 personalized message (WhatsApp Style)
    socket.on('send_direct_message', async ({ recipientId, content, messageType = 'text', voiceDuration = 0, codeSnippet }, callback) => {
      try {
        if ((!content || !content.trim()) && messageType !== 'voice') {
          if (callback) callback({ success: false, message: 'Message content cannot be empty' });
          return;
        }

        const recipientUser = await User.findById(recipientId);
        if (!recipientUser) {
          if (callback) callback({ success: false, message: 'Recipient not found' });
          return;
        }

        const savedMsg = await Message.create({
          chatType: 'direct',
          recipient: recipientId,
          sender: socket.user._id,
          senderName: socket.user.name,
          content: (content || '').trim(),
          messageType,
          voiceDuration,
          codeSnippet: codeSnippet || undefined,
          status: 'read',
        });

        const populated = await Message.findById(savedMsg._id)
          .populate('sender', 'name email department semester avatar')
          .populate('recipient', 'name email department semester avatar');

        // Emit to both recipient and sender personal rooms
        io.to(`user:${recipientId}`).emit('new_direct_message', populated);
        io.to(`user:${userId}`).emit('new_direct_message', populated);

        if (callback) callback({ success: true, message: populated });
      } catch (error) {
        if (callback) callback({ success: false, message: error.message });
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

