const mongoose = require('mongoose');

const tcCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const TCCounter = mongoose.model('TCCounter', tcCounterSchema);

module.exports = TCCounter;
