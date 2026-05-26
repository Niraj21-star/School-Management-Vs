require('dotenv').config();
const mongoose = require('mongoose');
const { Student } = require('./src/models/Student');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const students = await Student.find({ isRTE: true }).select('name status isRTE');
  console.log(students);
  process.exit(0);
});
