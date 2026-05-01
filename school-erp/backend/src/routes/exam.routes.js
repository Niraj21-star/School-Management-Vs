const express = require('express');

const {
  getAllExams,
  createExam,
  updateExam,
  deleteExam,
} = require('../controllers/exam.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', allowRoles('admin', 'clerk', 'teacher'), getAllExams);
router.post('/', allowRoles('admin'), createExam);
router.put('/:id', allowRoles('admin'), updateExam);
router.delete('/:id', allowRoles('admin'), deleteExam);

module.exports = router;
