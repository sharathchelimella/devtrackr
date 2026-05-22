// services/taskService.js – Task Board API Service

import api from './api';

export const taskService = {
  // Create a new task
  createTask: (taskData) =>
    api.post('/api/tasks', taskData),

  // Get all tasks for a specific team
  getTasksForTeam: (teamId) =>
    api.get(`/api/tasks/team/${teamId}`),

  // Update an existing task (e.g. status, assignee, priority, title, description)
  updateTask: (id, taskData) =>
    api.put(`/api/tasks/${id}`, taskData),

  // Delete a task
  deleteTask: (id) =>
    api.delete(`/api/tasks/${id}`),
};
