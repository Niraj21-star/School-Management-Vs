const express = require('express');

const {
  createClass,
  getAllClasses,
  updateClass,
  deleteClass,
} = require('../controllers/class.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', allowRoles('admin', 'clerk', 'teacher'), getAllClasses);
router.post('/', allowRoles('admin'), createClass);
router.put('/:id', allowRoles('admin'), updateClass);
router.delete('/:id', allowRoles('admin'), deleteClass);

module.exports = router;