/**
 * utils/notifications.js – Unified Notification Dispatcher
 * Automatically saves notifications to MongoDB AND pushes them in real-time via Socket.IO
 */

const Notification = require('../models/Notification');
const { sendNotification } = require('../services/socketService');

/**
 * Creates and dispatches a notification for a user
 * @param {string} userId - User ID
 * @param {string} type - 'sync:started' | 'sync:complete' | 'sync:failed' | 'ai:started' | 'ai:complete' | 'ai:failed' | 'system' | 'info'
 * @param {string} title - Notification title
 * @param {string} message - Notification text
 * @param {object} [metaData] - Optional custom data
 */
const createNotification = async (userId, type, title, message, metaData = null) => {
  try {
    // 1. Persist notification in database
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      metaData,
    });

    // 2. Push via WebSocket
    sendNotification(userId, type, {
      id: notification._id,
      title,
      message,
      isRead: false,
      metaData,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (err) {
    console.error('Error dispatching notification:', err.message);
  }
};

module.exports = {
  createNotification,
};
