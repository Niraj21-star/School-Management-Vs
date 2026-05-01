require('dotenv').config();
const mongoose = require('mongoose');

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check students
    const students = await db.collection('students').find().limit(5).toArray();
    console.log('\n=== STUDENTS (first 5) ===');
    students.forEach(s => console.log(JSON.stringify(s, null, 2)));

    // Check users
    const users = await db.collection('users').find().limit(5).toArray();
    console.log('\n=== USERS (first 5) ===');
    users.forEach(s => console.log(JSON.stringify(s, null, 2)));

    // Check fees
    const fees = await db.collection('fees').find().limit(5).toArray();
    console.log('\n=== FEES (first 5) ===');
    fees.forEach(f => console.log(JSON.stringify(f, null, 2)));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDB();
