const jwt = require('jsonwebtoken');
const { User, USER_ROLES } = require('../models/User');

const buildAuthToken = (userId, role) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is missing in environment variables');
  }

  return jwt.sign(
    {
      sub: userId,
      role,
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    }
  );
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  contact: user.contact,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const registerUser = async ({ name, email, password, role }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role,
  });

  const token = buildAuthToken(user._id.toString(), user.role);

  return {
    token,
    user: sanitizeUser(user),
  };
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = buildAuthToken(user._id.toString(), user.role);

  return {
    token,
    user: sanitizeUser(user),
  };
};

module.exports = {
  USER_ROLES,
  registerUser,
  loginUser,
  sanitizeUser,
};
