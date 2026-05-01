const express = require('express');

const {
  markAttendance,
  getAttendanceByDate,
  getAttendanceReport,
  updateAttendance,
} = require('../controllers/attendance.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.post('/', allowRoles('admin', 'teacher'), markAttendance);
router.put('/:id', allowRoles('admin', 'teacher'), updateAttendance);
router.get('/date', allowRoles('admin', 'clerk', 'teacher'), getAttendanceByDate);
router.get('/report', allowRoles('admin', 'clerk'), getAttendanceReport);

module.exports = router;