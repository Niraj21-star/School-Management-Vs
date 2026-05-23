const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const { buildStudentFilters } = require('./src/services/student.service');
const { Student } = require('./src/models/Student');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const query = { class: '10', section: 'A', status: 'active' };
  const filters = buildStudentFilters(query);
  console.log('Filters generated:', filters);

  const students = await Student.find(filters).lean();
  console.log(`Students returned for query (status: active): ${students.length}`);
  students.forEach(s => console.log(`- ${s.name} (Status: ${s.status})`));

  process.exit(0);
}
run().catch(console.error);
