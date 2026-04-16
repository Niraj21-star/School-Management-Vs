const express = require('express');

const {
  assignTeacher,
  getAssignments,
  getTeacherAssignments,
} = require('../controllers/assignment.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', allowRoles('admin', 'clerk'), getAssignments);
router.get('/teacher/:teacherId', allowRoles('admin', 'clerk', 'teacher'), getTeacherAssignments);
router.get('/teacher', allowRoles('teacher'), getTeacherAssignments);
router.post('/', allowRoles('admin'), assignTeacher);

module.exports = router;