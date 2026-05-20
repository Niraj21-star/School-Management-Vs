const express = require('express');

const {
  getAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} = require('../controllers/notice.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', allowRoles('clerk', 'teacher'), getAllNotices);
router.post('/', allowRoles(), createNotice);
router.patch('/:id', allowRoles(), updateNotice);
router.delete('/:id', allowRoles(), deleteNotice);

module.exports = router;
