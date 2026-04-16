const mongoose = require('mongoose');

const REQUEST_STATUSES = ['pending', 'approved', 'rejected'];

const tcDuplicateRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: 'pending',
      index: true,
    },
    adminComment: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    consumed: {
      type: Boolean,
      default: false,
      index: true,
    },
    consumedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

tcDuplicateRequestSchema.index({ studentId: 1, requestedBy: 1, status: 1 });

tcDuplicateRequestSchema.index({ studentId: 1, requestedBy: 1, status: 1, consumed: 1 });

const TCDuplicateRequest = mongoose.model('TCDuplicateRequest', tcDuplicateRequestSchema);

module.exports = {
  TCDuplicateRequest,
  REQUEST_STATUSES,
};
