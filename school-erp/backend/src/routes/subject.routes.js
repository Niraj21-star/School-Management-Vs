const express = require('express');

const {
  createSubject,
  getSubjectsByClass,
  updateSubject,
  deleteSubject,
} = require('../controllers/subject.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', allowRoles('admin', 'clerk', 'teacher'), getSubjectsByClass);
router.post('/', allowRoles('admin'), createSubject);
router.put('/:id', allowRoles('admin'), updateSubject);
router.delete('/:id', allowRoles('admin'), deleteSubject);

module.exports = router;