/**
 * services/aiService.js – AI Productivity Analysis Service
 * Sends GitHub data to OpenAI and returns productivity insights.
 */

const OpenAI = require('openai');

let openaiClient = null;

/**
 * Lazily initialize the OpenAI client (only when first needed).
 */
const getOpenAIClient = () => {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

/**
 * Build a structured prompt for productivity analysis.
 * @param {Object} params
 * @returns {string} System + user prompt
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

Please respond with a valid JSON object with EXACTLY this structure:
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
 * Generate AI productivity analysis from GitHub data.
 * @param {Object} githubData - { commits, pullRequests, issues, username }
 * @returns {Promise<Object>} AI analysis result
 */
const analyzeProductivity = async ({ commits, pullRequests, issues, username, dateRange }) => {
  const client = getOpenAIClient();
  const prompt = buildAnalysisPrompt({ commits, pullRequests, issues, username, dateRange });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a developer productivity analyst. Always respond with valid JSON only, no markdown, no explanations outside the JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3, // Lower temperature for more consistent, factual output
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const rawContent = response.choices[0].message.content;
  const analysis = JSON.parse(rawContent);

  return {
    ...analysis,
    tokensUsed: response.usage?.total_tokens,
    aiModel: response.model,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Generate a brief sprint summary (lighter prompt, cheaper).
 * @param {Array} commits
 * @param {string} username
 * @returns {Promise<string>} Sprint summary text
 */
const generateSprintSummary = async (commits, username) => {
  const client = getOpenAIClient();

  const messages = commits
    .slice(0, 20)
    .map((c) => `- ${c.message}`)
    .join('\n');

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `Summarize the following sprint commits for developer ${username} in 3-4 bullet points. Be concise and technical:\n${messages}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 300,
  });

  return response.choices[0].message.content;
};

module.exports = { analyzeProductivity, generateSprintSummary };
