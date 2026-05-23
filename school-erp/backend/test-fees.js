const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const Fee = require('./src/models/Fee');
const { Student } = require('./src/models/Student');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const fees = await Fee.find().populate('studentId').lean();
  console.log("Fees Classes:");
  fees.forEach(fee => {
      const student = fee.studentId;
      if (student && student.academic) {
          const className = student.academic.class || '';
          const section = student.academic.section || '';
          const fullClass = section ? `${className}-${section}` : className;
          console.log(`Student: ${student.name}, Class: ${fullClass}, Status: ${student.status}`);
      }
  });

  process.exit(0);
}
run().catch(console.error);
