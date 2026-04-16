const { Exam } = require('../models/Exam');
const { sendSuccess, sendError } = require('../services/academic.service');

const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ startDate: -1, createdAt: -1 }).lean();
    return sendSuccess(res, 200, 'Exams fetched', exams);
  } catch (error) {
    return sendError(res, error);
  }
};

const createExam = async (req, res) => {
  try {
    const { name, startDate, endDate, class: className = 'All' } = req.body;

    if (!name || !startDate || !endDate) {
      const error = new Error('name, startDate and endDate are required');
      error.statusCode = 400;
      throw error;
    }

    if (new Date(endDate) < new Date(startDate)) {
      const error = new Error('endDate cannot be before startDate');
      error.statusCode = 400;
      throw error;
    }

    const exam = await Exam.create({
      name: String(name).trim(),
      class: String(className).trim() || 'All',
      startDate,
      endDate,
      createdBy: req.user._id,
    });

    return sendSuccess(res, 201, 'Exam created', exam);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getAllExams,
  createExam,
};
