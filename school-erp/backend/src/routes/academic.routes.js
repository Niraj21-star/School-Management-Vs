const express = require('express');

const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/academic.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/classes', allowRoles('admin', 'clerk', 'teacher'), getAllClasses);
router.get('/classes/:id', allowRoles('admin', 'clerk', 'teacher'), getClassById);
router.post('/classes', allowRoles('admin'), createClass);
router.patch('/classes/:id', allowRoles('admin'), updateClass);
router.delete('/classes/:id', allowRoles('admin'), deleteClass);

router.get('/subjects', allowRoles('admin', 'clerk', 'teacher'), getAllSubjects);
router.get('/subjects/:id', allowRoles('admin', 'clerk', 'teacher'), getSubjectById);
router.post('/subjects', allowRoles('admin'), createSubject);
router.patch('/subjects/:id', allowRoles('admin'), updateSubject);
router.delete('/subjects/:id', allowRoles('admin'), deleteSubject);

router.get('/assignments', allowRoles('admin', 'clerk', 'teacher'), getAllAssignments);
router.get('/assignments/:id', allowRoles('admin', 'clerk', 'teacher'), getAssignmentById);
router.post('/assignments', allowRoles('admin'), createAssignment);
router.patch('/assignments/:id', allowRoles('admin'), updateAssignment);
router.delete('/assignments/:id', allowRoles('admin'), deleteAssignment);

module.exports = router;