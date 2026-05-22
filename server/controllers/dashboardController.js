/**
 * controllers/dashboardController.js – Dashboard Summary Controller
 */

const asyncHandler = require('../utils/asyncHandler');
const GithubData = require('../models/GithubData');
const Report = require('../models/Report');
const User = require('../models/User');

// ── @desc    Get dashboard summary (metrics + recent activity)
// ── @route   GET /api/dashboard/summary
// ── @access  Private
const getDashboardSummary = asyncHandler(async (req, res) => {
  const [githubData, latestReport] = await Promise.all([
    GithubData.findOne({ user: req.user._id }),
    Report.findOne({ user: req.user._id }).sort({ createdAt: -1 }),
  ]);

  const user = await User.findById(req.user._id);

  // Build commit frequency data (last 30 days grouped by date)
  const commitFrequency = buildCommitFrequency(githubData?.commits || []);

  // Build contributor activity
  const contributorActivity = buildContributorActivity(githubData?.commits || []);

  res.status(200).json({
    success: true,
    dashboard: {
      user: {
        name: user.name,
        email: user.email,
        github: user.github,
        lastLoginAt: user.lastLoginAt,
      },
      stats: githubData?.stats || getEmptyStats(),
      commitFrequency,
      contributorActivity,
      recentCommits: (githubData?.commits || []).slice(0, 10),
      recentPRs: (githubData?.pullRequests || []).slice(0, 10),
      recentIssues: (githubData?.issues || []).slice(0, 10),
      topLanguages: githubData?.stats?.languages?.slice(0, 5) || [],
      latestReport: latestReport
        ? {
            id: latestReport._id,
            productivityScore: latestReport.productivityScore,
            summary: latestReport.summary,
            weeklyTrend: latestReport.weeklyTrend,
            createdAt: latestReport.createdAt,
          }
        : null,
      lastFetchedAt: githubData?.lastFetchedAt || null,
      isGithubConnected: user.github?.isConnected || false,
    },
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build daily commit frequency for the last 30 days.
 */
const buildCommitFrequency = (commits) => {
  const days = 30;
  const dateMap = {};

  // Initialize all days to 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dateMap[key] = 0;
  }

  // Count commits per day
  commits.forEach((c) => {
    if (!c.date) return;
    const key = new Date(c.date).toISOString().split('T')[0];
    if (dateMap.hasOwnProperty(key)) {
      dateMap[key]++;
    }
  });

  return Object.entries(dateMap).map(([date, count]) => ({ date, count }));
};

/**
 * Build contributor activity aggregation.
 */
const buildContributorActivity = (commits) => {
  const authorMap = {};
  commits.forEach((c) => {
    const author = c.author || 'Unknown';
    authorMap[author] = (authorMap[author] || 0) + 1;
  });

  return Object.entries(authorMap)
    .map(([name, commits]) => ({ name, commits }))
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 10);
};

const getEmptyStats = () => ({
  totalRepos: 0,
  totalCommits: 0,
  totalPRs: 0,
  openPRs: 0,
  closedPRs: 0,
  totalIssues: 0,
  openIssues: 0,
  languages: [],
});

module.exports = { getDashboardSummary };
