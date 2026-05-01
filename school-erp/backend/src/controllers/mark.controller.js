const Mark = require('../models/Mark');
const { Student } = require('../models/Student');
const { sendSuccess, sendError } = require('../services/academic.service');

const gradeFromMarks = (value) => {
  if (value >= 90) return 'A+';
  if (value >= 80) return 'A';
  if (value >= 70) return 'B+';
  if (value >= 60) return 'B';
  if (value >= 50) return 'C';
  if (value >= 33) return 'D';
  return 'F';
};

const getMarks = async (req, res) => {
  try {
    const className = String(req.query.class || '').trim();
    const section = String(req.query.section || '').trim();
    const examName = String(req.query.examName || '').trim();
    const subjectName = String(req.query.subjectName || '').trim();

    if (!className || !section || !examName || !subjectName) {
      const error = new Error('class, section, examName and subjectName are required');
      error.statusCode = 400;
      throw error;
    }

    const filter = { className, section, examName, subjectName };
    if (req.user.role === 'teacher') {
      filter.teacherId = req.user._id;
    }

    const marks = await Mark.find(filter).populate('studentId', 'name academic.rollNumber').lean();

    return sendSuccess(res, 200, 'Marks fetched', marks);
  } catch (error) {
    return sendError(res, error);
  }
};

const saveMarks = async (req, res) => {
  try {
    const { className, section, examName, subjectName, entries } = req.body;

    if (!className || !section || !examName || !subjectName || !Array.isArray(entries) || entries.length === 0) {
      const error = new Error('className, section, examName, subjectName and entries are required');
      error.statusCode = 400;
      throw error;
    }

    const studentIds = entries.map((entry) => entry.studentId);
    const students = await Student.find({
      _id: { $in: studentIds },
      'academic.class': className,
      'academic.section': section,
    }).select('_id').lean();

    const validStudentIds = new Set(students.map((student) => String(student._id)));

    await Promise.all(
      entries.map(async (entry) => {
        const studentId = String(entry.studentId || '');
        const marks = Number(entry.marks);

        if (!validStudentIds.has(studentId)) {
          const error = new Error('One or more students do not belong to selected class and section');
          error.statusCode = 400;
          throw error;
        }

        if (Number.isNaN(marks) || marks < 0 || marks > 100) {
          const error = new Error('Each marks value must be between 0 and 100');
          error.statusCode = 400;
          throw error;
        }

        await Mark.findOneAndUpdate(
          {
            examName,
            className,
            section,
            subjectName,
            studentId,
          },
          {
            examName,
            className,
            section,
            subjectName,
            studentId,
            teacherId: req.user._id,
            marks,
            grade: gradeFromMarks(marks),
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );
      })
    );

    return sendSuccess(res, 200, 'Marks saved', null);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getMarks,
  saveMarks,
};
