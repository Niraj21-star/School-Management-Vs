const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const { Student } = require('./src/models/Student');
    // Update the most recently created student
    const latestStudent = await Student.findOne().sort({createdAt: -1});
    if (latestStudent) {
      latestStudent.isRTE = true;
      await latestStudent.save();
      console.log(`Successfully set isRTE=true for student: ${latestStudent.name}`);
    } else {
      console.log('No students found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
