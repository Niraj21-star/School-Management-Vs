import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import Student from './src/models/Student.js';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const students = await Student.find({}, 'studentId name status');
  console.log('Total students:', students.length);
  
  const activeStudents = students.filter(s => s.status === 'active');
  const inactiveStudents = students.filter(s => s.status === 'inactive');
  const otherStudents = students.filter(s => s.status !== 'active' && s.status !== 'inactive');

  console.log('Active:', activeStudents.length);
  console.log('Inactive:', inactiveStudents.length);
  console.log('Other:', otherStudents.length);

  if (otherStudents.length > 0) {
    console.log('Other statuses:', otherStudents.map(s => s.status));
  }

  mongoose.disconnect();
}

test().catch(console.error);
