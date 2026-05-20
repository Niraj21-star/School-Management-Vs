const mongoose = require('mongoose');
const ReceiptCounter = require('./ReceiptCounter');

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
    receiptNo: {
      type: Number,
      unique: true,
      sparse: true,
    },
    breakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.pre('validate', async function assignReceiptNo() {
  if (!this.isNew || this.receiptNo) {
    return;
  }

  const counter = await ReceiptCounter.findOneAndUpdate(
    { _id: 'receiptNo' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  this.receiptNo = counter.seq;
});

paymentSchema.index({ studentId: 1, date: -1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;