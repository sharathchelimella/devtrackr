/**
 * routes/auth.js – Authentication Routes
 * Covers both email/password auth and GitHub OAuth.
 */

const express = require('express');
const router  = express.Router();
const { authRateLimiter } = require('../middleware/rateLimiter');
const { protect }         = require('../middleware/authMiddleware');

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');

const {
  redirectToGitHub,
  handleGitHubCallback,
  getSyncStatus,
} = require('../controllers/oauthController');

// ── Email / Password Auth (rate limited) ──────────────────────────────────────
router.post('/register', authRateLimiter, register);
router.post('/login',    authRateLimiter, login);

// ── GitHub OAuth ──────────────────────────────────────────────────────────────
// Step 1: Redirect to GitHub authorization page
router.get('/github', redirectToGitHub);

// Step 2: GitHub redirects back here with ?code=
router.get('/github/callback', handleGitHubCallback);

// Get sync status (how fresh the data is)
router.get('/github/sync-status', protect, getSyncStatus);

// ── Protected Routes ──────────────────────────────────────────────────────────
router.get('/me',              protect, getMe);
router.put('/profile',         protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
