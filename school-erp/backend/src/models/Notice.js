const mongoose = require('mongoose');

const NOTICE_PRIORITIES = ['Low', 'Medium', 'High'];
const NOTICE_STATUSES = ['Draft', 'Published', 'Pending'];

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: NOTICE_PRIORITIES,
      default: 'Medium',
    },
    status: {
      type: String,
      enum: NOTICE_STATUSES,
      default: 'Draft',
      index: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
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

noticeSchema.index({ createdAt: -1, status: 1 });

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = {
  Notice,
  NOTICE_PRIORITIES,
  NOTICE_STATUSES,
};
