const asyncHandler = require('../utils/asyncHandler');
const {
  USER_ROLES,
  registerUser: registerUserService,
  loginUser: loginUserService,
  sanitizeUser,
} = require('../services/auth.service');

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    const error = new Error('name, email, password and role are required');
    error.statusCode = 400;
    throw error;
  }

  if (!USER_ROLES.includes(role)) {
    const error = new Error(`role must be one of: ${USER_ROLES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const authData = await registerUserService({ name, email, password, role });

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: authData,
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error('email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const authData = await loginUserService({ email, password });

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: authData,
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Current user fetched successfully',
    data: {
      user: sanitizeUser(req.user),
    },
  });
});

const getAdminSample = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Admin-only route accessed',
    data: {
      resource: 'This is a protected admin resource',
    },
  });
});

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  getAdminSample,
};
