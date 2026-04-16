const express = require('express');

const {
  getAllExams,
  createExam,
} = require('../controllers/exam.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', allowRoles('admin', 'clerk', 'teacher'), getAllExams);
router.post('/', allowRoles('admin'), createExam);

module.exports = router;
