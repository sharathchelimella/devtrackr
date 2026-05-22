/**
 * controllers/notificationController.js – Notification Management
 */

const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');

// ── @desc    Get user notifications (latest 30)
// ── @route   GET /api/notifications
// ── @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  res.status(200).json({
    success: true,
    count: notifications.length,
    notifications,
  });
});

// ── @desc    Mark one or all notifications as read
// ── @route   PUT /api/notifications/read
// ── @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (id) {
    // Mark a specific notification as read
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } else {
    // Mark all user notifications as read
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  }
});

// ── @desc    Delete single notification or clear all
// ── @route   DELETE /api/notifications
// ── @access  Private
const deleteNotifications = asyncHandler(async (req, res) => {
  const { id } = req.query;

  if (id) {
    const notification = await Notification.findOneAndDelete({ _id: id, user: req.user._id });
    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } else {
    await Notification.deleteMany({ user: req.user._id });

    return res.status(200).json({
      success: true,
      message: 'All notifications cleared',
    });
  }
});

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotifications,
};
