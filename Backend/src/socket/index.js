const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'nexchat-dev-secret-key-change-in-production';

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

/**
 * Initialize Socket.IO server
 */
const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🟢 User connected: ${userId}`);

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Update DB online status
    await query('UPDATE users SET is_online = true, last_seen = NOW() WHERE id = $1', [userId]);

    // Join user's chat rooms
    const chats = await query('SELECT chat_id FROM chat_members WHERE user_id = $1', [userId]);
    for (const { chat_id } of chats.rows) {
      socket.join(`chat:${chat_id}`);
    }

    // Broadcast online status to contacts
    socket.broadcast.emit('user:online', { userId });

    // ──────────────────────────────────────
    // MESSAGE EVENTS
    // ──────────────────────────────────────

    socket.on('message:send', async (data) => {
      const { chatId, content, type = 'text', replyTo, metadata } = data;

      try {
        const result = await query(
          `INSERT INTO messages (chat_id, sender_id, content, type, reply_to, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, chat_id, sender_id, content, type, reply_to, metadata, created_at`,
          [chatId, userId, content, type, replyTo || null, JSON.stringify(metadata || {})]
        );

        const message = result.rows[0];
        const sender = await query(
          'SELECT id, username, full_name, avatar_url FROM users WHERE id = $1',
          [userId]
        );

        const messagePayload = {
          id: message.id,
          chatId: message.chat_id,
          senderId: message.sender_id,
          sender: {
            id: sender.rows[0].id,
            username: sender.rows[0].username,
            fullName: sender.rows[0].full_name,
            avatarUrl: sender.rows[0].avatar_url,
          },
          content: message.content,
          type: message.type,
          replyTo: message.reply_to,
          metadata: message.metadata,
          createdAt: message.created_at,
          status: 'sent',
        };

        // Emit to all members in the chat room
        io.to(`chat:${chatId}`).emit('message:new', messagePayload);

        // Create delivery status for other members
        await query(
          `INSERT INTO message_status (message_id, user_id, status)
           SELECT $1, user_id, 'delivered' FROM chat_members WHERE chat_id = $2 AND user_id != $3`,
          [message.id, chatId, userId]
        );
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:delivered', async ({ messageId }) => {
      try {
        await query(
          "UPDATE message_status SET status = 'delivered', updated_at = NOW() WHERE message_id = $1 AND user_id = $2",
          [messageId, userId]
        );

        const msg = await query('SELECT sender_id, chat_id FROM messages WHERE id = $1', [messageId]);
        if (msg.rows.length > 0) {
          io.to(`chat:${msg.rows[0].chat_id}`).emit('message:status', {
            messageId,
            userId,
            status: 'delivered',
          });
        }
      } catch (err) {
        console.error('Delivery update error:', err);
      }
    });

    socket.on('message:seen', async ({ messageId, chatId }) => {
      try {
        await query(
          "UPDATE message_status SET status = 'read', updated_at = NOW() WHERE message_id = $1 AND user_id = $2",
          [messageId, userId]
        );

        io.to(`chat:${chatId}`).emit('message:status', {
          messageId,
          userId,
          status: 'read',
        });
      } catch (err) {
        console.error('Seen update error:', err);
      }
    });

    // ──────────────────────────────────────
    // TYPING EVENTS
    // ──────────────────────────────────────

    socket.on('typing:start', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:start', { chatId, userId });
    });

    socket.on('typing:stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:stop', { chatId, userId });
    });

    // ──────────────────────────────────────
    // CALL EVENTS
    // ──────────────────────────────────────

    socket.on('call:initiate', async ({ calleeId, type }) => {
      const calleeSockets = onlineUsers.get(calleeId);
      if (calleeSockets) {
        for (const socketId of calleeSockets) {
          io.to(socketId).emit('call:incoming', {
            callerId: userId,
            type,
          });
        }
      }
    });

    socket.on('call:answer', ({ callerId }) => {
      const callerSockets = onlineUsers.get(callerId);
      if (callerSockets) {
        for (const socketId of callerSockets) {
          io.to(socketId).emit('call:answered', { calleeId: userId });
        }
      }
    });

    socket.on('call:offer', ({ to, offer }) => {
      const targetSockets = onlineUsers.get(to);
      if (targetSockets) {
        for (const socketId of targetSockets) {
          io.to(socketId).emit('call:offer', { from: userId, offer });
        }
      }
    });

    socket.on('call:answer-sdp', ({ to, answer }) => {
      const targetSockets = onlineUsers.get(to);
      if (targetSockets) {
        for (const socketId of targetSockets) {
          io.to(socketId).emit('call:answer-sdp', { from: userId, answer });
        }
      }
    });

    socket.on('call:candidate', ({ to, candidate }) => {
      const targetSockets = onlineUsers.get(to);
      if (targetSockets) {
        for (const socketId of targetSockets) {
          io.to(socketId).emit('call:candidate', { from: userId, candidate });
        }
      }
    });

    socket.on('call:end', ({ otherUserId }) => {
      const otherSockets = onlineUsers.get(otherUserId);
      if (otherSockets) {
        for (const socketId of otherSockets) {
          io.to(socketId).emit('call:ended', { userId });
        }
      }
    });

    // ──────────────────────────────────────
    // DISCONNECT
    // ──────────────────────────────────────

    socket.on('disconnect', async () => {
      console.log(`🔴 User disconnected: ${userId}`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          await query('UPDATE users SET is_online = false, last_seen = NOW() WHERE id = $1', [userId]);
          socket.broadcast.emit('user:offline', { userId });
        }
      }
    });
  });

  return io;
};

module.exports = { initSocketServer };
