const mongoose = require('mongoose');
require('dotenv').config();
const { Student } = require('./src/models/Student');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const allStudents = await Student.countDocuments();
  const rteStudents = await Student.countDocuments({ isRTE: true });
  console.log('Total students:', allStudents);
  console.log('RTE students:', rteStudents);

  const rteList = await Student.find({ isRTE: true }).select('name status isRTE');
  console.log('RTE List:', rteList);
  process.exit(0);
});
