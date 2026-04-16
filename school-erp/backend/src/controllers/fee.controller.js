const mongoose = require('mongoose');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const {
  PAYMENT_MODES,
  isValidObjectId,
  ensureStudentExists,
  computeFeeState,
  normalizeInstallments,
  sendSuccess,
  sendError,
} = require('../services/fee.service');

const createFeeStructure = async (req, res) => {
  try {
    const { studentId, totalAmount, installments } = req.body;

    if (!studentId || totalAmount === undefined) {
      const error = new Error('studentId and totalAmount are required');
      error.statusCode = 400;
      throw error;
    }

    if (!isValidObjectId(studentId)) {
      const error = new Error('Invalid studentId');
      error.statusCode = 400;
      throw error;
    }

    const normalizedTotalAmount = Number(totalAmount);
    if (Number.isNaN(normalizedTotalAmount) || normalizedTotalAmount < 0) {
      const error = new Error('totalAmount must be non-negative');
      error.statusCode = 400;
      throw error;
    }

    await ensureStudentExists(studentId);

    const existingFee = await Fee.findOne({ studentId });
    if (existingFee) {
      const error = new Error('Fee structure already exists for this student');
      error.statusCode = 409;
      throw error;
    }

    const installmentsData = normalizeInstallments(installments);

    const fee = await Fee.create({
      studentId,
      totalAmount: normalizedTotalAmount,
      paidAmount: 0,
      dueAmount: normalizedTotalAmount,
      status: 'unpaid',
      installments: installmentsData,
    });

    return sendSuccess(res, 201, 'Fee structure created', fee);
  } catch (error) {
    return sendError(res, error);
  }
};

const getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate('studentId', 'studentId name academic status')
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const studentIds = fees.map((fee) => fee.studentId?._id).filter(Boolean);

    const payments = await Payment.find({ studentId: { $in: studentIds } })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const paymentsByStudent = payments.reduce((accumulator, payment) => {
      const key = String(payment.studentId);

      if (!accumulator[key]) {
        accumulator[key] = [];
      }

      accumulator[key].push(payment);
      return accumulator;
    }, {});

    const result = fees.map((fee) => ({
      fee,
      paymentHistory: paymentsByStudent[String(fee.studentId?._id)] || [],
    }));

    return sendSuccess(res, 200, 'Fee list fetched', result);
  } catch (error) {
    return sendError(res, error);
  }
};

const recordPayment = async (req, res) => {
  try {
    const { studentId, amount, date, mode } = req.body;

    if (!studentId || amount === undefined || !mode) {
      const error = new Error('studentId, amount and mode are required');
      error.statusCode = 400;
      throw error;
    }

    if (!isValidObjectId(studentId)) {
      const error = new Error('Invalid studentId');
      error.statusCode = 400;
      throw error;
    }

    const normalizedAmount = Number(amount);
    if (Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
      const error = new Error('amount must be greater than 0');
      error.statusCode = 400;
      throw error;
    }

    if (!PAYMENT_MODES.includes(mode)) {
      const error = new Error(`mode must be one of: ${PAYMENT_MODES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    await ensureStudentExists(studentId);

    const applyPayment = async (session = null) => {
      const feeQuery = Fee.findOne({ studentId });
      const fee = session ? await feeQuery.session(session) : await feeQuery;

      if (!fee) {
        const error = new Error('Fee structure not found for student');
        error.statusCode = 404;
        throw error;
      }

      if (normalizedAmount > fee.dueAmount) {
        const error = new Error('Payment cannot exceed due amount');
        error.statusCode = 400;
        throw error;
      }

      const paymentPayload = {
        studentId,
        amount: normalizedAmount,
        date: date || Date.now(),
        mode,
      };

      const paymentDoc = session
        ? (await Payment.create([paymentPayload], { session }))[0]
        : await Payment.create(paymentPayload);

      const nextPaidAmount = fee.paidAmount + normalizedAmount;
      const feeState = computeFeeState(fee.totalAmount, nextPaidAmount);

      fee.paidAmount = feeState.paidAmount;
      fee.dueAmount = feeState.dueAmount;
      fee.status = feeState.status;

      const savedFee = session ? await fee.save({ session }) : await fee.save();

      return {
        payment: paymentDoc,
        fee: savedFee,
      };
    };

    let paymentResult;

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        paymentResult = await applyPayment(session);
      });
    } catch (error) {
      const transactionUnsupported = String(error.message || '').includes(
        'Transaction numbers are only allowed on a replica set member or mongos'
      );

      if (!transactionUnsupported) {
        throw error;
      }

      paymentResult = await applyPayment();
    } finally {
      await session.endSession();
    }

    return sendSuccess(res, 201, 'Payment recorded', {
      payment: paymentResult.payment,
      fee: paymentResult.fee,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!isValidObjectId(studentId)) {
      const error = new Error('Invalid studentId');
      error.statusCode = 400;
      throw error;
    }

    await ensureStudentExists(studentId);

    const fee = await Fee.findOne({ studentId }).populate('studentId', 'studentId name academic status');
    if (!fee) {
      const error = new Error('Fee structure not found');
      error.statusCode = 404;
      throw error;
    }

    const paymentHistory = await Payment.find({ studentId })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'Fee details fetched', {
      fee,
      paymentHistory,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getDefaulters = async (req, res) => {
  try {
    const defaulters = await Fee.find({ status: { $in: ['unpaid', 'partial'] } })
      .populate('studentId', 'studentId name academic')
      .sort({ dueAmount: -1, updatedAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'Defaulters fetched', defaulters);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createFeeStructure,
  getAllFees,
  recordPayment,
  getStudentFees,
  getDefaulters,
};