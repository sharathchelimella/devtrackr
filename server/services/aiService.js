/**
 * services/aiService.js – AI Productivity Analysis Service
 * Uses Google Gemini API to analyze GitHub data and return productivity insights.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let geminiClient = null;

/**
 * Lazily initialize the Gemini client (only when first needed).
 */
const getGeminiClient = () => {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
};

/**
 * Get the Gemini generative model instance.
 * Using gemini-1.5-flash – fast, cost-effective, supports JSON output.
 */
const getModel = () => {
  return getGeminiClient().getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.3,       // Low temp for consistent, factual output
      maxOutputTokens: 1500,
      responseMimeType: 'application/json', // Force JSON output from Gemini
    },
  });
};

/**
 * Build a structured prompt for productivity analysis.
 * @param {Object} params
 * @returns {string} Full prompt string
 */
const buildAnalysisPrompt = ({ commits, pullRequests, issues, username, dateRange }) => {
  const commitSummary = commits
    .slice(0, 30) // Limit to 30 commits to stay within token budget
    .map((c) => `- [${new Date(c.date).toLocaleDateString()}] ${c.message}`)
    .join('\n');

  const prSummary = `Open PRs: ${pullRequests.filter((p) => p.state === 'open').length}, Merged: ${
    pullRequests.filter((p) => p.state === 'merged').length
  }, Closed: ${pullRequests.filter((p) => p.state === 'closed').length}`;

  const issueSummary = `Open Issues: ${issues.filter((i) => i.state === 'open').length}, Closed: ${
    issues.filter((i) => i.state === 'closed').length
  }`;

  return `
You are an expert software engineering productivity analyst. Analyze the following developer activity data and provide actionable insights.

Developer: ${username}
Period: ${dateRange || 'Last 30 days'}

RECENT COMMITS (${commits.length} total):
${commitSummary || 'No commits in this period.'}

PULL REQUESTS:
${prSummary}

ISSUES:
${issueSummary}

Respond ONLY with a valid JSON object with EXACTLY this structure (no markdown, no extra text):
{
  "summary": "2-3 sentence summary of overall productivity and key achievements",
  "productivityScore": <number 0-100 based on commit frequency, PR activity, issue resolution>,
  "highlights": ["key achievement 1", "key achievement 2"],
  "recommendations": [
    {
      "type": "task|bottleneck|improvement",
      "title": "short title",
      "description": "actionable advice",
      "priority": "low|medium|high"
    }
  ],
  "bottlenecks": ["identified bottleneck 1", "identified bottleneck 2"],
  "inactiveAreas": ["area with low activity"],
  "weeklyTrend": "improving|stable|declining"
}
`;
};

/**
 * Generate AI productivity analysis from GitHub data using Gemini.
 * @param {Object} params - { commits, pullRequests, issues, username, dateRange }
 * @returns {Promise<Object>} Parsed AI analysis result
 */
const analyzeProductivity = async ({ commits, pullRequests, issues, username, dateRange }) => {
  const model = getModel();
  const prompt = buildAnalysisPrompt({ commits, pullRequests, issues, username, dateRange });

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Parse the JSON response from Gemini
  let analysis;
  try {
    analysis = JSON.parse(responseText);
  } catch {
    // Gemini sometimes wraps in markdown – strip it as fallback
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    analysis = JSON.parse(cleaned);
  }

  return {
    ...analysis,
    tokensUsed: result.response.usageMetadata?.totalTokenCount || null,
    aiModel: 'gemini-1.5-flash',
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Generate a brief sprint summary using Gemini Flash (fast & cheap).
 * @param {Array} commits
 * @param {string} username
 * @returns {Promise<string>} Sprint summary text
 */
const generateSprintSummary = async (commits, username) => {
  const model = getGeminiClient().getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 400,
    },
  });

  const messages = commits
    .slice(0, 20)
    .map((c) => `- ${c.message}`)
    .join('\n');

  const prompt = `Summarize the following sprint commits for developer "${username}" in 3-4 concise bullet points. Be technical and specific:\n\n${messages}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

module.exports = { analyzeProductivity, generateSprintSummary };
