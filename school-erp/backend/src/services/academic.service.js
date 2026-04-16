const mongoose = require('mongoose');
const { User } = require('../models/User');
const SchoolClass = require('../models/SchoolClass');
const Subject = require('../models/Subject');

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

const ensureClassExists = async (classId) => {
  const schoolClass = await SchoolClass.findById(classId);
  if (!schoolClass) {
    const error = new Error('Class not found');
    error.statusCode = 404;
    throw error;
  }

  return schoolClass;
};

const ensureSubjectExists = async (subjectId) => {
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    const error = new Error('Subject not found');
    error.statusCode = 404;
    throw error;
  }

  return subject;
};

const ensureTeacherExists = async (teacherId) => {
  const teacher = await User.findById(teacherId);
  if (!teacher) {
    const error = new Error('Teacher not found');
    error.statusCode = 404;
    throw error;
  }

  if (teacher.role !== 'teacher') {
    const error = new Error('teacherId must belong to a teacher user');
    error.statusCode = 400;
    throw error;
  }

  return teacher;
};

module.exports = {
  isValidObjectId,
  sendSuccess,
  sendError,
  ensureClassExists,
  ensureSubjectExists,
  ensureTeacherExists,
};