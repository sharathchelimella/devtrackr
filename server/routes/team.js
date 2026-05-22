/**
 * routes/team.js – Team Collaboration Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/teamController');

// All team routes require authentication
router.use(protect);

router.post('/', createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

// Member endpoints
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/members/:userId', updateMemberRole);

module.exports = router;
