const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolClass',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ teacherId: 1, classId: 1, subjectId: 1 }, { unique: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;