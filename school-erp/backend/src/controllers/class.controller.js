const SchoolClass = require('../models/SchoolClass');
const {
  isValidObjectId,
  sendSuccess,
  sendError,
} = require('../services/academic.service');

const createClass = async (req, res) => {
  try {
    const { name, sections = [] } = req.body;

    if (!name) {
      const error = new Error('name is required');
      error.statusCode = 400;
      throw error;
    }

    const schoolClass = await SchoolClass.create({
      name: String(name).trim(),
      sections,
    });

    return sendSuccess(res, 201, 'Operation successful', schoolClass);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'Class name already exists';
    }

    return sendError(res, error);
  }
};

const getAllClasses = async (req, res) => {
  try {
    const classes = await SchoolClass.find().sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 200, 'Operation successful', classes);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid class id');
      error.statusCode = 400;
      throw error;
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.sections !== undefined) updates.sections = req.body.sections;

    const schoolClass = await SchoolClass.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!schoolClass) {
      const error = new Error('Class not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Operation successful', schoolClass);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'Class name already exists';
    }

    return sendError(res, error);
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid class id');
      error.statusCode = 400;
      throw error;
    }

    const schoolClass = await SchoolClass.findByIdAndDelete(id);
    if (!schoolClass) {
      const error = new Error('Class not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Operation successful', schoolClass);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createClass,
  getAllClasses,
  updateClass,
  deleteClass,
};