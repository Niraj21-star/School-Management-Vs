const mongoose = require('mongoose');
const { Expense } = require('../models/Expense');
const {
  buildExpenseFilter,
  buildExpenseSummary,
  validateExpensePayload,
  sendSuccess,
  sendError,
} = require('../services/expense.service');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createExpense = async (req, res) => {
  try {
    const payload = validateExpensePayload(req.body, false);
    const expense = await Expense.create(payload);

    return sendSuccess(res, 201, 'Expense added successfully', expense);
  } catch (error) {
    return sendError(res, error);
  }
};

const getAllExpenses = async (req, res) => {
  try {
    const filter = buildExpenseFilter(req.query);
    const expenses = await Expense.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const summary = buildExpenseSummary(expenses);

    return sendSuccess(res, 200, 'Expenses fetched successfully', {
      expenses,
      summary,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid expense id');
      error.statusCode = 400;
      throw error;
    }

    const updates = validateExpensePayload(req.body, true);

    const expense = await Expense.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!expense) {
      const error = new Error('Expense not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Expense updated successfully', expense);
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      const error = new Error('Invalid expense id');
      error.statusCode = 400;
      throw error;
    }

    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      const error = new Error('Expense not found');
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, 'Expense deleted successfully', expense);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  createExpense,
  getAllExpenses,
  updateExpense,
  deleteExpense,
};