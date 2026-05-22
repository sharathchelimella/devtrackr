/**
 * controllers/taskController.js – Team Tasks & Project Board Controller
 */

const Task = require('../models/Task');
const Team = require('../models/Team');
const asyncHandler = require('../utils/asyncHandler');

// Helper to check if user is a member of the team
const checkTeamMembership = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) return false;
  return team.members.some((m) => m.user.toString() === userId.toString());
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { team, title, description, status, priority, assignee, githubIssue, dueDate } = req.body;

  if (!team || !title) {
    res.status(400);
    throw new Error('Please provide team ID and task title');
  }

  // Check if current user is a member of the team
  const isMember = await checkTeamMembership(team, req.user._id);
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to create tasks for this team');
  }

  const task = await Task.create({
    team,
    title,
    description,
    status: status || 'todo',
    priority: priority || 'medium',
    assignee: assignee || undefined,
    reporter: req.user._id,
    githubIssue: githubIssue || undefined,
    dueDate: dueDate || undefined,
  });

  const populatedTask = await Task.findById(task._id)
    .populate('assignee', 'name email github.avatarUrl')
    .populate('reporter', 'name email github.avatarUrl');

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    task: populatedTask,
  });
});

// @desc    Get all tasks for a specific team
// @route   GET /api/tasks/team/:teamId
// @access  Private
const getTasksForTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  // Check membership
  const isMember = await checkTeamMembership(teamId, req.user._id);
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to view tasks for this team');
  }

  const tasks = await Task.find({ team: teamId })
    .populate('assignee', 'name email github.username github.avatarUrl')
    .populate('reporter', 'name email github.username github.avatarUrl')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    tasks,
  });
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, assignee, githubIssue, dueDate } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check membership
  const isMember = await checkTeamMembership(task.team, req.user._id);
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to update tasks for this team');
  }

  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (status) task.status = status;
  if (priority) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (githubIssue !== undefined) task.githubIssue = githubIssue;
  
  // Handing assignee removal
  if (assignee === null || assignee === '') {
    task.assignee = undefined;
  } else if (assignee) {
    task.assignee = assignee;
  }

  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('assignee', 'name email github.username github.avatarUrl')
    .populate('reporter', 'name email github.username github.avatarUrl');

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    task: populatedTask,
  });
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check membership
  const isMember = await checkTeamMembership(task.team, req.user._id);
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to delete tasks for this team');
  }

  await Task.deleteOne({ _id: task._id });

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  });
});

module.exports = {
  createTask,
  getTasksForTeam,
  updateTask,
  deleteTask,
};
