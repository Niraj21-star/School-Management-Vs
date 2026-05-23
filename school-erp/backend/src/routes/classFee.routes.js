const express = require('express');
const {
  getAllClassFees,
  getClassFeeByPattern,
  upsertClassFee,
  deleteClassFee,
} = require('../controllers/classFee.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Require authenticated user
router.use(verifyToken);

// GET routes are allowed for both clerk and admin to fetch fee structures during collection/management
router.get('/', allowRoles('admin', 'clerk'), getAllClassFees);
router.get('/:classPattern', allowRoles('admin', 'clerk'), getClassFeeByPattern);

// Creation, editing, and deletion are restricted strictly to admin
router.post('/', allowRoles('admin'), upsertClassFee);
router.delete('/:id', allowRoles('admin'), deleteClassFee);

module.exports = router;
