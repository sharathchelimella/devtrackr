/**
 * controllers/oauthController.js – GitHub OAuth Flow
 *
 * Flow:
 *  1. GET /api/auth/github        → redirect user to GitHub authorize page
 *  2. GET /api/auth/github/callback → GitHub sends back ?code=xxx
 *     a. Exchange code for access_token
 *     b. Fetch GitHub user profile
 *     c. Find or create DevTrackr user
 *     d. Auto-sync all GitHub data in background
 *     e. Issue JWT → redirect to frontend with token
 */

const axios        = require('axios');
const User         = require('../models/User');
const GithubData   = require('../models/GithubData');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const githubService = require('../services/githubService');

// ── @desc    Redirect to GitHub OAuth page
// ── @route   GET /api/auth/github
// ── @access  Public
const redirectToGitHub = (req, res) => {
  const params = new URLSearchParams({
    client_id:    process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope:        'read:user user:email repo',
    state:        Math.random().toString(36).slice(2), // CSRF protection
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};

// ── @desc    Handle GitHub OAuth callback
// ── @route   GET /api/auth/github/callback
// ── @access  Public (called by GitHub)
const handleGitHubCallback = asyncHandler(async (req, res) => {
  const { code, error } = req.query;

  // GitHub denied access
  if (error || !code) {
    return res.redirect(
      `${process.env.CLIENT_URL}/login?error=github_denied`
    );
  }

  // ── Step 1: Exchange code for OAuth access token ──────────────────────────
  let oauthToken;
  try {
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri:  process.env.GITHUB_CALLBACK_URL,
      },
      { headers: { Accept: 'application/json' } }
    );

    if (tokenRes.data.error) {
      throw new Error(tokenRes.data.error_description || 'Token exchange failed');
    }
    oauthToken = tokenRes.data.access_token;
  } catch (err) {
    console.error('GitHub OAuth token exchange error:', err.message);
    return res.redirect(`${process.env.CLIENT_URL}/login?error=token_exchange_failed`);
  }

  // ── Step 2: Fetch GitHub user profile ─────────────────────────────────────
  let githubUser;
  try {
    githubUser = await githubService.validateTokenAndGetUser(oauthToken);
  } catch (err) {
    console.error('GitHub profile fetch error:', err.message);
    return res.redirect(`${process.env.CLIENT_URL}/login?error=profile_fetch_failed`);
  }

  // Fetch primary email if not public
  let email = githubUser.email;
  if (!email) {
    try {
      const emailRes = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${oauthToken}`,
          Accept: 'application/vnd.github+json',
        },
      });
      const primary = emailRes.data.find((e) => e.primary && e.verified);
      email = primary?.email || `${githubUser.login}@github.noreply.com`;
    } catch {
      email = `${githubUser.login}@github.noreply.com`;
    }
  }

  // ── Step 3: Find or create DevTrackr user ─────────────────────────────────
  let user;
  try {
    // First: try to find by GitHub ID (returning OAuth user)
    user = await User.findOne({ 'github.githubId': String(githubUser.id) });

    if (!user) {
      // Second: try to find by email (existing local account – link it)
      user = await User.findOne({ email });
    }

    if (user) {
      // Update GitHub token and profile info
      user.github.githubId    = String(githubUser.id);
      user.github.accessToken = oauthToken;
      user.github.username    = githubUser.login;
      user.github.avatarUrl   = githubUser.avatar_url;
      user.github.profileUrl  = githubUser.html_url;
      user.github.bio         = githubUser.bio;
      user.github.location    = githubUser.location;
      user.github.publicRepos = githubUser.public_repos;
      user.github.followers   = githubUser.followers;
      user.github.connectedAt = user.github.connectedAt || new Date();
      user.github.isConnected = true;
      user.authProvider       = 'github';
      user.lastLoginAt        = new Date();
      // Update name/avatar if they are still defaults
      if (!user.name || user.name === 'GitHub User') user.name = githubUser.name || githubUser.login;
      await user.save({ validateBeforeSave: false });
    } else {
      // Create brand-new user via GitHub OAuth
      user = await User.create({
        name:         githubUser.name || githubUser.login,
        email,
        authProvider: 'github',
        lastLoginAt:  new Date(),
        github: {
          githubId:    String(githubUser.id),
          accessToken: oauthToken,
          username:    githubUser.login,
          avatarUrl:   githubUser.avatar_url,
          profileUrl:  githubUser.html_url,
          bio:         githubUser.bio,
          location:    githubUser.location,
          publicRepos: githubUser.public_repos,
          followers:   githubUser.followers,
          connectedAt: new Date(),
          isConnected: true,
        },
      });
    }
  } catch (err) {
    console.error('User create/update error:', err.message);
    return res.redirect(`${process.env.CLIENT_URL}/login?error=user_save_failed`);
  }

  // ── Step 4: Auto-sync GitHub data in the background ───────────────────────
  // We don't await this – respond to user immediately, sync runs async
  syncGitHubDataBackground(user._id, oauthToken, githubUser.login).catch((err) =>
    console.error(`Background sync failed for ${githubUser.login}:`, err.message)
  );

  // ── Step 5: Generate JWT and redirect to frontend ─────────────────────────
  const jwtToken = generateToken(user._id);

  // Redirect to the frontend OAuth callback page with the token in the URL
  res.redirect(
    `${process.env.CLIENT_URL}/oauth/callback?token=${jwtToken}&username=${githubUser.login}&avatar=${encodeURIComponent(githubUser.avatar_url)}`
  );
});

// ── Background sync helper (non-blocking) ────────────────────────────────────
const syncGitHubDataBackground = async (userId, accessToken, username) => {
  console.log(`🔄 Starting background sync for @${username}...`);

  const repositories = await githubService.fetchRepositories(accessToken, username);
  const commits      = await githubService.fetchAllCommits(accessToken, username, repositories);

  const topRepos = repositories.slice(0, 3);
  const [prArrays, issueArrays] = await Promise.all([
    Promise.allSettled(topRepos.map((r) => githubService.fetchPullRequests(accessToken, username, r.name))),
    Promise.allSettled(topRepos.map((r) => githubService.fetchIssues(accessToken, username, r.name))),
  ]);

  const pullRequests = prArrays.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
  const issues       = issueArrays.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
  const stats        = githubService.computeStats({ repositories, commits, pullRequests, issues });

  await GithubData.findOneAndUpdate(
    { user: userId },
    { user: userId, repositories, commits, pullRequests, issues, stats, lastFetchedAt: new Date() },
    { upsert: true, new: true, runValidators: false }
  );

  // Update last sync time on user
  await User.findByIdAndUpdate(userId, { 'github.lastSyncAt': new Date() });

  console.log(`✅ Background sync complete for @${username}: ${repositories.length} repos, ${commits.length} commits`);
};

// ── @desc    Get OAuth sync status
// ── @route   GET /api/auth/github/sync-status
// ── @access  Private
const getSyncStatus = asyncHandler(async (req, res) => {
  const githubData = await GithubData.findOne({ user: req.user._id }).select('lastFetchedAt stats');
  const user       = await User.findById(req.user._id).select('github.lastSyncAt github.username');

  res.status(200).json({
    success: true,
    synced:        !!githubData,
    lastFetchedAt: githubData?.lastFetchedAt,
    lastSyncAt:    user?.github?.lastSyncAt,
    stats:         githubData?.stats || null,
  });
});

module.exports = { redirectToGitHub, handleGitHubCallback, getSyncStatus, syncGitHubDataBackground };
