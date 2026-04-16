const { USER_ROLES, USER_STATUSES } = require('../models/User');

const sanitizeStaff = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  contact: user.contact || '',
  subject: user.subject || '',
  assignedClasses: Array.isArray(user.assignedClasses) ? user.assignedClasses : [],
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const buildStaffFilter = (query) => {
  const filter = { role: { $in: USER_ROLES } };

  if (query.role) {
    if (!USER_ROLES.includes(query.role)) {
      const error = new Error(`role must be one of: ${USER_ROLES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    filter.role = query.role;
  }

  if (query.status) {
    if (!USER_STATUSES.includes(query.status)) {
      const error = new Error(`status must be one of: ${USER_STATUSES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    filter.status = query.status;
  } else {
    filter.status = 'active';
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { contact: searchRegex },
    ];
  }

  return filter;
};

const buildListOptions = (query) => {
  const page = Math.max(Number.parseInt(query.page || '1', 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit || '10', 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'email', 'role'];
  const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  return {
    page,
    limit,
    skip,
    sort: { [sortBy]: sortOrder },
  };
};

module.exports = {
  sanitizeStaff,
  buildStaffFilter,
  buildListOptions,
};