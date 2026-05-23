const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const { Student } = require('./src/models/Student');
  const s = await Student.findOne().sort({createdAt: -1});
  console.log('GR:', s?.generalRegisterNumber);
  console.log('StudentId:', s?.studentId);
  process.exit(0);
}).catch(console.error);
