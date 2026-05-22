/**
 * services/socketService.js – Socket.IO Initialization and Helper Methods
 * Handles connections, JWT authentication, user room management, and broadcasting notifications.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;
const userSockets = new Map(); // Map user._id string to Set of socket.ids

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Socket authentication middleware via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication error:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user.name} - ${userId})`);

    // Join a user-specific room
    socket.join(userId);

    // Track active connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Send welcome / handshake confirmation
    socket.emit('connected', { success: true, message: 'Connected to real-time notification stream' });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Please call initSocket(server) first.');
  }
  return io;
};

/**
 * Send real-time notification to a specific user
 * @param {string} userId - Target Mongoose User ID
 * @param {string} type - Notification type (e.g. 'sync:started', 'sync:complete', 'ai:complete', 'info')
 * @param {object} payload - Notification data/message
 */
const sendNotification = (userId, type, payload) => {
  if (!io) return;
  const targetId = userId.toString();
  
  // Emitting to the user's private room
  io.to(targetId).emit('notification', {
    type,
    payload,
    timestamp: new Date(),
  });
  console.log(`🔔 Emitted '${type}' notification to User: ${targetId}`);
};

/**
 * Broadcast notification to all connected users
 */
const broadcastNotification = (type, payload) => {
  if (!io) return;
  io.emit('notification', {
    type,
    payload,
    timestamp: new Date(),
  });
};

module.exports = {
  initSocket,
  getIO,
  sendNotification,
  broadcastNotification,
  userSockets,
};
