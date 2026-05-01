const { Timetable } = require('../models/Timetable');
const { sendSuccess, sendError } = require('../services/academic.service');

const getTimetable = async (req, res) => {
  try {
    const filter = req.user.role === 'teacher'
      ? { teacherId: req.user._id }
      : {};

    const records = await Timetable.find(filter)
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('teacherId', 'name')
      .lean();

    const timetable = records.map((record) => ({
      id: String(record._id),
      day: record.day,
      period: record.period,
      time: record.time,
      subject: record.subjectId?.name || 'Subject',
      class: record.classId?.name || 'Class',
      teacher: record.teacherId?.name || 'Teacher',
    }));

    timetable.sort((a, b) => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayDiff = days.indexOf(a.day) - days.indexOf(b.day);
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
