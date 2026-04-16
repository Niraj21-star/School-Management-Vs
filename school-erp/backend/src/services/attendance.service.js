const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const SchoolClass = require('../models/SchoolClass');
const { Student } = require('../models/Student');

const ATTENDANCE_STATUSES = ['present', 'absent', 'leave'];

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const ensureClassAndSection = async (classId, section) => {
  const schoolClass = await SchoolClass.findById(classId).lean();

  if (!schoolClass) {
    const error = new Error('Class not found');
    error.statusCode = 404;
    throw error;
  }

  const normalizedSection = String(section).trim();
  const hasSection = Array.isArray(schoolClass.sections)
    && schoolClass.sections.some((item) => item.trim() === normalizedSection);

  if (!hasSection) {
    const error = new Error('Section does not belong to the selected class');
    error.statusCode = 400;
    throw error;
  }

  return {
    schoolClass,
    normalizedSection,
  };
};

const ensureTeacherAssignment = async (teacherId, classId) => {
  const assignmentExists = await Assignment.exists({ teacherId, classId });

  if (!assignmentExists) {
    const error = new Error('Teacher is not assigned to this class');
    error.statusCode = 403;
    throw error;
  }
};

const normalizeStudentsInput = async ({
  students,
  markAllPresent,
  className,
  section,
}) => {
  if (markAllPresent === true) {
    const classStudents = await Student.find({
      'academic.class': className,
      'academic.section': section,
      status: 'active',
    })
      .select('_id')
      .lean();

    if (classStudents.length === 0) {
      const error = new Error('No active students found for this class and section');
      error.statusCode = 400;
      throw error;
    }

    return classStudents.map((student) => ({
      studentId: student._id,
      status: 'present',
    }));
  }

  if (!Array.isArray(students) || students.length === 0) {
    const error = new Error('students array is required unless markAllPresent=true');
    error.statusCode = 400;
    throw error;
  }

  const duplicateGuard = new Set();
  const normalized = students.map((entry) => ({
    studentId: entry.studentId,
    status: entry.status,
  }));

  for (const entry of normalized) {
    if (!entry.studentId || !isValidObjectId(entry.studentId)) {
      const error = new Error('Each studentId must be a valid id');
      error.statusCode = 400;
      throw error;
    }

    if (!ATTENDANCE_STATUSES.includes(entry.status)) {
      const error = new Error(`status must be one of: ${ATTENDANCE_STATUSES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const key = String(entry.studentId);
    if (duplicateGuard.has(key)) {
      const error = new Error('Duplicate studentId values are not allowed in the same request');
      error.statusCode = 400;
      throw error;
    }

    duplicateGuard.add(key);
  }

  return normalized;
};

const ensureStudentsBelongToClassSection = async ({ studentEntries, className, section }) => {
  const studentIds = studentEntries.map((entry) => entry.studentId);

  const students = await Student.find({ _id: { $in: studentIds } })
    .select('_id academic.class academic.section status')
    .lean();

  if (students.length !== studentIds.length) {
    const error = new Error('One or more students were not found');
    error.statusCode = 404;
    throw error;
  }

  const invalidStudent = students.find(
    (student) => student.status !== 'active'
      || student.academic.class !== className
      || student.academic.section !== section
  );

  if (invalidStudent) {
    const error = new Error('All students must be active and belong to the selected class and section');
    error.statusCode = 400;
    throw error;
  }
};

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

module.exports = {
  ATTENDANCE_STATUSES,
  isValidObjectId,
  normalizeDate,
  ensureClassAndSection,
  ensureTeacherAssignment,
  normalizeStudentsInput,
  ensureStudentsBelongToClassSection,
  sendSuccess,
  sendError,
};