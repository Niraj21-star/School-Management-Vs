const mongoose = require('mongoose');

const DOCUMENT_TYPES = [
  'Transfer Certificate',
  'Marksheet',
  'ID Proof',
  'Bonafide',
  'Fee Receipt',
  'Other',
];

const DOCUMENT_STATUSES = ['Uploaded', 'Pending'];

const documentRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: DOCUMENT_TYPES,
      default: 'Other',
    },
    status: {
      type: String,
      enum: DOCUMENT_STATUSES,
      default: 'Uploaded',
    },
    fileName: {
      type: String,
      trim: true,
      default: '',
    },
    fileMimeType: {
      type: String,
      trim: true,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileData: {
      type: String,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

documentRecordSchema.index({ createdAt: -1, studentId: 1 });

const DocumentRecord = mongoose.model('DocumentRecord', documentRecordSchema);

module.exports = {
  DocumentRecord,
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
};
