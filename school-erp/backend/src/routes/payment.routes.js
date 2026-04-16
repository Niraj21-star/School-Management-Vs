const express = require('express');

const { recordPayment } = require('../controllers/fee.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.post('/', allowRoles('admin', 'clerk'), recordPayment);

module.exports = router;