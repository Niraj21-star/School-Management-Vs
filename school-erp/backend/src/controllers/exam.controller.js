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

const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.class !== undefined) updates.class = String(req.body.class).trim() || 'All';
    if (req.body.startDate !== undefined) updates.startDate = req.body.startDate;
    if (req.body.endDate !== undefined) updates.endDate = req.body.endDate;
    if (req.body.status !== undefined) updates.status = req.body.status;

    const exam = await Exam.findById(id);
    if (!exam) {
      const error = new Error('Exam not found');
      error.statusCode = 404;
      throw error;
    }

    Object.assign(exam, updates);
    if (exam.endDate && exam.startDate && new Date(exam.endDate) < new Date(exam.startDate)) {
      const error = new Error('endDate cannot be before startDate');
      error.statusCode = 400;
      throw error;
    }

    await exam.save();
    return sendSuccess(res, 200, 'Exam updated', exam);
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByIdAndDelete(id);
    
    if (!exam) {
      const error = new Error('Exam not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Exam deleted', exam);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getAllExams,
  createExam,
  updateExam,
  deleteExam,
};
