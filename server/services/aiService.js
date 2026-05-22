/**
 * services/aiService.js – AI Developer Insights Service
 * Uses Google Gemini 1.5 Flash to analyze GitHub data across
 * 4 dimensions: Commits, Repositories, Coding Activity, Productivity Patterns.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let geminiClient = null;

const getGeminiClient = () => {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
};

const getModel = (jsonMode = true) =>
  getGeminiClient().getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2500,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  });

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute commit frequency heatmap data (commits per weekday and per hour bucket).
 */
const computeCommitPatterns = (commits) => {
  const byDay   = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  const byHour  = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const byWeek  = {};

  commits.forEach((c) => {
    const d = new Date(c.date);
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    byDay[day] = (byDay[day] || 0) + 1;

    const h = d.getHours();
    if (h >= 6  && h < 12) byHour.morning++;
    else if (h >= 12 && h < 17) byHour.afternoon++;
    else if (h >= 17 && h < 21) byHour.evening++;
    else byHour.night++;

    const weekKey = getWeekKey(d);
    byWeek[weekKey] = (byWeek[weekKey] || 0) + 1;
  });

  const peakDay  = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]?.[0];
  const peakTime = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0]?.[0];

  return { byDay, byHour, byWeek, peakDay, peakTime };
};

const getWeekKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
};

/**
 * Compute per-repository stats from commits.
 */
const computeRepoStats = (commits, repositories) => {
  const repoCommitMap = {};
  commits.forEach((c) => {
    const repo = c.repoName || 'unknown';
    repoCommitMap[repo] = (repoCommitMap[repo] || 0) + 1;
  });

  return repositories.slice(0, 10).map((r) => ({
    name: r.name,
    language: r.language || 'N/A',
    stars: r.stars,
    commits: repoCommitMap[r.name] || 0,
    openIssues: r.openIssues,
    isPrivate: r.isPrivate,
  }));
};

/**
 * Compute streak and activity metrics.
 */
const computeActivityMetrics = (commits) => {
  if (!commits.length) return { currentStreak: 0, longestStreak: 0, activeDays: 0, avgPerDay: 0 };

  const days = [...new Set(commits.map((c) => new Date(c.date).toDateString()))].sort(
    (a, b) => new Date(b) - new Date(a)
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 1;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (days[0] === today || days[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < days.length; i++) {
      const diff = (new Date(days[i - 1]) - new Date(days[i])) / 86400000;
      if (diff === 1) { currentStreak++; streak++; }
      else { longestStreak = Math.max(longestStreak, streak); streak = 1; }
    }
  }
  longestStreak = Math.max(longestStreak, streak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    activeDays: days.length,
    avgPerDay: +(commits.length / 30).toFixed(1),
    totalCommits: commits.length,
  };
};

// ── Prompt Builders ───────────────────────────────────────────────────────────

const buildFullAnalysisPrompt = ({
  commits, pullRequests, issues, repositories, username,
  commitPatterns, repoStats, activityMetrics,
}) => {
  const recentCommits = commits
    .slice(0, 25)
    .map((c) => `  - [${new Date(c.date).toLocaleDateString()}] ${c.message.slice(0, 80)}`)
    .join('\n');

  const languageBreakdown = repositories
    .filter((r) => r.language)
    .reduce((acc, r) => { acc[r.language] = (acc[r.language] || 0) + 1; return acc; }, {});

  const topLanguages = Object.entries(languageBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang, count]) => `${lang} (${count} repos)`)
    .join(', ');

  return `
You are an expert software engineering productivity analyst. Analyze the following developer's GitHub data comprehensively.

=== DEVELOPER: ${username} | PERIOD: Last 30 days ===

--- COMMITS (${commits.length} total) ---
Recent Commits:
${recentCommits || '  No commits in this period.'}

Commit Patterns:
  By Day: ${JSON.stringify(commitPatterns.byDay)}
  By Time: ${JSON.stringify(commitPatterns.byHour)}
  Peak Day: ${commitPatterns.peakDay}, Peak Time: ${commitPatterns.peakTime}

--- REPOSITORIES (${repositories.length} total) ---
Top Repos (by activity):
${repoStats.slice(0, 5).map((r) => `  - ${r.name} [${r.language}] ${r.commits} commits, ${r.stars}⭐, ${r.openIssues} open issues`).join('\n')}
Languages: ${topLanguages || 'N/A'}

--- PULL REQUESTS (${pullRequests.length} total) ---
  Open: ${pullRequests.filter((p) => p.state === 'open').length}
  Merged: ${pullRequests.filter((p) => p.state === 'merged').length}
  Closed: ${pullRequests.filter((p) => p.state === 'closed').length}

--- ISSUES (${issues.length} total) ---
  Open: ${issues.filter((i) => i.state === 'open').length}
  Closed: ${issues.filter((i) => i.state === 'closed').length}

--- ACTIVITY METRICS ---
  Current Streak: ${activityMetrics.currentStreak} days
  Longest Streak: ${activityMetrics.longestStreak} days
  Active Days (30d): ${activityMetrics.activeDays}
  Avg Commits/Day: ${activityMetrics.avgPerDay}

Respond with a valid JSON object with EXACTLY this structure:
{
  "productivityScore": <number 0-100>,
  "summary": "<2-3 sentence overview>",
  "weeklyTrend": "improving|stable|declining",
  "highlights": ["<achievement1>", "<achievement2>", "<achievement3>"],

  "commitInsights": {
    "verdict": "<1 sentence assessment of commit quality and frequency>",
    "patterns": "<describe when they code most, consistency, streaks>",
    "messageQuality": "excellent|good|fair|poor",
    "suggestions": ["<specific commit tip1>", "<specific commit tip2>"]
  },

  "repositoryInsights": {
    "verdict": "<1 sentence on repo health and diversity>",
    "mostActiveRepo": "<repo name>",
    "languageDiversity": "high|medium|low",
    "suggestions": ["<repo management tip1>", "<repo management tip2>"]
  },

  "codingActivityInsights": {
    "verdict": "<1 sentence on overall coding activity>",
    "peakProductivityTime": "<when they are most active>",
    "consistencyScore": <number 0-100>,
    "burnoutRisk": "high|medium|low",
    "suggestions": ["<activity tip1>", "<activity tip2>"]
  },

  "productivityPatterns": {
    "verdict": "<1 sentence pattern summary>",
    "workStyle": "consistent|burst|weekend-warrior|night-owl|early-bird",
    "prHealthScore": <number 0-100>,
    "issueResolutionRate": <number 0-100>,
    "suggestions": ["<pattern tip1>", "<pattern tip2>"]
  },

  "recommendations": [
    {
      "type": "task|bottleneck|improvement",
      "title": "<title>",
      "description": "<actionable description>",
      "priority": "low|medium|high",
      "category": "commits|repositories|activity|patterns"
    }
  ],

  "bottlenecks": ["<bottleneck1>", "<bottleneck2>"],
  "strengths": ["<strength1>", "<strength2>", "<strength3>"]
}`;
};

// ── Main Export Functions ─────────────────────────────────────────────────────

/**
 * Generate comprehensive AI developer insights.
 */
const analyzeProductivity = async ({ commits, pullRequests, issues, repositories = [], username, dateRange }) => {
  const model = getModel(true);

  // Compute derived metrics
  const commitPatterns   = computeCommitPatterns(commits);
  const repoStats        = computeRepoStats(commits, repositories);
  const activityMetrics  = computeActivityMetrics(commits);

  const prompt = buildFullAnalysisPrompt({
    commits, pullRequests, issues, repositories,
    username, commitPatterns, repoStats, activityMetrics,
  });

  const result  = await model.generateContent(prompt);
  const rawText = result.response.text();

  let analysis;
  try {
    analysis = JSON.parse(rawText);
  } catch {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    analysis = JSON.parse(cleaned);
  }

  return {
    ...analysis,
    // Attach computed client-side metrics
    commitPatterns,
    repoStats,
    activityMetrics,
    tokensUsed: result.response.usageMetadata?.totalTokenCount || null,
    aiModel: 'gemini-1.5-flash',
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Generate a sprint summary (plain text, lighter call).
 */
const generateSprintSummary = async (commits, username) => {
  const model = getGeminiClient().getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
  });

  const commitList = commits
    .slice(0, 20)
    .map((c) => `- ${c.message.slice(0, 100)}`)
    .join('\n');

  const prompt = `You are a senior engineering manager writing a sprint retrospective summary.
Summarize the following commits by "${username}" in 4-5 professional bullet points.
Be specific, technical, and concise. Focus on what was actually accomplished.

Commits:
${commitList}

Format: Use • bullet points, no markdown headers.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

module.exports = { analyzeProductivity, generateSprintSummary };
