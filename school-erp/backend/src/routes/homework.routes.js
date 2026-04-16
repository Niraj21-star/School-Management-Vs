const express = require('express');

const {
  getHomeworkList,
  createHomework,
  deleteHomework,
} = require('../controllers/homework.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', allowRoles('admin', 'teacher'), getHomeworkList);
router.post('/', allowRoles('admin', 'teacher'), createHomework);
router.delete('/:id', allowRoles('admin', 'teacher'), deleteHomework);

module.exports = router;
