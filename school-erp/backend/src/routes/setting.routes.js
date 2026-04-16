const express = require('express');

const {
  getSchoolSettings,
  updateSchoolSettings,
} = require('../controllers/setting.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', allowRoles('admin'), getSchoolSettings);
router.put('/', allowRoles('admin'), updateSchoolSettings);

module.exports = router;
