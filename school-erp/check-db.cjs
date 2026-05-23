const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });
const { Student } = require('./backend/src/models/Student');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-erp');
  const students = await Student.find().sort({ _id: -1 }).limit(5);
  students.forEach(s => {
    console.log(`Student: ${s.name}, Aadhaar: ${s.aadhaarNumber}, PEN: ${s.penNumber}`);
  });
  mongoose.disconnect();
}

check();
