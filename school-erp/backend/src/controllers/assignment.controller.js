const Assignment = require('../models/Assignment');
const {
  isValidObjectId,
  sendSuccess,
  sendError,
  ensureClassExists,
  ensureSubjectExists,
  ensureTeacherExists,
} = require('../services/academic.service');

const assignTeacher = async (req, res) => {
  try {
    const { teacherId, classId, subjectId } = req.body;

    if (!teacherId || !classId || !subjectId) {
      const error = new Error('teacherId, classId and subjectId are required');
      error.statusCode = 400;
      throw error;
    }

    if (!isValidObjectId(teacherId) || !isValidObjectId(classId) || !isValidObjectId(subjectId)) {
      const error = new Error('teacherId, classId and subjectId must be valid ids');
      error.statusCode = 400;
      throw error;
    }

    await ensureTeacherExists(teacherId);
    await ensureClassExists(classId);
    await ensureSubjectExists(subjectId);

    const assignment = await Assignment.create({ teacherId, classId, subjectId });
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('teacherId', 'name email role')
      .populate('classId', 'name sections')
      .populate('subjectId', 'name');

    return sendSuccess(res, 201, 'Operation successful', populatedAssignment);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'Duplicate teacher assignment';
    }

    return sendError(res, error);
  }
};

const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('teacherId', 'name email role')
      .populate('classId', 'name sections')
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'Operation successful', assignments);
  } catch (error) {
    return sendError(res, error);
  }
};

const getTeacherAssignments = async (req, res) => {
  try {
    const teacherId = req.params.teacherId || req.user._id.toString();

    if (!isValidObjectId(teacherId)) {
      const error = new Error('Invalid teacher id');
      error.statusCode = 400;
      throw error;
    }

    // Teacher can only fetch own assignments.
    if (req.user.role === 'teacher' && String(req.user._id) !== String(teacherId)) {
      const error = new Error('Teachers can only view their own assignments');
      error.statusCode = 403;
      throw error;
    }

    const assignments = await Assignment.find({ teacherId })
      .populate('teacherId', 'name email role')
      .populate('classId', 'name sections')
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'Operation successful', assignments);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  assignTeacher,
  getAssignments,
  getTeacherAssignments,
};