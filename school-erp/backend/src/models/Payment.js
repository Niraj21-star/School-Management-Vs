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

  // Find the highest receiptNo currently in the collection
  const lastPayment = await this.constructor.findOne().sort({ receiptNo: -1 });
  const maxReceiptNo = lastPayment && lastPayment.receiptNo ? lastPayment.receiptNo : 0;

  const counter = await ReceiptCounter.findOneAndUpdate(
    { _id: 'receiptNo' },
    [
      {
        $set: {
          seq: {
            $max: [
              { $add: [{ $ifNull: ["$seq", 0] }, 1] },
              maxReceiptNo + 1
            ]
          }
        }
      }
    ],
    { new: true, upsert: true }
  );

  this.receiptNo = counter.seq;
});

paymentSchema.index({ studentId: 1, date: -1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;