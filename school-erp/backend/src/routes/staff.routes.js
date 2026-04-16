const express = require('express');

const {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} = require('../controllers/staff.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);

router.post('/', allowRoles('admin'), createStaff);
router.get('/', allowRoles('admin', 'clerk'), getAllStaff);
router.get('/:id', allowRoles('admin', 'clerk'), getStaffById);
router.put('/:id', allowRoles('admin'), updateStaff);
router.delete('/:id', allowRoles('admin'), deleteStaff);

module.exports = router;