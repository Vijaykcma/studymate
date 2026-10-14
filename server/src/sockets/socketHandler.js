import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { StudyGroup } from '../models/StudyGroup.js';
import { Message } from '../models/Message.js';

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
    console.log(`[Socket] User connected: ${socket.user.name} (${socket.user._id})`);

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

    // Send real-time message
    socket.on('send_message', async ({ groupId, content }, callback) => {
      try {
        if (!content || !content.trim()) {
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
          group: groupId,
          sender: socket.user._id,
          senderName: socket.user.name,
          content: content.trim(),
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

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
};
