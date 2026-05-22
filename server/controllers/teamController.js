/**
 * controllers/teamController.js – Team Collaboration Controller
 */

const Team = require('../models/Team');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create a team
// @route   POST /api/teams
// @access  Private
const createTeam = asyncHandler(async (req, res) => {
  const { name, description, githubRepos } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Please provide a team name');
  }

  // Create team. Owner is the creator. Owner added to members.
  const team = await Team.create({
    name,
    description,
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'owner' }],
    githubRepos: githubRepos || [],
  });

  res.status(201).json({
    success: true,
    message: 'Team created successfully',
    team,
  });
});

// @desc    Get all teams for logged-in user
// @route   GET /api/teams
// @access  Private
const getTeams = asyncHandler(async (req, res) => {
  // Find all teams where user is in the members list
  const teams = await Team.find({
    'members.user': req.user._id,
  }).populate('owner', 'name email github.username');

  res.status(200).json({
    success: true,
    teams,
  });
});

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Private
const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('owner', 'name email github.username github.avatarUrl')
    .populate('members.user', 'name email github.username github.avatarUrl');

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Check if current user is member of the team
  const isMember = team.members.some((m) => m.user._id.toString() === req.user._id.toString());
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to view this team');
  }

  res.status(200).json({
    success: true,
    team,
  });
});

// @desc    Update team info
// @route   PUT /api/teams/:id
// @access  Private
const updateTeam = asyncHandler(async (req, res) => {
  const { name, description, githubRepos } = req.body;
  const team = await Team.findById(req.params.id);

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Verify permissions: Only owner or admin
  const userMember = team.members.find((m) => m.user.toString() === req.user._id.toString());
  if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
    res.status(403);
    throw new Error('Only team owners or admins can update team settings');
  }

  if (name) team.name = name;
  if (description !== undefined) team.description = description;
  if (githubRepos) team.githubRepos = githubRepos;

  await team.save();

  res.status(200).json({
    success: true,
    message: 'Team updated successfully',
    team,
  });
});

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private
const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Verify permissions: Only owner can delete team
  if (team.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the team owner can delete the team');
  }

  await Team.deleteOne({ _id: team._id });

  // Delete all tasks associated with this team
  const Task = require('../models/Task');
  await Task.deleteMany({ team: team._id });

  res.status(200).json({
    success: true,
    message: 'Team and its tasks deleted successfully',
  });
});

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private
const addMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  
  if (!userId) {
    res.status(400);
    throw new Error('Please specify a user to invite');
  }

  const team = await Team.findById(req.params.id);

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Check if current user is owner or admin
  const currentUserMember = team.members.find((m) => m.user.toString() === req.user._id.toString());
  if (!currentUserMember || (currentUserMember.role !== 'owner' && currentUserMember.role !== 'admin')) {
    res.status(403);
    throw new Error('Only team owners or admins can add members');
  }

  // Check if user to add is already a member
  const isAlreadyMember = team.members.some((m) => m.user.toString() === userId.toString());
  if (isAlreadyMember) {
    res.status(400);
    throw new Error('User is already a member of this team');
  }

  // Check if user to add exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Add user to team members
  team.members.push({
    user: userId,
    role: role || 'member',
    joinedAt: new Date(),
  });

  await team.save();

  // Populate newly added member details for response
  const updatedTeam = await Team.findById(team._id).populate('members.user', 'name email github.username github.avatarUrl');

  res.status(200).json({
    success: true,
    message: `Added ${user.name} to the team successfully`,
    team: updatedTeam,
  });
});

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private
const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const team = await Team.findById(req.params.id);

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  const isLeavingSelf = userId.toString() === req.user._id.toString();

  if (!isLeavingSelf) {
    const currentUserMember = team.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!currentUserMember || (currentUserMember.role !== 'owner' && currentUserMember.role !== 'admin')) {
      res.status(403);
      throw new Error('Only team owners or admins can remove members');
    }

    const targetMember = team.members.find((m) => m.user.toString() === userId.toString());
    if (targetMember && targetMember.role === 'owner') {
      res.status(400);
      throw new Error('Cannot remove the team owner');
    }
  } else {
    if (team.owner.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('The owner cannot leave the team. You must delete the team or transfer ownership.');
    }
  }

  team.members = team.members.filter((m) => m.user.toString() !== userId.toString());
  await team.save();

  // Remove assignee from tasks of this team
  const Task = require('../models/Task');
  await Task.updateMany(
    { team: team._id, assignee: userId },
    { $unset: { assignee: 1 } }
  );

  const updatedTeam = await Team.findById(team._id).populate('members.user', 'name email github.username github.avatarUrl');

  res.status(200).json({
    success: true,
    message: isLeavingSelf ? 'You left the team successfully' : 'Member removed successfully',
    team: updatedTeam,
  });
});

// @desc    Update member role
// @route   PUT /api/teams/:id/members/:userId
// @access  Private
const updateMemberRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role || !['admin', 'member'].includes(role)) {
    res.status(400);
    throw new Error('Please specify a valid role (admin or member)');
  }

  const team = await Team.findById(req.params.id);

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Verify permissions: Only team owner can change member roles
  if (team.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the team owner can change member roles');
  }

  const targetMember = team.members.find((m) => m.user.toString() === userId.toString());
  if (!targetMember) {
    res.status(404);
    throw new Error('Member not found in team');
  }

  if (targetMember.role === 'owner') {
    res.status(400);
    throw new Error('Cannot change the role of the owner');
  }

  targetMember.role = role;
  await team.save();

  const updatedTeam = await Team.findById(team._id).populate('members.user', 'name email github.username github.avatarUrl');

  res.status(200).json({
    success: true,
    message: 'Member role updated successfully',
    team: updatedTeam,
  });
});

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  updateMemberRole,
};
