const mongoose = require('mongoose');

const EXAM_STATUSES = ['Upcoming', 'In Progress', 'Completed'];

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    class: {
      type: String,
      required: true,
      trim: true,
      default: 'All',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: EXAM_STATUSES,
      default: 'Upcoming',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

examSchema.pre('validate', function normalizeStatus() {
  if (!this.startDate || !this.endDate) {
    return;
  }

  const now = new Date();
  if (now < new Date(this.startDate)) {
    this.status = 'Upcoming';
  } else if (now > new Date(this.endDate)) {
    this.status = 'Completed';
  } else {
    this.status = 'In Progress';
  }
});

examSchema.index({ startDate: 1, endDate: 1 });

const Exam = mongoose.model('Exam', examSchema);

module.exports = {
  Exam,
  EXAM_STATUSES,
};
