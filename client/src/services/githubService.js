// services/githubService.js – GitHub API calls from the frontend

import api from './api';

export const githubService = {
  // Connect GitHub with PAT
  connect: (accessToken) =>
    api.post('/api/github/connect', { accessToken }),

  // Disconnect GitHub
  disconnect: () =>
    api.delete('/api/github/disconnect'),

  // Trigger full GitHub data sync
  sync: () =>
    api.post('/api/github/sync'),

  // Get all stored GitHub data
  getData: () =>
    api.get('/api/github/data'),

  // Get only repositories
  getRepos: () =>
    api.get('/api/github/repos'),

  // Get only commits
  getCommits: () =>
    api.get('/api/github/commits'),

  // Get pull requests
  getPRs: () =>
    api.get('/api/github/prs'),

  // Get issues
  getIssues: () =>
    api.get('/api/github/issues'),
};
