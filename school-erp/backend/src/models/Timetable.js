const mongoose = require('mongoose');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timetableSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    day: {
      type: String,
      enum: DAYS,
      required: true,
    },
    period: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

timetableSchema.index({ classId: 1, day: 1, period: 1 }, { unique: true });

const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = { Timetable, DAYS };
