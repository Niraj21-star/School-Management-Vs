const mongoose = require('mongoose');

const tcPrintLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    printedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    printType: {
      type: String,
      enum: ['original', 'duplicate'],
      required: true,
      index: true,
    },
    tcNumber: {
      type: String,
      default: '',
    },
    duplicateRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TCDuplicateRequest',
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    printedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

tcPrintLogSchema.index({ studentId: 1, printType: 1, printedAt: -1 });

const TCPrintLog = mongoose.model('TCPrintLog', tcPrintLogSchema);

module.exports = TCPrintLog;
