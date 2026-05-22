/**
 * routes/auth.js – Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { authRateLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/authMiddleware');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');

// Public routes (rate limited)
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
