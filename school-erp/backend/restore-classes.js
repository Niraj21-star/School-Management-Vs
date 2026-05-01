require('dotenv').config();
const mongoose = require('mongoose');

async function fixClasses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Insert missing classes 9 and 10
    const class9 = {
      name: '9',
      sections: ['A', 'B'],
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };
    
    const class10 = {
      name: '10',
      sections: ['A', 'B'],
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };

    const existing10 = await db.collection('schoolclasses').findOne({ name: '10' });
    if (!existing10) {
      await db.collection('schoolclasses').insertOne(class10);
      console.log('Inserted Class 10');
    }

    const existing9 = await db.collection('schoolclasses').findOne({ name: '9' });
    if (!existing9) {
      await db.collection('schoolclasses').insertOne(class9);
      console.log('Inserted Class 9');
    }
    
    console.log('Classes restored successfully.');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixClasses();
