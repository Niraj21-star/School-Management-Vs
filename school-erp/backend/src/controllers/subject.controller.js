const Subject = require('../models/Subject');
const {
  isValidObjectId,
  sendSuccess,
  sendError,
  ensureClassExists,
} = require('../services/academic.service');

const createSubject = async (req, res) => {
  try {
    const { name, classId } = req.body;

    if (!name || !classId) {
      const error = new Error('name and classId are required');
      error.statusCode = 400;
      throw error;
    }

    if (!isValidObjectId(classId)) {
      const error = new Error('Invalid classId');
      error.statusCode = 400;
      throw error;
    }

    await ensureClassExists(classId);

    const subject = await Subject.create({
      name: String(name).trim(),
      classId,
    });

    return sendSuccess(res, 201, 'Operation successful', subject);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'Subject already exists for this class';
    }

    return sendError(res, error);
  }
};

const getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.query;
    const filter = {};

    if (classId) {
      if (!isValidObjectId(classId)) {
        const error = new Error('Invalid classId');
        error.statusCode = 400;
        throw error;
      }

      filter.classId = classId;
    }

    const subjects = await Subject.find(filter)
      .populate('classId', 'name sections')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'Operation successful', subjects);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid subject id');
      error.statusCode = 400;
      throw error;
    }

    const updates = {};

    if (req.body.name !== undefined) {
      updates.name = String(req.body.name).trim();
    }

    if (req.body.classId !== undefined) {
      if (!isValidObjectId(req.body.classId)) {
        const error = new Error('Invalid classId');
        error.statusCode = 400;
        throw error;
      }

      await ensureClassExists(req.body.classId);
      updates.classId = req.body.classId;
    }

    const subject = await Subject.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      const error = new Error('Subject not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Operation successful', subject);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'Subject already exists for this class';
    }

    return sendError(res, error);
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid subject id');
      error.statusCode = 400;
      throw error;
    }

    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) {
      const error = new Error('Subject not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Operation successful', subject);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createSubject,
  getSubjectsByClass,
  updateSubject,
  deleteSubject,
};