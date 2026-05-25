const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const { Student } = require('./src/models/Student');
    const students = await Student.find().sort({createdAt: -1}).limit(5);
    console.log("Last 5 students:");
    students.forEach(s => {
      console.log(`- ${s.name}: isRTE=${s.isRTE}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
