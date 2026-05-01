const mongoose = require('mongoose');
const StudentCounter = require('./StudentCounter');

const GENDERS = ['male', 'female', 'other'];
const STATUSES = ['active', 'inactive'];

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: GENDERS,
      required: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    passportPhoto: {
      type: String,
      default: '',
    },
    parent: {
      fatherName: {
        type: String,
        required: true,
        trim: true,
      },
      motherName: {
        type: String,
        required: true,
        trim: true,
      },
      parentContact: {
        type: String,
        required: true,
        trim: true,
      },
    },
    academic: {
      class: {
        type: String,
        required: true,
        trim: true,
      },
      section: {
        type: String,
        required: true,
        trim: true,
      },
      rollNumber: {
        type: String,
        required: true,
        trim: true,
      },
      admissionDate: {
        type: Date,
        required: true,
      },
    },
    documents: [
      {
        type: String,
        trim: true,
      },
    ],
    tcCertificate: {
      downloadCount: {
        type: Number,
        default: 0,
      },
      firstDownloadedAt: {
        type: Date,
      },
      lastDownloadedAt: {
        type: Date,
      },
      lastDownloadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.pre('validate', async function generateStudentId() {
  if (!this.isNew || this.studentId) {
    return;
  }

  const currentYear = new Date().getFullYear();
  const counterKey = `studentId:${currentYear}`;

  const counter = await StudentCounter.findOneAndUpdate(
    { _id: counterKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  this.studentId = `SCH${currentYear}-${String(counter.seq).padStart(3, '0')}`;
});

studentSchema.index(
  { 'academic.class': 1, 'academic.section': 1, 'academic.rollNumber': 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

studentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Student = mongoose.model('Student', studentSchema);

module.exports = {
  Student,
  GENDERS,
  STATUSES,
};