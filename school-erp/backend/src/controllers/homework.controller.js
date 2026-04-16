const { Homework } = require('../models/Homework');
const SchoolClass = require('../models/SchoolClass');
const { sendSuccess, sendError } = require('../services/academic.service');

const splitClassSection = (value = '') => {
  const parts = String(value).split('-');
  return {
    className: parts[0] || '',
    section: parts[1] || '',
  };
};

const getHomeworkList = async (req, res) => {
  try {
    const filter = {};

    if (req.query.class) {
      const { className, section } = splitClassSection(req.query.class);
      if (className) filter.className = className;
      if (section) filter.section = section;
    }

    if (req.query.subject) {
      filter.subject = String(req.query.subject).trim();
    }

    if (req.user.role === 'teacher') {
      filter.teacherId = req.user._id;
    }

    const list = await Homework.find(filter)
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'Homework list fetched', list);
  } catch (error) {
    return sendError(res, error);
  }
};

const createHomework = async (req, res) => {
  try {
    const { class: classValue, subject, title, description = '', dueDate } = req.body;

    if (!classValue || !subject || !title || !dueDate) {
      const error = new Error('class, subject, title and dueDate are required');
      error.statusCode = 400;
      throw error;
    }

    const { className, section } = splitClassSection(classValue);
    if (!className || !section) {
      const error = new Error('class must be in "Class-Section" format, e.g. "10-A"');
      error.statusCode = 400;
      throw error;
    }

    const schoolClass = await SchoolClass.findOne({ name: className }).lean();
    if (!schoolClass || !Array.isArray(schoolClass.sections) || !schoolClass.sections.includes(section)) {
      const error = new Error('Selected class/section not found');
      error.statusCode = 400;
      throw error;
    }

    const homework = await Homework.create({
      className,
      section,
      subject: String(subject).trim(),
      title: String(title).trim(),
      description: String(description || '').trim(),
      dueDate,
      teacherId: req.user._id,
      status: 'Active',
    });

    return sendSuccess(res, 201, 'Homework created', homework);
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteHomework = async (req, res) => {
  try {
    const { id } = req.params;

    const filter = { _id: id };
    if (req.user.role === 'teacher') {
      filter.teacherId = req.user._id;
    }

    const deleted = await Homework.findOneAndDelete(filter).lean();

    if (!deleted) {
      const error = new Error('Homework not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Homework deleted', deleted);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getHomeworkList,
  createHomework,
  deleteHomework,
};
