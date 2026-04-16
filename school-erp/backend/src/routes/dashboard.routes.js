const express = require('express');

const {
  getDashboardStats,
  getRecentActivity,
} = require('../controllers/dashboard.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/stats', allowRoles('admin', 'clerk', 'teacher'), getDashboardStats);
router.get('/recent-activity', allowRoles('admin', 'clerk', 'teacher'), getRecentActivity);

module.exports = router;
