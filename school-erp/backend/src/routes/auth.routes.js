const express = require('express');

const {
  registerUser,
  loginUser,
  getCurrentUser,
  getAdminSample,
} = require('../controllers/auth.controller');
const { verifyToken, allowRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', verifyToken, allowRoles('admin'), registerUser);
router.post('/login', loginUser);

// Sample protected routes using JWT + RBAC middleware.
router.get('/me', verifyToken, allowRoles('admin', 'clerk', 'teacher'), getCurrentUser);
router.get('/admin-sample', verifyToken, allowRoles('admin'), getAdminSample);

module.exports = router;
