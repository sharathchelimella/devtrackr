/**
 * models/Notification.js – Notification Mongoose Model
 * Stores notifications for user historical records and offline recovery.
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['sync:started', 'sync:complete', 'sync:failed', 'ai:started', 'ai:complete', 'ai:failed', 'system', 'info'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metaData: {
      type: mongoose.Schema.Types.Mixed, // Optional key-value storage for detail pages
    },
  },
  {
    timestamps: true,
  }
);

// Index for query optimization (newest notifications first)
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
