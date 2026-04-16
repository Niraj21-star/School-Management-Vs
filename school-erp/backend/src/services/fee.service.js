const mongoose = require('mongoose');
const { Student } = require('../models/Student');

const FEE_STATUSES = ['unpaid', 'partial', 'paid'];
const PAYMENT_MODES = ['cash', 'upi', 'bank'];

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const ensureStudentExists = async (studentId) => {
  const student = await Student.findById(studentId).lean();

  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  return student;
};

const computeFeeState = (totalAmount, paidAmount) => {
  const safeTotal = Number(totalAmount) || 0;
  const safePaid = Number(paidAmount) || 0;
  const dueAmount = Math.max(safeTotal - safePaid, 0);

  let status = 'unpaid';
  if (safePaid >= safeTotal && safeTotal > 0) {
    status = 'paid';
  } else if (safePaid > 0) {
    status = 'partial';
  }

  return {
    paidAmount: safePaid,
    dueAmount,
    status,
  };
};

const normalizeInstallments = (installments) => {
  if (installments === undefined) {
    return [];
  }

  if (!Array.isArray(installments)) {
    const error = new Error('installments must be an array');
    error.statusCode = 400;
    throw error;
  }

  return installments.map((item) => ({
    dueDate: item.dueDate,
    amount: Number(item.amount || 0),
    paidAmount: Number(item.paidAmount || 0),
  }));
};

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
    message: error.message || 'Internal Server Error',
    data: null,
  });
};

module.exports = {
  FEE_STATUSES,
  PAYMENT_MODES,
  isValidObjectId,
  ensureStudentExists,
  computeFeeState,
  normalizeInstallments,
  sendSuccess,
  sendError,
};