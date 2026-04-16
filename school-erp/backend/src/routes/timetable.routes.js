const express = require('express');

const { getTimetable } = require('../controllers/timetable.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', allowRoles('admin', 'clerk', 'teacher'), getTimetable);

module.exports = router;
