const { Student } = require('../models/Student');
const {
  isValidObjectId,
  buildStudentFilters,
  buildStudentListOptions,
  normalizeStudentPayload,
} = require('../services/student.service');

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
    message: error.message,
    data: null,
  });
};

const resolveStudentQuery = (identifier) => {
  return isValidObjectId(identifier)
    ? { _id: identifier }
    : { studentId: identifier };
};

const getStudentOrThrow = async (identifier) => {
  const student = await Student.findOne(resolveStudentQuery(identifier));

  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  return student;
};

const createStudent = async (req, res) => {
  try {
    const payload = normalizeStudentPayload(req.body, false);
    const student = await Student.create(payload);

    return sendSuccess(res, 201, 'Student created successfully', student);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'Duplicate studentId detected. Please retry.';
    }

    return sendError(res, error);
  }
};

const getAllStudents = async (req, res) => {
  try {
    const filters = buildStudentFilters(req.query);
    const options = buildStudentListOptions(req.query);

    const [students, total] = await Promise.all([
      Student.find(filters)
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      Student.countDocuments(filters),
    ]);

    return sendSuccess(res, 200, 'Students fetched successfully', {
      students,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findOne(resolveStudentQuery(id)).lean();

    if (!student) {
      const error = new Error('Student not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Student fetched successfully', student);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await getStudentOrThrow(id);

    const updates = normalizeStudentPayload(req.body, true);

    // Merge partial nested updates safely.
    if (updates.parent) {
      updates.parent = {
        fatherName: updates.parent.fatherName ?? student.parent.fatherName,
        motherName: updates.parent.motherName ?? student.parent.motherName,
        parentContact: updates.parent.parentContact ?? student.parent.parentContact,
      };
    }

    if (updates.academic) {
      updates.academic = {
        class: updates.academic.class ?? student.academic.class,
        section: updates.academic.section ?? student.academic.section,
        rollNumber: updates.academic.rollNumber ?? student.academic.rollNumber,
        admissionDate: updates.academic.admissionDate ?? student.academic.admissionDate,
      };
    }

    const updatedStudent = await Student.findByIdAndUpdate(student._id, updates, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, 200, 'Student updated successfully', updatedStudent);
  } catch (error) {
    return sendError(res, error);
  }
};

const softDeleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findOneAndUpdate(
      resolveStudentQuery(id),
      { status: 'inactive' },
      { new: true }
    );

    if (!student) {
      const error = new Error('Student not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Student deactivated successfully', student);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  softDeleteStudent,
};