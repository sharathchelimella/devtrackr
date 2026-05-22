/**
 * routes/github.js – GitHub Integration Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { githubRateLimiter } = require('../middleware/rateLimiter');
const {
  connectGithub,
  disconnectGithub,
  syncGithubData,
  getGithubData,
  getRepositories,
  getCommits,
  getPullRequests,
  getIssues,
} = require('../controllers/githubController');

// All GitHub routes require authentication
router.use(protect);

router.post('/connect', connectGithub);
router.delete('/disconnect', disconnectGithub);
router.post('/sync', githubRateLimiter, syncGithubData);
router.get('/data', getGithubData);
router.get('/repos', getRepositories);
router.get('/commits', getCommits);
router.get('/prs', getPullRequests);
router.get('/issues', getIssues);

module.exports = router;
