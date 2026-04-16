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

router.get('/', allowRoles('admin', 'clerk', 'teacher'), getAllNotices);
router.post('/', allowRoles('admin'), createNotice);
router.patch('/:id', allowRoles('admin'), updateNotice);
router.delete('/:id', allowRoles('admin'), deleteNotice);

module.exports = router;
