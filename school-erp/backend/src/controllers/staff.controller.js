const mongoose = require('mongoose');
const { User, USER_ROLES } = require('../models/User');
const {
  sanitizeStaff,
  buildStaffFilter,
  buildListOptions,
} = require('../services/staff.service');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const sendSuccess = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    data: null,
  });
};

const resolveStaffById = async (id) => {
  if (!isValidObjectId(id)) {
    const error = new Error('Invalid staff id');
    error.statusCode = 400;
    throw error;
  }

  const staff = await User.findById(id);
  if (!staff) {
    const error = new Error('Staff not found');
    error.statusCode = 404;
    throw error;
  }

  return staff;
};

const getAllStaff = async (req, res) => {
  try {
    const filters = buildStaffFilter(req.query);
    const options = buildListOptions(req.query);

    const [staffList, total, roleSummaryAggregation] = await Promise.all([
      User.find(filters)
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      User.countDocuments(filters),
      User.aggregate([
        { $match: { role: { $in: USER_ROLES }, status: filters.status || 'active' } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);

    const roleSummary = USER_ROLES.reduce((accumulator, role) => {
      accumulator[role] = 0;
      return accumulator;
    }, {});

    roleSummaryAggregation.forEach((item) => {
      roleSummary[item._id] = item.count;
    });

    const staff = staffList.map(sanitizeStaff);

    return sendSuccess(res, 200, 'Staff fetched successfully', {
      staff,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
      roleSummary,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const createStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      contact = '',
      subject = '',
      assignedClasses = [],
    } = req.body;

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

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail }).select('_id');

    if (existing) {
      const error = new Error('Email is already registered');
      error.statusCode = 409;
      throw error;
    }

    const staff = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: String(password),
      role,
      contact: String(contact || '').trim(),
      subject: String(subject || '').trim(),
      assignedClasses: Array.isArray(assignedClasses)
        ? assignedClasses.map((item) => String(item).trim()).filter(Boolean)
        : [],
    });

    return sendSuccess(res, 201, 'Staff created successfully', sanitizeStaff(staff));
  } catch (error) {
    return sendError(res, error);
  }
};

const getStaffById = async (req, res) => {
  try {
    const staff = await resolveStaffById(req.params.id);
    return sendSuccess(res, 200, 'Staff fetched successfully', sanitizeStaff(staff));
  } catch (error) {
    return sendError(res, error);
  }
};

const updateStaff = async (req, res) => {
  try {
    const staff = await resolveStaffById(req.params.id);

    const { name, role, contact, subject, assignedClasses } = req.body;

    if (name !== undefined) {
      staff.name = String(name).trim();
    }

    if (contact !== undefined) {
      staff.contact = String(contact).trim();
    }

    if (subject !== undefined) {
      staff.subject = String(subject).trim();
    }

    if (assignedClasses !== undefined) {
      if (!Array.isArray(assignedClasses)) {
        const error = new Error('assignedClasses must be an array');
        error.statusCode = 400;
        throw error;
      }

      staff.assignedClasses = assignedClasses
        .map((item) => String(item).trim())
        .filter(Boolean);
    }

    if (role !== undefined) {
      if (req.user.role !== 'admin') {
        const error = new Error('Only admin can update staff role');
        error.statusCode = 403;
        throw error;
      }

      if (!USER_ROLES.includes(role)) {
        const error = new Error(`role must be one of: ${USER_ROLES.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }

      staff.role = role;
    }

    await staff.save();

    return sendSuccess(res, 200, 'Staff updated successfully', sanitizeStaff(staff));
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteStaff = async (req, res) => {
  try {
    const staff = await resolveStaffById(req.params.id);

    if (staff.role === 'admin' && String(staff._id) === String(req.user._id)) {
      const error = new Error('Admin cannot deactivate own account');
      error.statusCode = 400;
      throw error;
    }

    staff.status = 'inactive';
    await staff.save();

    return sendSuccess(res, 200, 'Staff deactivated successfully', sanitizeStaff(staff));
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
};
