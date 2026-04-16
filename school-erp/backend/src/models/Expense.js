const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'salary',
  'electricity',
  'maintenance',
  'transport',
  'event',
  'other',
];

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: EXPENSE_CATEGORIES,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ date: -1, category: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = {
  Expense,
  EXPENSE_CATEGORIES,
};