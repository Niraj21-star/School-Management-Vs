const Assignment = require('../models/Assignment');
const { sendSuccess, sendError } = require('../services/academic.service');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['08:00-08:45', '08:45-09:30', '09:45-10:30', '10:30-11:15', '11:30-12:15', '12:15-01:00', '01:30-02:15'];

const getTimetable = async (req, res) => {
  try {
    const assignmentFilter = req.user.role === 'teacher'
      ? { teacherId: req.user._id }
      : {};

    const assignments = await Assignment.find(assignmentFilter)
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('teacherId', 'name')
      .lean();

    const timetable = assignments.map((assignment, index) => {
      const day = DAYS[index % DAYS.length];
      const period = (index % TIME_SLOTS.length) + 1;

      return {
        id: String(assignment._id),
        day,
        period,
        time: TIME_SLOTS[period - 1],
        subject: assignment.subjectId?.name || 'Subject',
        class: assignment.classId?.name || 'Class',
        teacher: assignment.teacherId?.name || 'Teacher',
      };
    });

    timetable.sort((a, b) => {
      const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return a.period - b.period;
    });

    return sendSuccess(res, 200, 'Timetable fetched', timetable);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getTimetable,
};
