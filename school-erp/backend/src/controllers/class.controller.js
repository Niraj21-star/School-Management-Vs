const SchoolClass = require('../models/SchoolClass');
const { Student } = require('../models/Student');
const Assignment = require('../models/Assignment');
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
    let classes = await SchoolClass.find().sort({ createdAt: -1 }).lean();

    if (req.user && req.user.role === 'teacher') {
      const assignments = await Assignment.find({ teacherId: req.user._id }).lean();
      const assignedClassIds = new Set(assignments.map(a => String(a.classId)));
      classes = classes.filter(c => assignedClassIds.has(String(c._id)));
    }

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

    const schoolClass = await SchoolClass.findById(id);

    if (!schoolClass) {
      const error = new Error('Class not found');
      error.statusCode = 404;
      throw error;
    }

    Object.assign(schoolClass, updates);
    await schoolClass.save();



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

    const schoolClass = await SchoolClass.findById(id);
    if (!schoolClass) {
      const error = new Error('Class not found');
      error.statusCode = 404;
      throw error;
    }

    const enrolledStudents = await Student.countDocuments({ 'academic.class': schoolClass.name });
    if (enrolledStudents > 0) {
      const error = new Error(`Cannot delete class. There are ${enrolledStudents} students enrolled.`);
      error.statusCode = 400;
      throw error;
    }

    await SchoolClass.findByIdAndDelete(id);
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