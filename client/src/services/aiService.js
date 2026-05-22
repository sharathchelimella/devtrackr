// services/aiService.js – AI API calls from the frontend

import api from './api';

export const aiService = {
  // Generate full productivity analysis
  analyze: (reportType = 'weekly') =>
    api.post('/api/ai/analyze', { reportType }),

  // Get short sprint summary
  getSprintSummary: () =>
    api.get('/api/ai/sprint-summary'),

  // Get all past reports
  getReports: (page = 1) =>
    api.get(`/api/ai/reports?page=${page}`),

  // Get specific report
  getReport: (id) =>
    api.get(`/api/ai/reports/${id}`),
};
