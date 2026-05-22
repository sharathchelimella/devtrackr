/**
 * routes/ai.js – AI Analysis Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  analyzeProductivity,
  getSprintSummary,
  getReports,
  getReport,
} = require('../controllers/aiController');

router.use(protect);

router.post('/analyze', analyzeProductivity);
router.get('/sprint-summary', getSprintSummary);
router.get('/reports', getReports);
router.get('/reports/:id', getReport);

module.exports = router;
