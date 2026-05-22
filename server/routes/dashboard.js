/**
 * routes/dashboard.js – Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDashboardSummary } = require('../controllers/dashboardController');

router.use(protect);

router.get('/summary', getDashboardSummary);

module.exports = router;
