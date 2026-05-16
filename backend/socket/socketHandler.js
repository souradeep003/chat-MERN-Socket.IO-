const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const socketHandler = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.id})`);

    // Update user online status
    await User.findByIdAndUpdate(socket.user._id, {
      isOnline: true,
      socketId: socket.id,
      lastSeen: new Date(),
    });

    // Broadcast online users
    const onlineUsers = await User.find({ isOnline: true }).select('_id');
    io.emit('users:online', onlineUsers.map((u) => u._id.toString()));

    // ─── Join Conversation ───────────────────────────────────────────────────

    socket.on('conversation:join', async (conversationId) => {
      socket.join(conversationId);

      // Mark messages as delivered
      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: socket.user._id },
          deliveredTo: { $ne: socket.user._id },
        },
        {
          $addToSet: { deliveredTo: socket.user._id },
          $set: { status: 'delivered' },
        }
      );
    });

    // ─── Leave Conversation ──────────────────────────────────────────────────

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(conversationId);
    });

    // ─── Send Message ────────────────────────────────────────────────────────

    socket.on('message:send', async (data) => {
      try {
        const { conversation, content, type, fileUrl, fileName, fileSize } = data;

        // Validate conversation exists and user is participant
        const conv = await Conversation.findOne({
          _id: conversation,
          participants: socket.user._id,
        });

        if (!conv) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Create message
        const message = await Message.create({
          conversation,
          sender: socket.user._id,
          content: content || '',
          type: type || 'text',
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          fileSize: fileSize || null,
          readBy: [socket.user._id],
          deliveredTo: [socket.user._id],
          status: 'sent',
        });

        // Update conversation last message
        await Conversation.findByIdAndUpdate(conversation, {
          lastMessage: message._id,
          updatedAt: new Date(),
        });

        // Populate sender info
        const populated = await Message.findById(message._id).populate(
          'sender',
          'name email avatar'
        );

        // Emit to all in conversation room
        io.to(conversation).emit('message:new', populated);

        // Send to offline participants
        const fullConv = await Conversation.findById(conversation).populate(
          'participants',
          'socketId isOnline'
        );

        for (const participant of fullConv.participants) {
          if (
            participant._id.toString() !== socket.user._id.toString() &&
            participant.socketId &&
            participant.isOnline
          ) {
            // Mark as delivered if they're online but not in room
            const roomMembers = await io.in(conversation).allSockets();
            if (!roomMembers.has(participant.socketId)) {
              io.to(participant.socketId).emit('message:new', populated);
              await Message.findByIdAndUpdate(message._id, {
                $addToSet: { deliveredTo: participant._id },
                status: 'delivered',
              });
            }
          }
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── Typing Indicators ───────────────────────────────────────────────────

    socket.on('typing:start', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:start', {
        userId: socket.user._id,
        userName: socket.user.name,
        conversationId,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:stop', {
        userId: socket.user._id,
        conversationId,
      });
    });

    // ─── Mark as Read ────────────────────────────────────────────────────────

    socket.on('message:read', async ({ conversationId }) => {
      try {
        const updated = await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: socket.user._id },
            readBy: { $ne: socket.user._id },
          },
          {
            $addToSet: { readBy: socket.user._id },
            $set: { status: 'read' },
          }
        );

        if (updated.modifiedCount > 0) {
          socket.to(conversationId).emit('message:read', {
            conversationId,
            userId: socket.user._id,
          });
        }
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    });

    // ─── Edit Message ────────────────────────────────────────────────────────

    socket.on('message:edit', async ({ messageId, content }) => {
      try {
        const message = await Message.findOne({
          _id: messageId,
          sender: socket.user._id,
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        message.content = content;
        message.edited = true;
        await message.save();

        io.to(message.conversation.toString()).emit('message:updated', {
          messageId,
          updates: { content, edited: true },
        });
      } catch (error) {
        console.error('Edit message error:', error);
      }
    });

    // ─── Delete Message ──────────────────────────────────────────────────────

    socket.on('message:delete', async ({ messageId }) => {
      try {
        const message = await Message.findOne({
          _id: messageId,
          sender: socket.user._id,
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        message.deleted = true;
        message.content = '';
        message.fileUrl = null;
        await message.save();

        io.to(message.conversation.toString()).emit('message:deleted', {
          messageId,
          conversationId: message.conversation,
        });
      } catch (error) {
        console.error('Delete message error:', error);
      }
    });

    // ─── Reactions ───────────────────────────────────────────────────────────

    socket.on('message:react', async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);

        if (!message) return;

        // Remove existing reaction from user
        message.reactions = message.reactions.filter(
          (r) => r.user.toString() !== socket.user._id.toString()
        );

        // Add new reaction
        message.reactions.push({ user: socket.user._id, emoji });
        await message.save();

        io.to(message.conversation.toString()).emit('message:reaction', {
          messageId,
          reactions: message.reactions,
        });
      } catch (error) {
        console.error('Reaction error:', error);
      }
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.name}`);

      await User.findByIdAndUpdate(socket.user._id, {
        isOnline: false,
        socketId: null,
        lastSeen: new Date(),
      });

      const onlineUsers = await User.find({ isOnline: true }).select('_id');
      io.emit('users:online', onlineUsers.map((u) => u._id.toString()));
    });
  });
};

module.exports = socketHandler;