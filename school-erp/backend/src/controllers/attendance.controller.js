const Attendance = require('../models/Attendance');
const {
  isValidObjectId,
  normalizeDate,
  ensureClassAndSection,
  ensureTeacherAssignment,
  normalizeStudentsInput,
  ensureStudentsBelongToClassSection,
  sendSuccess,
  sendError,
} = require('../services/attendance.service');

const markAttendance = async (req, res) => {
  try {
    const {
      classId,
      section,
      date,
      students,
      markAllPresent = false,
    } = req.body;

    if (!classId || !section || !date) {
      const error = new Error('classId, section and date are required');
      error.statusCode = 400;
      throw error;
    }

    if (!isValidObjectId(classId)) {
      const error = new Error('Invalid classId');
      error.statusCode = 400;
      throw error;
    }

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      const error = new Error('Invalid date');
      error.statusCode = 400;
      throw error;
    }

    const { schoolClass, normalizedSection } = await ensureClassAndSection(classId, section);

    if (req.user.role === 'teacher') {
      await ensureTeacherAssignment(req.user._id, classId);
    }

    const normalizedStudents = await normalizeStudentsInput({
      students,
      markAllPresent,
      className: schoolClass.name,
      section: normalizedSection,
    });

    await ensureStudentsBelongToClassSection({
      studentEntries: normalizedStudents,
      className: schoolClass.name,
      section: normalizedSection,
    });

    const existingAttendance = await Attendance.findOne({
      classId,
      section: normalizedSection,
      date: normalizedDate,
    }).select('_id');

    if (existingAttendance) {
      const error = new Error('Attendance already marked for this class, section and date');
      error.statusCode = 409;
      throw error;
    }

    const attendance = await Attendance.create({
      classId,
      section: normalizedSection,
      date: normalizedDate,
      students: normalizedStudents,
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('classId', 'name sections')
      .populate('students.studentId', 'name studentId');

    return sendSuccess(res, 201, 'Attendance saved', populatedAttendance);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'Attendance already exists for this class, section and date';
    }

    return sendError(res, error);
  }
};

const getAttendanceByDate = async (req, res) => {
  try {
    const { classId, section, date } = req.query;

    if (!classId || !section || !date) {
      const error = new Error('classId, section and date are required');
      error.statusCode = 400;
      throw error;
    }

    if (!isValidObjectId(classId)) {
      const error = new Error('Invalid classId');
      error.statusCode = 400;
      throw error;
    }

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) {
      const error = new Error('Invalid date');
      error.statusCode = 400;
      throw error;
    }

    const { normalizedSection } = await ensureClassAndSection(classId, section);

    if (req.user.role === 'teacher') {
      await ensureTeacherAssignment(req.user._id, classId);
    }

    const attendance = await Attendance.findOne({
      classId,
      section: normalizedSection,
      date: normalizedDate,
    })
      .populate('classId', 'name sections')
      .populate('students.studentId', 'name studentId');

    if (!attendance) {
      const error = new Error('Attendance record not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Attendance fetched', attendance);
  } catch (error) {
    return sendError(res, error);
  }
};

const getAttendanceReport = async (req, res) => {
  try {
    const { classId, section, from, to } = req.query;

    if (!classId || !section) {
      const error = new Error('classId and section are required');
      error.statusCode = 400;
      throw error;
    }

    if (!isValidObjectId(classId)) {
      const error = new Error('Invalid classId');
      error.statusCode = 400;
      throw error;
    }

    const { normalizedSection } = await ensureClassAndSection(classId, section);

    const filter = {
      classId,
      section: normalizedSection,
    };

    if (from || to) {
      filter.date = {};

      if (from) {
        const fromDate = normalizeDate(from);
        if (!fromDate) {
          const error = new Error('Invalid from date');
          error.statusCode = 400;
          throw error;
        }

        filter.date.$gte = fromDate;
      }

      if (to) {
        const toDate = normalizeDate(to);
        if (!toDate) {
          const error = new Error('Invalid to date');
          error.statusCode = 400;
          throw error;
        }

        filter.date.$lte = toDate;
      }
    }

    const attendanceRecords = await Attendance.find(filter)
      .select('classId section date students')
      .sort({ date: 1 });

    const summary = attendanceRecords.reduce(
      (accumulator, record) => {
        accumulator.totalDays += 1;

        record.students.forEach((studentEntry) => {
          accumulator[studentEntry.status] += 1;
          accumulator.totalMarked += 1;
        });

        return accumulator;
      },
      {
        totalDays: 0,
        totalMarked: 0,
        present: 0,
        absent: 0,
        leave: 0,
      }
    );

    const presentPercentage = summary.totalMarked > 0
      ? Number(((summary.present / summary.totalMarked) * 100).toFixed(2))
      : 0;

    const absentPercentage = summary.totalMarked > 0
      ? Number(((summary.absent / summary.totalMarked) * 100).toFixed(2))
      : 0;

    return sendSuccess(res, 200, 'Attendance report fetched', {
      summary: {
        ...summary,
        presentPercentage,
        absentPercentage,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { students } = req.body;

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid attendance ID');
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(students) || students.length === 0) {
      const error = new Error('Students array is required for update');
      error.statusCode = 400;
      throw error;
    }

    const attendance = await Attendance.findById(id).populate('classId');
    if (!attendance) {
      const error = new Error('Attendance record not found');
      error.statusCode = 404;
      throw error;
    }

    if (req.user.role === 'teacher') {
      await ensureTeacherAssignment(req.user._id, attendance.classId._id);
    }

    const normalizedStudents = await normalizeStudentsInput({
      students,
      markAllPresent: false,
      className: attendance.classId.name,
      section: attendance.section,
    });

    await ensureStudentsBelongToClassSection({
      studentEntries: normalizedStudents,
      className: attendance.classId.name,
      section: attendance.section,
    });

    attendance.students = normalizedStudents;
    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('classId', 'name sections')
      .populate('students.studentId', 'name studentId');

    return sendSuccess(res, 200, 'Attendance updated', populatedAttendance);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  markAttendance,
  getAttendanceByDate,
  getAttendanceReport,
  updateAttendance,
};