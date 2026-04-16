const express = require('express');

const {
  getMarks,
  saveMarks,
} = require('../controllers/mark.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', allowRoles('admin', 'teacher'), getMarks);
router.post('/bulk', allowRoles('admin', 'teacher'), saveMarks);

module.exports = router;
