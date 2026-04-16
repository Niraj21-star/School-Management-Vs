const mongoose = require('mongoose');
const { User } = require('../models/User');
const SchoolClass = require('../models/SchoolClass');
const Subject = require('../models/Subject');
const Assignment = require('../models/Assignment');


const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const handleError = (res, error) => {
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
    const error = new Error('teacherId must reference a user with teacher role');
    error.statusCode = 400;
    throw error;
  }

  return teacher;
};

const createClass = async (req, res) => {
  try {
    const { name, sections } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required', data: null });
    }

    const schoolClass = await SchoolClass.create({ name: name.trim(), sections: sections || [] });

    return res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: { class: schoolClass },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getAllClasses = async (req, res) => {
  try {
    const classes = await SchoolClass.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Classes fetched successfully',
      data: { classes },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid class id', data: null });
    }

    const schoolClass = await SchoolClass.findById(id);
    if (!schoolClass) {
      return res.status(404).json({ success: false, message: 'Class not found', data: null });
    }

    return res.status(200).json({
      success: true,
      message: 'Class fetched successfully',
      data: { class: schoolClass },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid class id', data: null });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.sections !== undefined) updates.sections = req.body.sections;

    const schoolClass = await SchoolClass.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!schoolClass) {
      return res.status(404).json({ success: false, message: 'Class not found', data: null });
    }

    return res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: { class: schoolClass },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid class id', data: null });
    }

    const schoolClass = await SchoolClass.findByIdAndDelete(id);
    if (!schoolClass) {
      return res.status(404).json({ success: false, message: 'Class not found', data: null });
    }

    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
      data: { class: schoolClass },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const createSubject = async (req, res) => {
  try {
    const { name, classId } = req.body;

    if (!name || !classId) {
      return res.status(400).json({
        success: false,
        message: 'name and classId are required',
        data: null,
      });
    }

    if (!isValidObjectId(classId)) {
      return res.status(400).json({ success: false, message: 'Invalid classId', data: null });
    }

    await ensureClassExists(classId);

    const subject = await Subject.create({ name: name.trim(), classId });

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: { subject },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getAllSubjects = async (req, res) => {
  try {
    const { classId } = req.query;
    const filter = {};

    if (classId) {
      if (!isValidObjectId(classId)) {
        return res.status(400).json({ success: false, message: 'Invalid classId', data: null });
      }

      filter.classId = classId;
    }

    const subjects = await Subject.find(filter).populate('classId').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Subjects fetched successfully',
      data: { subjects },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subject id', data: null });
    }

    const subject = await Subject.findById(id).populate('classId');
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found', data: null });
    }

    return res.status(200).json({
      success: true,
      message: 'Subject fetched successfully',
      data: { subject },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subject id', data: null });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.classId !== undefined) {
      if (!isValidObjectId(req.body.classId)) {
        return res.status(400).json({ success: false, message: 'Invalid classId', data: null });
      }

      await ensureClassExists(req.body.classId);
      updates.classId = req.body.classId;
    }

    const subject = await Subject.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found', data: null });
    }

    return res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: { subject },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subject id', data: null });
    }

    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found', data: null });
    }

    return res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
      data: { subject },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const createAssignment = async (req, res) => {
  try {
    const { teacherId, classId, subjectId } = req.body;

    if (!teacherId || !classId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'teacherId, classId and subjectId are required',
        data: null,
      });
    }

    if (!isValidObjectId(teacherId) || !isValidObjectId(classId) || !isValidObjectId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: 'teacherId, classId and subjectId must be valid ids',
        data: null,
      });
    }

    await ensureTeacherExists(teacherId);
    await ensureClassExists(classId);
    await ensureSubjectExists(subjectId);

    const assignment = await Assignment.create({ teacherId, classId, subjectId });

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('teacherId', 'name email role')
      .populate('classId')
      .populate('subjectId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Assignments fetched successfully',
      data: { assignments },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment id', data: null });
    }

    const assignment = await Assignment.findById(id)
      .populate('teacherId', 'name email role')
      .populate('classId')
      .populate('subjectId');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found', data: null });
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment fetched successfully',
      data: { assignment },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment id', data: null });
    }

    const updates = {};

    if (req.body.teacherId !== undefined) {
      if (!isValidObjectId(req.body.teacherId)) {
        return res.status(400).json({ success: false, message: 'Invalid teacherId', data: null });
      }

      await ensureTeacherExists(req.body.teacherId);
      updates.teacherId = req.body.teacherId;
    }

    if (req.body.classId !== undefined) {
      if (!isValidObjectId(req.body.classId)) {
        return res.status(400).json({ success: false, message: 'Invalid classId', data: null });
      }

      await ensureClassExists(req.body.classId);
      updates.classId = req.body.classId;
    }

    if (req.body.subjectId !== undefined) {
      if (!isValidObjectId(req.body.subjectId)) {
        return res.status(400).json({ success: false, message: 'Invalid subjectId', data: null });
      }

      await ensureSubjectExists(req.body.subjectId);
      updates.subjectId = req.body.subjectId;
    }

    const assignment = await Assignment.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('teacherId', 'name email role')
      .populate('classId')
      .populate('subjectId');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found', data: null });
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: { assignment },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment id', data: null });
    }

    const assignment = await Assignment.findByIdAndDelete(id)
      .populate('teacherId', 'name email role')
      .populate('classId')
      .populate('subjectId');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found', data: null });
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
      data: { assignment },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};