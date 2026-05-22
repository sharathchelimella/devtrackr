/**
 * services/githubService.js – GitHub REST API Integration Service
 * All GitHub API communication is centralized here.
 */

const axios = require('axios');
const { getOrSet } = require('../utils/cache');

const GITHUB_API = 'https://api.github.com';

/**
 * Create an authenticated axios instance for GitHub API.
 * @param {string} token - Personal Access Token
 */
const createGithubClient = (token) =>
  axios.create({
    baseURL: GITHUB_API,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    timeout: 10000,
  });

/**
 * Validate a GitHub PAT and fetch the authenticated user's profile.
 * @param {string} token
 * @returns {Promise<Object>} GitHub user object
 */
const validateTokenAndGetUser = async (token) => {
  const client = createGithubClient(token);
  const { data } = await client.get('/user');
  return data;
};

/**
 * Fetch all repositories for the authenticated user (up to 100).
 * @param {string} token
 * @param {string} username
 * @returns {Promise<Array>}
 */
const fetchRepositories = async (token, username) => {
  return getOrSet(`repos:${username}`, async () => {
    const client = createGithubClient(token);
    const { data } = await client.get('/user/repos', {
      params: {
        visibility: 'all',
        affiliation: 'owner,collaborator',
        sort: 'updated',
        per_page: 100,
      },
    });

    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      isPrivate: repo.private,
      url: repo.html_url,
      updatedAt: repo.updated_at,
    }));
  });
};

/**
 * Fetch commits from a repository within the last 30 days.
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} username - Filter by committer
 * @returns {Promise<Array>}
 */
const fetchCommits = async (token, owner, repo, username) => {
  const since = new Date();
  since.setDate(since.getDate() - 30); // Last 30 days

  return getOrSet(`commits:${owner}:${repo}`, async () => {
    const client = createGithubClient(token);
    try {
      const { data } = await client.get(`/repos/${owner}/${repo}/commits`, {
        params: {
          author: username,
          since: since.toISOString(),
          per_page: 100,
        },
      });

      return data.map((c) => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author?.name || username,
        date: c.commit.author?.date,
        url: c.html_url,
      }));
    } catch (err) {
      // Some repos may be inaccessible; return empty
      if (err.response?.status === 409) return []; // Empty repo
      throw err;
    }
  }, 600); // Cache 10 minutes
};

/**
 * Fetch all commits across the user's top repositories (up to 5 repos).
 * @param {string} token
 * @param {string} username
 * @param {Array} repos - List of repos
 * @returns {Promise<Array>}
 */
const fetchAllCommits = async (token, username, repos) => {
  const topRepos = repos.slice(0, 5); // Limit to avoid rate limits
  const commitArrays = await Promise.allSettled(
    topRepos.map((r) => fetchCommits(token, username, r.name, username))
  );

  return commitArrays
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

/**
 * Fetch pull requests from the user's repositories.
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<Array>}
 */
const fetchPullRequests = async (token, owner, repo) => {
  return getOrSet(`prs:${owner}:${repo}`, async () => {
    const client = createGithubClient(token);
    try {
      const [openRes, closedRes] = await Promise.all([
        client.get(`/repos/${owner}/${repo}/pulls`, {
          params: { state: 'open', per_page: 50 },
        }),
        client.get(`/repos/${owner}/${repo}/pulls`, {
          params: { state: 'closed', per_page: 50 },
        }),
      ]);

      const mapPR = (pr, state) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state: pr.merged_at ? 'merged' : state,
        author: pr.user?.login,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        mergedAt: pr.merged_at,
        url: pr.html_url,
      });

      return [
        ...openRes.data.map((pr) => mapPR(pr, 'open')),
        ...closedRes.data.map((pr) => mapPR(pr, 'closed')),
      ];
    } catch (err) {
      return [];
    }
  }, 600);
};

/**
 * Fetch issues from a repository.
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<Array>}
 */
const fetchIssues = async (token, owner, repo) => {
  return getOrSet(`issues:${owner}:${repo}`, async () => {
    const client = createGithubClient(token);
    try {
      const { data } = await client.get(`/repos/${owner}/${repo}/issues`, {
        params: { state: 'all', per_page: 100 },
      });

      // Filter out PRs (GitHub issues API includes PRs)
      return data
        .filter((item) => !item.pull_request)
        .map((issue) => ({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          state: issue.state,
          author: issue.user?.login,
          labels: issue.labels.map((l) => l.name),
          createdAt: issue.created_at,
          closedAt: issue.closed_at,
          url: issue.html_url,
        }));
    } catch (err) {
      return [];
    }
  }, 600);
};

/**
 * Compute aggregate statistics from raw GitHub data.
 * @param {Object} data - { repositories, commits, pullRequests, issues }
 * @returns {Object} stats object
 */
const computeStats = ({ repositories, commits, pullRequests, issues }) => {
  const langMap = {};
  repositories.forEach((r) => {
    if (r.language) {
      langMap[r.language] = (langMap[r.language] || 0) + 1;
    }
  });

  return {
    totalRepos: repositories.length,
    totalCommits: commits.length,
    totalPRs: pullRequests.length,
    openPRs: pullRequests.filter((p) => p.state === 'open').length,
    closedPRs: pullRequests.filter((p) => p.state !== 'open').length,
    totalIssues: issues.length,
    openIssues: issues.filter((i) => i.state === 'open').length,
    languages: Object.entries(langMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
};

module.exports = {
  validateTokenAndGetUser,
  fetchRepositories,
  fetchAllCommits,
  fetchPullRequests,
  fetchIssues,
  computeStats,
};
