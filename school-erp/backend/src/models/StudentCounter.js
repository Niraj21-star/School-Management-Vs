const mongoose = require('mongoose');

const studentCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    versionKey: false,
  }
);

const StudentCounter = mongoose.model('StudentCounter', studentCounterSchema);

module.exports = StudentCounter;