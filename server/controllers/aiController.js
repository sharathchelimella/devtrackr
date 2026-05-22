/**
 * controllers/aiController.js – AI Developer Insights Controller
 * Handles AI analysis, sprint summaries, and report persistence.
 */

const asyncHandler     = require('../utils/asyncHandler');
const GithubData       = require('../models/GithubData');
const Report           = require('../models/Report');
const aiService        = require('../services/aiService');
const { getOrSet }     = require('../utils/cache');

const { createNotification } = require('../utils/notifications');

// ── @desc    Generate full AI developer insights
// ── @route   POST /api/ai/analyze
// ── @access  Private
const analyzeProductivity = asyncHandler(async (req, res) => {
  const { reportType = 'weekly' } = req.body;

  // Dispatch 'ai:started' notification
  await createNotification(
    req.user._id,
    'ai:started',
    'AI Analysis Started',
    'Analyzing repositories, commit habits, and productivity patterns using Google Gemini...'
  );

  // Check if Gemini API key is configured
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('your-')) {
    const demoAnalysis = getDemoAnalysis(req.user.name);
    
    // Dispatch 'ai:complete' for demo mode
    await createNotification(
      req.user._id,
      'ai:complete',
      'AI Analysis Complete (Demo Mode)',
      `Analysis completed with productivity score of ${demoAnalysis.productivityScore}%.`
    );

    return res.status(200).json({
      success: true,
      demo: true,
      message: 'AI analysis running in demo mode (Gemini API key not configured)',
      analysis: demoAnalysis,
    });
  }

  // Fetch stored GitHub data
  const githubData = await GithubData.findOne({ user: req.user._id });
  if (!githubData) {
    // Dispatch 'ai:failed' notification
    await createNotification(
      req.user._id,
      'ai:failed',
      'AI Analysis Failed',
      'No GitHub data found. Please connect and sync your GitHub account first.'
    );

    res.status(400);
    throw new Error('No GitHub data found. Please connect and sync your GitHub account first.');
  }

  const cacheKey = `ai_v2:${req.user._id}:${reportType}`;

  try {
    const analysis = await getOrSet(
      cacheKey,
      async () => {
        return aiService.analyzeProductivity({
          commits:      githubData.commits      || [],
          pullRequests: githubData.pullRequests || [],
          issues:       githubData.issues       || [],
          repositories: githubData.repositories || [],
          username:     req.user.github?.username || req.user.name,
          dateRange:    'Last 30 days',
        });
      },
      1800 // Cache for 30 minutes
    );

    // Persist report to DB
    const report = await Report.create({
      user:          req.user._id,
      reportType,
      summary:       analysis.summary,
      productivityScore: analysis.productivityScore,
      recommendations:   analysis.recommendations || [],
      bottlenecks:       analysis.bottlenecks     || [],
      inactiveContributors: analysis.inactiveAreas || [],
      commitCount:  githubData.commits?.length      || 0,
      prCount:      githubData.pullRequests?.length  || 0,
      issueCount:   githubData.issues?.length        || 0,
      aiModel:      analysis.aiModel,
      tokensUsed:   analysis.tokensUsed,
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to:   new Date(),
      },
    });

    // Dispatch 'ai:complete' notification
    await createNotification(
      req.user._id,
      'ai:complete',
      'AI Analysis Complete',
      `Analysis finished! Productivity score: ${analysis.productivityScore}%.`,
      { reportId: report._id, productivityScore: analysis.productivityScore }
    );

    res.status(200).json({ success: true, analysis, reportId: report._id });
  } catch (err) {
    console.error('AI analysis failed:', err.message);

    // Dispatch 'ai:failed' notification
    await createNotification(
      req.user._id,
      'ai:failed',
      'AI Analysis Failed',
      `AI analysis failed: ${err.message}`
    );

    res.status(500);
    throw new Error(`AI Analysis failed: ${err.message}`);
  }
});

// ── @desc    Sprint summary (fast, lightweight call)
// ── @route   GET /api/ai/sprint-summary
// ── @access  Private
const getSprintSummary = asyncHandler(async (req, res) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('your-')) {
    return res.status(200).json({
      success: true,
      demo: true,
      summary:
        '• Completed 12 feature commits across 3 repositories this sprint\n' +
        '• Fixed 3 critical bugs in the authentication module\n' +
        '• Reviewed and merged 5 pull requests from teammates\n' +
        '• Updated API documentation and added 18 unit tests\n' +
        '• Resolved 4 open issues ahead of the sprint deadline',
    });
  }

  const githubData = await GithubData.findOne({ user: req.user._id });
  if (!githubData?.commits?.length) {
    res.status(400);
    throw new Error('No GitHub commit data found. Sync your GitHub account first.');
  }

  const summary = await aiService.generateSprintSummary(
    githubData.commits,
    req.user.github?.username || req.user.name
  );

  res.status(200).json({ success: true, summary });
});

// ── @desc    Get paginated past AI reports
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
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

// ── @desc    Get single report
// ── @route   GET /api/ai/reports/:id
// ── @access  Private
const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
  if (!report) { res.status(404); throw new Error('Report not found'); }
  res.status(200).json({ success: true, report });
});

// ── Rich demo payload (returned when no Gemini key is set) ───────────────────
const getDemoAnalysis = (name) => ({
  productivityScore: 78,
  summary: `${name} has maintained strong development momentum over the past 30 days with consistent daily commits, healthy PR engagement, and active issue resolution. Code quality indicators are positive and productivity is trending upward.`,
  weeklyTrend: 'improving',
  highlights: [
    'Maintained a 12-day commit streak – top 15% of developers',
    'Successfully merged 8 pull requests with fast review cycles',
    'Resolved 5 critical bugs ahead of sprint deadline',
  ],

  commitInsights: {
    verdict: 'Commit frequency is healthy with meaningful messages indicating feature-driven development.',
    patterns: 'Most productive on Tuesday–Thursday afternoons. Consistent weekday commits with occasional weekend pushes.',
    messageQuality: 'good',
    suggestions: [
      'Use conventional commits format (feat:, fix:, docs:) for better changelog generation',
      'Break large commits into atomic, single-responsibility changes',
    ],
  },

  repositoryInsights: {
    verdict: 'Active across 5 repositories with strong focus on 2 primary projects.',
    mostActiveRepo: 'main-project',
    languageDiversity: 'medium',
    suggestions: [
      'Add README badges (build status, coverage) to improve repo visibility',
      'Consider archiving repos with no commits in 90+ days',
    ],
  },

  codingActivityInsights: {
    verdict: 'Coding activity is consistent with healthy work-life balance signals.',
    peakProductivityTime: 'Afternoons (2–5 PM) on weekdays',
    consistencyScore: 72,
    burnoutRisk: 'low',
    suggestions: [
      'Schedule deep-work coding blocks during your peak afternoon hours',
      'Consider using GitHub Actions to automate repetitive tasks',
    ],
  },

  productivityPatterns: {
    verdict: 'Shows a consistent weekday coding pattern with strong PR merge rate.',
    workStyle: 'consistent',
    prHealthScore: 82,
    issueResolutionRate: 65,
    suggestions: [
      'Improve issue resolution rate by triaging open issues weekly',
      'Reduce PR review cycle time by adding PR templates',
    ],
  },

  recommendations: [
    {
      type: 'improvement',
      title: 'Increase code review participation',
      description: 'Reviewing teammates\' PRs more frequently improves team velocity by ~20% and accelerates your own code quality skills.',
      priority: 'medium',
      category: 'patterns',
    },
    {
      type: 'bottleneck',
      title: 'Address stale open PRs',
      description: '3 pull requests have been open for 7+ days without activity. Stale PRs cause merge conflicts and slow team progress.',
      priority: 'high',
      category: 'repositories',
    },
    {
      type: 'task',
      title: 'Adopt conventional commit messages',
      description: 'Structured commit messages (feat:, fix:, docs:) enable automatic changelog generation and improve project history readability.',
      priority: 'low',
      category: 'commits',
    },
    {
      type: 'improvement',
      title: 'Schedule weekly issue triage',
      description: 'Your open issue backlog is growing. A 30-minute weekly triage prevents accumulation and maintains project health.',
      priority: 'medium',
      category: 'activity',
    },
  ],

  bottlenecks: [
    'Long PR review cycles averaging 4+ days',
    'Issue backlog growing 15% week over week',
    'Limited automated test coverage in 2 active repos',
  ],

  strengths: [
    'Consistent daily commit cadence with 12-day streak',
    'Fast PR merge rate – 80% merged within 48 hours',
    'Broad language diversity across repositories',
  ],

  commitPatterns: {
    byDay:    { Mon: 8, Tue: 15, Wed: 12, Thu: 14, Fri: 10, Sat: 4, Sun: 2 },
    byHour:   { morning: 12, afternoon: 28, evening: 18, night: 7 },
    peakDay:  'Tue',
    peakTime: 'afternoon',
  },

  repoStats: [
    { name: 'main-project',  language: 'JavaScript', stars: 12, commits: 28, openIssues: 5  },
    { name: 'api-service',   language: 'TypeScript',  stars: 4,  commits: 15, openIssues: 2  },
    { name: 'mobile-app',    language: 'React Native',stars: 7,  commits: 8,  openIssues: 8  },
    { name: 'utils-lib',     language: 'JavaScript', stars: 3,  commits: 4,  openIssues: 0  },
    { name: 'docs-site',     language: 'Markdown',   stars: 1,  commits: 2,  openIssues: 1  },
  ],

  activityMetrics: {
    currentStreak: 12,
    longestStreak: 21,
    activeDays:    22,
    avgPerDay:     2.2,
    totalCommits:  65,
  },

  aiModel: 'gemini-demo',
  generatedAt: new Date().toISOString(),
});

module.exports = { analyzeProductivity, getSprintSummary, getReports, getReport };
