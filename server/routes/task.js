/**
 * routes/task.js – Task Board Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createTask,
  getTasksForTeam,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

// All task routes require authentication
router.use(protect);

router.post('/', createTask);
router.get('/team/:teamId', getTasksForTeam);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
