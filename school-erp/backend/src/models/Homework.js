const mongoose = require('mongoose');

const HOMEWORK_STATUSES = ['Active', 'Archived'];

const homeworkSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: HOMEWORK_STATUSES,
      default: 'Active',
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

homeworkSchema.index({ className: 1, section: 1, subject: 1, dueDate: -1 });

const Homework = mongoose.model('Homework', homeworkSchema);

module.exports = {
  Homework,
  HOMEWORK_STATUSES,
};
