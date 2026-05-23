const mongoose = require('mongoose');

const classFeeSchema = new mongoose.Schema(
  {
    classPattern: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    breakdown: {
      admission: { type: Number, default: 0, min: 0 },
      bdf: { type: Number, default: 0, min: 0 },
      tuition: { type: Number, default: 0, min: 0 },
      exam: { type: Number, default: 0, min: 0 },
      computer: { type: Number, default: 0, min: 0 },
      sport: { type: Number, default: 0, min: 0 },
      medical: { type: Number, default: 0, min: 0 },
      craft: { type: Number, default: 0, min: 0 },
      library: { type: Number, default: 0, min: 0 },
      laboratory: { type: Number, default: 0, min: 0 },
      misc: { type: Number, default: 0, min: 0 },
      other: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const ClassFee = mongoose.model('ClassFee', classFeeSchema);

module.exports = ClassFee;
