// services/teamService.js – Team Collaboration API Service

import api from './api';

export const teamService = {
  // Create a team
  createTeam: (teamData) =>
    api.post('/api/teams', teamData),

  // Get user's teams
  getTeams: () =>
    api.get('/api/teams'),

  // Get a single team by ID
  getTeamById: (id) =>
    api.get(`/api/teams/${id}`),

  // Update team settings
  updateTeam: (id, teamData) =>
    api.put(`/api/teams/${id}`, teamData),

  // Delete a team
  deleteTeam: (id) =>
    api.delete(`/api/teams/${id}`),

  // Add member to team
  addMember: (id, userId, role) =>
    api.post(`/api/teams/${id}/members`, { userId, role }),

  // Remove member from team / Leave team
  removeMember: (id, userId) =>
    api.delete(`/api/teams/${id}/members/${userId}`),

  // Update member role (admin or member)
  updateMemberRole: (id, userId, role) =>
    api.put(`/api/teams/${id}/members/${userId}`, { role }),

  // Search users by query (email or name)
  searchUsers: (q) =>
    api.get(`/api/auth/search?q=${encodeURIComponent(q)}`),
};
