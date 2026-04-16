const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    mode: {
      type: String,
      required: true,
      trim: true,
      enum: ['cash', 'upi', 'bank'],
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ studentId: 1, date: -1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;