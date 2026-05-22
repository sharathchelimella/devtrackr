/**
 * routes/notification.js – Notification Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  deleteNotifications,
} = require('../controllers/notificationController');

// All notification routes are protected
router.use(protect);

router.route('/')
  .get(getNotifications)
  .delete(deleteNotifications);

router.put('/read', markAsRead);

module.exports = router;
