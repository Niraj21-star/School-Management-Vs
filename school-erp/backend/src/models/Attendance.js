const mongoose = require('mongoose');

const attendanceStudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'leave'],
      required: true,
    },
  },
  {
    _id: false,
  }
);

const attendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      required: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    students: {
      type: [attendanceStudentSchema],
      default: [],
      validate: {
        validator: (students) => Array.isArray(students) && students.length > 0,
        message: 'students must contain at least one record',
      },
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ classId: 1, section: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;