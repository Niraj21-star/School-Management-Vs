const { EXPENSE_CATEGORIES } = require('../models/Expense');

const normalizeDate = (value, endOfDay = false) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
};

const buildExpenseFilter = (query) => {
  const filter = {};

  if (query.category) {
    if (!EXPENSE_CATEGORIES.includes(query.category)) {
      const error = new Error(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    filter.category = query.category;
  }

  if (query.from || query.to) {
    filter.date = {};

    if (query.from) {
      const fromDate = normalizeDate(query.from, false);
      if (!fromDate) {
        const error = new Error('Invalid from date');
        error.statusCode = 400;
        throw error;
      }

      filter.date.$gte = fromDate;
    }

    if (query.to) {
      const toDate = normalizeDate(query.to, true);
      if (!toDate) {
        const error = new Error('Invalid to date');
        error.statusCode = 400;
        throw error;
      }

      filter.date.$lte = toDate;
    }
  }

  return filter;
};

const buildExpenseSummary = (expenses) => {
  const summary = {
    totalExpense: 0,
    count: expenses.length,
    byCategory: {
      salary: 0,
      electricity: 0,
      maintenance: 0,
      transport: 0,
      event: 0,
      other: 0,
    },
    byMonth: {},
  };

  expenses.forEach((expense) => {
    const amount = Number(expense.amount || 0);
    summary.totalExpense += amount;
    summary.byCategory[expense.category] += amount;

    const monthKey = new Date(expense.date).toISOString().slice(0, 7);
    summary.byMonth[monthKey] = (summary.byMonth[monthKey] || 0) + amount;
  });

  summary.totalExpense = Number(summary.totalExpense.toFixed(2));
  Object.keys(summary.byCategory).forEach((key) => {
    summary.byCategory[key] = Number(summary.byCategory[key].toFixed(2));
  });
  Object.keys(summary.byMonth).forEach((key) => {
    summary.byMonth[key] = Number(summary.byMonth[key].toFixed(2));
  });

  return summary;
};

const validateExpensePayload = (payload, isPartial = false) => {
  const { title, category, amount, date } = payload;

  if (!isPartial && (!title || !category || amount === undefined || !date)) {
    const error = new Error('title, category, amount and date are required');
    error.statusCode = 400;
    throw error;
  }

  const normalized = {};

  if (title !== undefined) {
    normalized.title = String(title).trim();
  }

  if (category !== undefined) {
    if (!EXPENSE_CATEGORIES.includes(category)) {
      const error = new Error(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    normalized.category = category;
  }

  if (amount !== undefined) {
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      const error = new Error('amount must be greater than 0');
      error.statusCode = 400;
      throw error;
    }

    normalized.amount = parsedAmount;
  }

  if (date !== undefined) {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      const error = new Error('Invalid date');
      error.statusCode = 400;
      throw error;
    }

    normalized.date = parsedDate;
  }

  if (payload.notes !== undefined) {
    normalized.notes = String(payload.notes).trim();
  }

  return normalized;
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
  buildExpenseFilter,
  buildExpenseSummary,
  validateExpensePayload,
  sendSuccess,
  sendError,
};