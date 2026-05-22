/**
 * controllers/aiController.js – AI Analysis Controller
 */

const asyncHandler = require('../utils/asyncHandler');
const GithubData = require('../models/GithubData');
const Report = require('../models/Report');
const aiService = require('../services/aiService');
const { getOrSet } = require('../utils/cache');

// ── @desc    Generate AI productivity analysis
// ── @route   POST /api/ai/analyze
// ── @access  Private
const analyzeProductivity = asyncHandler(async (req, res) => {
  const { reportType = 'weekly' } = req.body;

  // Check if OpenAI key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-your')) {
    return res.status(200).json({
      success: true,
      demo: true,
      message: 'AI analysis running in demo mode (OpenAI key not configured)',
      analysis: getDemoAnalysis(req.user.name),
    });
  }

  // Fetch stored GitHub data
  const githubData = await GithubData.findOne({ user: req.user._id });
  if (!githubData || !githubData.commits?.length) {
    res.status(400);
    throw new Error('No GitHub data found. Please sync your GitHub account first.');
  }

  const cacheKey = `ai:${req.user._id}:${reportType}`;

  const analysis = await getOrSet(
    cacheKey,
    async () => {
      const result = await aiService.analyzeProductivity({
        commits: githubData.commits,
        pullRequests: githubData.pullRequests,
        issues: githubData.issues,
        username: req.user.github?.username,
        dateRange: 'Last 30 days',
      });
      return result;
    },
    1800 // Cache AI results for 30 minutes to save API costs
  );

  // Persist report to DB
  const report = await Report.create({
    user: req.user._id,
    reportType,
    summary: analysis.summary,
    productivityScore: analysis.productivityScore,
    recommendations: analysis.recommendations || [],
    bottlenecks: analysis.bottlenecks || [],
    inactiveContributors: analysis.inactiveAreas || [],
    commitCount: githubData.commits.length,
    prCount: githubData.pullRequests.length,
    issueCount: githubData.issues.length,
    aiModel: analysis.aiModel,
    tokensUsed: analysis.tokensUsed,
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
  });

  res.status(200).json({
    success: true,
    analysis,
    reportId: report._id,
  });
});

// ── @desc    Get sprint summary (lighter AI call)
// ── @route   GET /api/ai/sprint-summary
// ── @access  Private
const getSprintSummary = asyncHandler(async (req, res) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-your')) {
    return res.status(200).json({
      success: true,
      demo: true,
      summary: '• Completed 12 feature commits this sprint\n• Fixed 3 critical bugs\n• Reviewed 5 pull requests\n• Updated documentation for 2 modules',
    });
  }

  const githubData = await GithubData.findOne({ user: req.user._id });
  if (!githubData?.commits?.length) {
    res.status(400);
    throw new Error('No GitHub commit data found.');
  }

  const summary = await aiService.generateSprintSummary(
    githubData.commits,
    req.user.github?.username
  );

  res.status(200).json({ success: true, summary });
});

// ── @desc    Get past AI reports
// ── @route   GET /api/ai/reports
// ── @access  Private
const getReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const reports = await Report.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .select('-__v');

  const total = await Report.countDocuments({ user: req.user._id });

  res.status(200).json({
    success: true,
    reports,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// ── @desc    Get a single report
// ── @route   GET /api/ai/reports/:id
// ── @access  Private
const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({
    _id: req.params.id,
    user: req.user._id, // Ensure user can only access their own reports
  });

  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }

  res.status(200).json({ success: true, report });
});

// ── Demo analysis for when no OpenAI key is configured ────────────────────
const getDemoAnalysis = (name) => ({
  summary: `${name} has shown consistent productivity over the past 30 days with strong commit frequency and active PR engagement. Code quality indicators are positive with regular merges and issue resolution.`,
  productivityScore: 78,
  highlights: [
    'Maintained daily commit streak for 3 weeks',
    'Successfully merged 8 pull requests',
    'Resolved 5 critical issues ahead of schedule',
  ],
  recommendations: [
    {
      type: 'improvement',
      title: 'Increase code review participation',
      description: 'Reviewing peers\' code more frequently can improve team velocity by 20%.',
      priority: 'medium',
    },
    {
      type: 'bottleneck',
      title: 'Stale PRs need attention',
      description: '3 pull requests have been open for more than 7 days without updates.',
      priority: 'high',
    },
    {
      type: 'task',
      title: 'Address open issues backlog',
      description: 'There are 12 open issues. Consider scheduling a dedicated bug-fix sprint.',
      priority: 'medium',
    },
  ],
  bottlenecks: ['Long PR review cycles', 'Issue backlog growing week over week'],
  inactiveAreas: ['Documentation updates', 'Test coverage improvements'],
  weeklyTrend: 'improving',
  aiModel: 'demo-mode',
  generatedAt: new Date().toISOString(),
});

module.exports = { analyzeProductivity, getSprintSummary, getReports, getReport };
