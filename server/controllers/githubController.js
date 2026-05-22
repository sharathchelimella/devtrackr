/**
 * controllers/githubController.js – GitHub Integration Controller
 */

const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const GithubData = require('../models/GithubData');
const githubService = require('../services/githubService');
const { invalidateByPrefix } = require('../utils/cache');

// ── @desc    Connect GitHub via Personal Access Token
// ── @route   POST /api/github/connect
// ── @access  Private
const connectGithub = asyncHandler(async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    res.status(400);
    throw new Error('Please provide a GitHub Personal Access Token');
  }

  // Validate the token with GitHub
  let githubUser;
  try {
    githubUser = await githubService.validateTokenAndGetUser(accessToken);
  } catch (err) {
    res.status(401);
    throw new Error('Invalid GitHub token. Please check your PAT and try again.');
  }

  // Store the token securely on the user document
  await User.findByIdAndUpdate(req.user._id, {
    'github.accessToken': accessToken,
    'github.username': githubUser.login,
    'github.avatarUrl': githubUser.avatar_url,
    'github.profileUrl': githubUser.html_url,
    'github.connectedAt': new Date(),
    'github.isConnected': true,
  });

  // Invalidate any cached data for this user
  invalidateByPrefix(`repos:${githubUser.login}`);

  res.status(200).json({
    success: true,
    message: `GitHub account @${githubUser.login} connected successfully!`,
    github: {
      username: githubUser.login,
      avatarUrl: githubUser.avatar_url,
      profileUrl: githubUser.html_url,
      name: githubUser.name,
      publicRepos: githubUser.public_repos,
      followers: githubUser.followers,
    },
  });
});

// ── @desc    Disconnect GitHub account
// ── @route   DELETE /api/github/disconnect
// ── @access  Private
const disconnectGithub = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+github.accessToken');
  const username = user.github?.username;

  await User.findByIdAndUpdate(req.user._id, {
    'github.accessToken': null,
    'github.isConnected': false,
    'github.username': null,
  });

  // Clear cached data
  if (username) invalidateByPrefix(username);

  // Remove stored GitHub data
  await GithubData.deleteOne({ user: req.user._id });

  res.status(200).json({
    success: true,
    message: 'GitHub account disconnected',
  });
});

const { createNotification } = require('../utils/notifications');

// ── @desc    Fetch and sync all GitHub data for the user
// ── @route   POST /api/github/sync
// ── @access  Private
const syncGithubData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+github.accessToken');

  if (!user.github?.isConnected || !user.github?.accessToken) {
    res.status(400);
    throw new Error('GitHub account is not connected. Please connect your GitHub first.');
  }

  const { accessToken, username } = user.github;

  // Dispatch 'sync:started' notification
  await createNotification(
    req.user._id,
    'sync:started',
    'GitHub Sync Started',
    `Manual data sync triggered for @${username}.`
  );

  try {
    // Fetch repositories
    const repositories = await githubService.fetchRepositories(accessToken, username);

    // Fetch commits across top repos
    const commits = await githubService.fetchAllCommits(accessToken, username, repositories);

    // Fetch PRs and issues from top 3 repos
    const topRepos = repositories.slice(0, 3);
    const prArrays = await Promise.allSettled(
      topRepos.map((r) => githubService.fetchPullRequests(accessToken, username, r.name))
    );
    const issueArrays = await Promise.allSettled(
      topRepos.map((r) => githubService.fetchIssues(accessToken, username, r.name))
    );

    const pullRequests = prArrays
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value);

    const issues = issueArrays
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value);

    // Compute aggregated stats
    const stats = githubService.computeStats({ repositories, commits, pullRequests, issues });

    // Upsert GitHub data in DB
    const githubData = await GithubData.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        repositories,
        commits,
        pullRequests,
        issues,
        stats,
        lastFetchedAt: new Date(),
      },
      { upsert: true, new: true, runValidators: false }
    );

    // Update last sync time on user
    await User.findByIdAndUpdate(req.user._id, { 'github.lastSyncAt': new Date() });

    // Dispatch 'sync:complete' notification
    await createNotification(
      req.user._id,
      'sync:complete',
      'GitHub Sync Complete',
      `Manual sync succeeded! Verified ${repositories.length} repositories and ${commits.length} commits.`,
      { repoCount: repositories.length, commitCount: commits.length }
    );

    res.status(200).json({
      success: true,
      message: 'GitHub data synced successfully',
      stats,
      lastFetchedAt: githubData.lastFetchedAt,
    });
  } catch (err) {
    console.error('Manual GitHub sync failed:', err.message);

    // Dispatch 'sync:failed' notification
    await createNotification(
      req.user._id,
      'sync:failed',
      'GitHub Sync Failed',
      `Manual sync failed: ${err.message}`
    );

    res.status(500);
    throw new Error(`Sync failed: ${err.message}`);
  }
});

// ── @desc    Get stored GitHub data (without re-fetching)
// ── @route   GET /api/github/data
// ── @access  Private
const getGithubData = asyncHandler(async (req, res) => {
  const data = await GithubData.findOne({ user: req.user._id });

  if (!data) {
    return res.status(200).json({
      success: true,
      message: 'No GitHub data found. Please sync your GitHub account.',
      data: null,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      repositories: data.repositories,
      commits: data.commits,
      pullRequests: data.pullRequests,
      issues: data.issues,
      stats: data.stats,
      lastFetchedAt: data.lastFetchedAt,
    },
  });
});

// ── @desc    Get only repositories
// ── @route   GET /api/github/repos
// ── @access  Private
const getRepositories = asyncHandler(async (req, res) => {
  const data = await GithubData.findOne({ user: req.user._id }).select('repositories');
  res.status(200).json({
    success: true,
    repositories: data?.repositories || [],
  });
});

// ── @desc    Get commits
// ── @route   GET /api/github/commits
// ── @access  Private
const getCommits = asyncHandler(async (req, res) => {
  const data = await GithubData.findOne({ user: req.user._id }).select('commits');
  res.status(200).json({
    success: true,
    commits: data?.commits || [],
  });
});

// ── @desc    Get pull requests
// ── @route   GET /api/github/prs
// ── @access  Private
const getPullRequests = asyncHandler(async (req, res) => {
  const data = await GithubData.findOne({ user: req.user._id }).select('pullRequests');
  res.status(200).json({
    success: true,
    pullRequests: data?.pullRequests || [],
  });
});

// ── @desc    Get issues
// ── @route   GET /api/github/issues
// ── @access  Private
const getIssues = asyncHandler(async (req, res) => {
  const data = await GithubData.findOne({ user: req.user._id }).select('issues');
  res.status(200).json({
    success: true,
    issues: data?.issues || [],
  });
});

module.exports = {
  connectGithub,
  disconnectGithub,
  syncGithubData,
  getGithubData,
  getRepositories,
  getCommits,
  getPullRequests,
  getIssues,
};
