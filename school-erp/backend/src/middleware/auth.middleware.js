const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Authorization token is missing');
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      const error = new Error('JWT_SECRET is missing in environment variables');
      error.statusCode = 500;
      throw error;
    }

    const payload = jwt.verify(token, secret);

    const user = await User.findById(payload.sub);
    if (!user) {
      const error = new Error('User not found for this token');
      error.statusCode = 401;
      throw error;
    }

    if (user.status === 'inactive') {
      const error = new Error('User account is inactive');
      error.statusCode = 401;
      throw error;
    }

    req.user = user;
    return next();
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 401;
      error.message = 'Invalid or expired token';
    }

    return next(error);
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('User context is missing. Call verifyToken first');
      error.statusCode = 500;
      return next(error);
    }

    const normalizedAllowedRoles = roles.map((role) => String(role).trim().toLowerCase());
    const normalizedUserRole = String(req.user.role || '').trim().toLowerCase();

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      const error = new Error('You do not have permission to access this resource');
      error.statusCode = 403;
      return next(error);
    }

    return next();
  };
};

module.exports = {
  verifyToken,
  allowRoles,
};
