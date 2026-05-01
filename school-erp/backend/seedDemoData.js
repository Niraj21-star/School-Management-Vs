/**
 * Comprehensive Demo Data Seeder
 * Run:  node seedDemoData.js
 * 
 * This script wipes all non-user collections and populates the database
 * with realistic data so every feature of the ERP can be demonstrated.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

// ── Models ──────────────────────────────────────────────────────────────────
const { User }              = require('./src/models/User');
const SchoolClass           = require('./src/models/SchoolClass');
const Subject               = require('./src/models/Subject');
const Assignment            = require('./src/models/Assignment');
const { Student }           = require('./src/models/Student');
const StudentCounter        = require('./src/models/StudentCounter');
const Attendance            = require('./src/models/Attendance');
const Fee                   = require('./src/models/Fee');
const Payment               = require('./src/models/Payment');
const { Exam }              = require('./src/models/Exam');
const Mark                  = require('./src/models/Mark');
const { Timetable }         = require('./src/models/Timetable');
const { Notice }            = require('./src/models/Notice');
const { Homework }          = require('./src/models/Homework');
const { Expense }           = require('./src/models/Expense');
const { DocumentRecord }    = require('./src/models/DocumentRecord');

// ── Helpers ─────────────────────────────────────────────────────────────────
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
};

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── Main ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🔌 Connecting to MongoDB …');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // 1. WIPE all collections EXCEPT users
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🗑  Clearing old data (users are preserved) …');
  await Promise.all([
    SchoolClass.deleteMany({}),
    Subject.deleteMany({}),
    Assignment.deleteMany({}),
    Student.deleteMany({}),
    StudentCounter.deleteMany({}),
    Attendance.deleteMany({}),
    Fee.deleteMany({}),
    Payment.deleteMany({}),
    Exam.deleteMany({}),
    Mark.deleteMany({}),
    Timetable.deleteMany({}),
    Notice.deleteMany({}),
    Homework.deleteMany({}),
    Expense.deleteMany({}),
    DocumentRecord.deleteMany({}),
  ]);
  console.log('   Done.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // 2. USERS – make sure demo users exist
  // ──────────────────────────────────────────────────────────────────────────
  console.log('👤 Ensuring demo users …');
  const demoUsers = [
    { name: 'Admin User',   email: 'admin@school.com',   password: 'admin123',   role: 'admin'   },
    { name: 'Clerk User',   email: 'clerk@school.com',   password: 'clerk123',   role: 'clerk'   },
    { name: 'Rajesh Kumar', email: 'teacher@school.com', password: 'teacher123', role: 'teacher' },
    { name: 'Priya Sharma', email: 'teacher2@school.com', password: 'teacher123', role: 'teacher' },
  ];

  const users = {};
  for (const u of demoUsers) {
    let existing = await User.findOne({ email: u.email });
    if (!existing) {
      existing = await User.create(u);
      console.log(`   Created ${u.email}`);
    } else {
      console.log(`   ${u.email} already exists`);
    }
    users[u.role + (u.email.includes('2') ? '2' : '')] = existing;
  }
  const adminUser   = users.admin;
  const clerkUser   = users.clerk;
  const teacher1    = users.teacher;
  const teacher2    = users.teacher2;
  console.log();

  // ──────────────────────────────────────────────────────────────────────────
  // 3. CLASSES & SECTIONS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🏫 Creating classes …');
  const class10 = await SchoolClass.create({ name: '10', sections: ['A', 'B'] });
  const class9  = await SchoolClass.create({ name: '9',  sections: ['A', 'B'] });
  const class8  = await SchoolClass.create({ name: '8',  sections: ['A'] });
  console.log(`   Created: Class 10, Class 9, Class 8\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 4. SUBJECTS (per class)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📚 Creating subjects …');
  const subjectNames = ['Mathematics', 'Science', 'English', 'Hindi'];
  const subjects = {};

  for (const cls of [class10, class9, class8]) {
    subjects[cls.name] = {};
    for (const sName of subjectNames) {
      const sub = await Subject.create({ name: sName, classId: cls._id });
      subjects[cls.name][sName] = sub;
    }
  }
  console.log(`   Created ${subjectNames.length} subjects × 3 classes\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 5. TEACHER ASSIGNMENTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🔗 Assigning teachers to classes …');
  // Teacher 1 (Rajesh Kumar) → Class 10 Maths & Science
  await Assignment.create({ teacherId: teacher1._id, classId: class10._id, subjectId: subjects['10'].Mathematics._id });
  await Assignment.create({ teacherId: teacher1._id, classId: class10._id, subjectId: subjects['10'].Science._id });
  // Teacher 2 (Priya Sharma) → Class 9 English & Hindi
  await Assignment.create({ teacherId: teacher2._id, classId: class9._id,  subjectId: subjects['9'].English._id });
  await Assignment.create({ teacherId: teacher2._id, classId: class9._id,  subjectId: subjects['9'].Hindi._id });
  // Teacher 1 also teaches Class 8 Maths
  await Assignment.create({ teacherId: teacher1._id, classId: class8._id,  subjectId: subjects['8'].Mathematics._id });
  console.log(`   Rajesh Kumar → Class 10 (Maths, Science), Class 8 (Maths)`);
  console.log(`   Priya Sharma → Class 9 (English, Hindi)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 6. STUDENTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🎓 Creating students …');
  const studentData = [
    // Class 10-A (5 students)
    { name: 'Aarav Patel',    gender: 'male',   class: '10', section: 'A', rollNumber: '01', fatherName: 'Ramesh Patel',    motherName: 'Sunita Patel' },
    { name: 'Ananya Singh',   gender: 'female', class: '10', section: 'A', rollNumber: '02', fatherName: 'Vikram Singh',    motherName: 'Kavita Singh' },
    { name: 'Rohan Verma',    gender: 'male',   class: '10', section: 'A', rollNumber: '03', fatherName: 'Suresh Verma',    motherName: 'Meena Verma' },
    { name: 'Ishita Gupta',   gender: 'female', class: '10', section: 'A', rollNumber: '04', fatherName: 'Ajay Gupta',      motherName: 'Neha Gupta' },
    { name: 'Arjun Sharma',   gender: 'male',   class: '10', section: 'A', rollNumber: '05', fatherName: 'Deepak Sharma',   motherName: 'Pooja Sharma' },
    // Class 10-B (3 students)
    { name: 'Diya Joshi',     gender: 'female', class: '10', section: 'B', rollNumber: '01', fatherName: 'Mohan Joshi',     motherName: 'Rekha Joshi' },
    { name: 'Karan Mehta',    gender: 'male',   class: '10', section: 'B', rollNumber: '02', fatherName: 'Sanjay Mehta',    motherName: 'Priti Mehta' },
    { name: 'Simran Kaur',    gender: 'female', class: '10', section: 'B', rollNumber: '03', fatherName: 'Gurpreet Singh',  motherName: 'Harpreet Kaur' },
    // Class 9-A (4 students)
    { name: 'Vivaan Reddy',   gender: 'male',   class: '9',  section: 'A', rollNumber: '01', fatherName: 'Krishna Reddy',   motherName: 'Lakshmi Reddy' },
    { name: 'Aisha Khan',     gender: 'female', class: '9',  section: 'A', rollNumber: '02', fatherName: 'Imran Khan',      motherName: 'Fatima Khan' },
    { name: 'Dev Malhotra',   gender: 'male',   class: '9',  section: 'A', rollNumber: '03', fatherName: 'Rahul Malhotra',  motherName: 'Anjali Malhotra' },
    { name: 'Nisha Yadav',    gender: 'female', class: '9',  section: 'A', rollNumber: '04', fatherName: 'Bharat Yadav',    motherName: 'Rani Yadav' },
    // Class 8-A (3 students)
    { name: 'Rahul Tiwari',   gender: 'male',   class: '8',  section: 'A', rollNumber: '01', fatherName: 'Arvind Tiwari',   motherName: 'Sarita Tiwari' },
    { name: 'Prachi Dubey',   gender: 'female', class: '8',  section: 'A', rollNumber: '02', fatherName: 'Manoj Dubey',     motherName: 'Shweta Dubey' },
    { name: 'Aditya Saxena',  gender: 'male',   class: '8',  section: 'A', rollNumber: '03', fatherName: 'Pankaj Saxena',   motherName: 'Ritu Saxena' },
  ];

  const createdStudents = [];
  for (const s of studentData) {
    const student = await Student.create({
      name: s.name,
      dob: new Date(2010 + (10 - parseInt(s.class)), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      gender: s.gender,
      contact: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: `${Math.floor(Math.random() * 500) + 1}, Model Town, Jaipur, Rajasthan`,
      parent: {
        fatherName: s.fatherName,
        motherName: s.motherName,
        parentContact: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
      },
      academic: {
        class: s.class,
        section: s.section,
        rollNumber: s.rollNumber,
        admissionDate: daysAgo(Math.floor(Math.random() * 180) + 30),
      },
      status: 'active',
    });
    createdStudents.push(student);
  }

  const class10A = createdStudents.filter(s => s.academic.class === '10' && s.academic.section === 'A');
  const class10B = createdStudents.filter(s => s.academic.class === '10' && s.academic.section === 'B');
  const class9A  = createdStudents.filter(s => s.academic.class === '9'  && s.academic.section === 'A');
  const class8A  = createdStudents.filter(s => s.academic.class === '8'  && s.academic.section === 'A');

  console.log(`   Created ${createdStudents.length} students across 4 class-sections\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 7. ATTENDANCE (last 3 school days for class 10-A and 9-A)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📋 Seeding attendance …');
  const attendanceDays = [daysAgo(3), daysAgo(2), daysAgo(1)];

  for (const date of attendanceDays) {
    // Class 10-A
    await Attendance.create({
      classId: class10._id,
      section: 'A',
      date,
      students: class10A.map((s, i) => ({
        studentId: s._id,
        status: i === 2 && date.getTime() === daysAgo(1).getTime() ? 'absent' : 'present',
      })),
    });

    // Class 9-A
    await Attendance.create({
      classId: class9._id,
      section: 'A',
      date,
      students: class9A.map((s, i) => ({
        studentId: s._id,
        status: i === 0 && date.getTime() === daysAgo(2).getTime() ? 'leave' : 'present',
      })),
    });
  }
  console.log(`   Created 6 attendance records (3 days × 2 sections)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 8. FEES & PAYMENTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('💰 Seeding fees & payments …');
  const feeAmount = 25000;
  let paymentCount = 0;

  for (const student of createdStudents) {
    let paidAmount, status;

    // Mix of paid / partial / unpaid to show all statuses
    const idx = createdStudents.indexOf(student) % 3;
    if (idx === 0) {
      paidAmount = feeAmount; status = 'paid';
    } else if (idx === 1) {
      paidAmount = 10000;     status = 'partial';
    } else {
      paidAmount = 0;         status = 'unpaid';
    }

    await Fee.create({
      studentId: student._id,
      totalAmount: feeAmount,
      paidAmount,
      dueAmount: feeAmount - paidAmount,
      status,
    });

    // Create payment records for students who've paid something
    if (paidAmount > 0) {
      await Payment.create({
        studentId: student._id,
        amount: paidAmount,
        date: daysAgo(Math.floor(Math.random() * 15) + 1),
        mode: ['cash', 'upi', 'bank'][Math.floor(Math.random() * 3)],
      });
      paymentCount++;
    }
  }
  console.log(`   Created ${createdStudents.length} fee records, ${paymentCount} payments\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 9. EXAMS (1 completed, 1 upcoming)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📝 Seeding exams …');
  const midTerm = await Exam.create({
    name: 'Mid-Term Examination',
    class: 'All',
    startDate: daysAgo(20),
    endDate: daysAgo(15),
    createdBy: adminUser._id,
  });

  const finalExam = await Exam.create({
    name: 'Final Examination',
    class: 'All',
    startDate: daysFromNow(30),
    endDate: daysFromNow(40),
    createdBy: adminUser._id,
  });
  console.log(`   Mid-Term (Completed), Final (Upcoming)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 10. MARKS (Mid-Term marks for Class 10-A in Mathematics)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🎯 Seeding exam marks …');
  const gradeFromMarks = (m) => {
    if (m >= 90) return 'A+';
    if (m >= 80) return 'A';
    if (m >= 70) return 'B+';
    if (m >= 60) return 'B';
    if (m >= 50) return 'C';
    return 'D';
  };

  const markScores = [92, 85, 78, 63, 71]; // one per student in 10-A
  for (let i = 0; i < class10A.length; i++) {
    await Mark.create({
      examName: 'Mid-Term Examination',
      className: '10',
      section: 'A',
      subjectName: 'Mathematics',
      studentId: class10A[i]._id,
      teacherId: teacher1._id,
      marks: markScores[i],
      grade: gradeFromMarks(markScores[i]),
    });
  }

  // Also add Science marks
  const scienceScores = [88, 72, 91, 55, 66];
  for (let i = 0; i < class10A.length; i++) {
    await Mark.create({
      examName: 'Mid-Term Examination',
      className: '10',
      section: 'A',
      subjectName: 'Science',
      studentId: class10A[i]._id,
      teacherId: teacher1._id,
      marks: scienceScores[i],
      grade: gradeFromMarks(scienceScores[i]),
    });
  }
  console.log(`   Created ${class10A.length * 2} mark records (Maths + Science for 10-A)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 11. TIMETABLE
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🕐 Seeding timetable …');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [
    { period: 1, time: '08:00 - 08:45' },
    { period: 2, time: '08:45 - 09:30' },
    { period: 3, time: '09:45 - 10:30' },
    { period: 4, time: '10:30 - 11:15' },
    { period: 5, time: '11:30 - 12:15' },
    { period: 6, time: '12:15 - 01:00' },
  ];

  // Class 10 timetable — alternate Maths/Science for teacher1
  let ttCount = 0;
  for (const day of days) {
    for (const p of periods) {
      const isEvenPeriod = p.period % 2 === 0;
      await Timetable.create({
        classId: class10._id,
        subjectId: isEvenPeriod ? subjects['10'].Science._id : subjects['10'].Mathematics._id,
        teacherId: teacher1._id,
        day,
        period: p.period,
        time: p.time,
      });
      ttCount++;
    }
  }

  // Class 9 timetable — alternate English/Hindi for teacher2
  for (const day of days) {
    for (const p of periods.slice(0, 4)) { // only 4 periods for class 9
      const isEvenPeriod = p.period % 2 === 0;
      await Timetable.create({
        classId: class9._id,
        subjectId: isEvenPeriod ? subjects['9'].Hindi._id : subjects['9'].English._id,
        teacherId: teacher2._id,
        day,
        period: p.period,
        time: p.time,
      });
      ttCount++;
    }
  }
  console.log(`   Created ${ttCount} timetable entries\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 12. NOTICES
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📢 Seeding notices …');
  await Notice.create({
    title: 'Annual Sports Day 2026',
    content: 'Annual Sports Day will be held on 15th May 2026. All students must participate in at least one event. Report to the ground by 8:00 AM. Parents are welcome to attend.',
    priority: 'High',
    status: 'Published',
    author: 'Admin User',
    createdBy: adminUser._id,
  });

  await Notice.create({
    title: 'Parent-Teacher Meeting',
    content: 'PTM for all classes is scheduled on 10th May 2026 from 10:00 AM to 1:00 PM. Parents are requested to carry their child\'s report card.',
    priority: 'Medium',
    status: 'Published',
    author: 'Admin User',
    createdBy: adminUser._id,
  });

  await Notice.create({
    title: 'Summer Vacation Homework',
    content: 'Summer vacation homework sheets will be distributed on the last working day. Students must submit them on the first day after vacation.',
    priority: 'Low',
    status: 'Draft',
    author: 'Admin User',
    createdBy: adminUser._id,
  });
  console.log(`   Created 3 notices (2 published, 1 draft)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 13. HOMEWORK
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📄 Seeding homework …');
  await Homework.create({
    className: '10',
    section: 'A',
    subject: 'Mathematics',
    title: 'Chapter 5 — Quadratic Equations',
    description: 'Solve exercises 5.1 to 5.3 from the NCERT textbook. Show all working steps.',
    dueDate: daysFromNow(3),
    status: 'Active',
    teacherId: teacher1._id,
  });

  await Homework.create({
    className: '10',
    section: 'A',
    subject: 'Science',
    title: 'Lab Report — Chemical Reactions',
    description: 'Write a detailed lab report on the experiment conducted on acid-base reactions.',
    dueDate: daysFromNow(5),
    status: 'Active',
    teacherId: teacher1._id,
  });

  await Homework.create({
    className: '9',
    section: 'A',
    subject: 'English',
    title: 'Essay Writing',
    description: 'Write a 500-word essay on "My Role in Environmental Conservation".',
    dueDate: daysFromNow(4),
    status: 'Active',
    teacherId: teacher2._id,
  });
  console.log(`   Created 3 homework assignments\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 14. EXPENSES
  // ──────────────────────────────────────────────────────────────────────────
  console.log('💸 Seeding expenses …');
  const expensesData = [
    { title: 'April Teacher Salaries',       category: 'salary',       amount: 150000, date: daysAgo(5),  notes: 'Monthly salary disbursement for 8 teaching staff' },
    { title: 'Electricity Bill — April',     category: 'electricity',  amount: 12000,  date: daysAgo(10), notes: 'JVVNL bill for Apr 2026' },
    { title: 'Classroom Furniture Repair',   category: 'maintenance',  amount: 8500,   date: daysAgo(15), notes: 'Replaced broken desks and chairs in Class 10-B' },
    { title: 'School Bus Diesel',            category: 'transport',    amount: 22000,  date: daysAgo(3),  notes: 'Diesel for April month' },
    { title: 'Republic Day Celebration',     category: 'event',        amount: 5000,   date: daysAgo(90), notes: 'Stage, decorations, and refreshments' },
    { title: 'Stationery for Office',        category: 'other',        amount: 3200,   date: daysAgo(7),  notes: 'Registers, pens, toner cartridges' },
  ];

  for (const exp of expensesData) {
    await Expense.create(exp);
  }
  console.log(`   Created ${expensesData.length} expense records\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 15. DOCUMENT RECORDS (for clerk Documents module)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📎 Seeding document records …');
  const docTypes = ['Transfer Certificate', 'Marksheet', 'ID Proof', 'Bonafide'];
  let docCount = 0;
  for (let i = 0; i < Math.min(6, createdStudents.length); i++) {
    const docType = docTypes[i % docTypes.length];
    await DocumentRecord.create({
      studentId: createdStudents[i]._id,
      name: `${createdStudents[i].name} — ${docType}`,
      type: docType,
      status: i < 4 ? 'Uploaded' : 'Pending',
      fileName: `${docType.toLowerCase().replace(/\s+/g, '_')}_${createdStudents[i].academic.rollNumber}.pdf`,
      fileMimeType: 'application/pdf',
      fileSize: Math.floor(Math.random() * 500000) + 50000,
      uploadedBy: clerkUser._id,
    });
    docCount++;
  }
  console.log(`   Created ${docCount} document records\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // Done!
  // ──────────────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅  ALL DEMO DATA SEEDED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════');
  console.log();
  console.log('Login Credentials:');
  console.log('  Admin   → admin@school.com   / admin123');
  console.log('  Clerk   → clerk@school.com   / clerk123');
  console.log('  Teacher → teacher@school.com / teacher123');
  console.log('           teacher2@school.com / teacher123');
  console.log();
  console.log('Data Summary:');
  console.log(`  Classes   : 3 (Class 8, 9, 10)`);
  console.log(`  Subjects  : ${subjectNames.length * 3}`);
  console.log(`  Students  : ${createdStudents.length}`);
  console.log(`  Attendance: 6 records (3 days)`);
  console.log(`  Fees      : ${createdStudents.length} (paid/partial/unpaid)`);
  console.log(`  Payments  : ${paymentCount}`);
  console.log(`  Exams     : 2 (1 completed, 1 upcoming)`);
  console.log(`  Marks     : ${class10A.length * 2}`);
  console.log(`  Timetable : ${ttCount} entries`);
  console.log(`  Notices   : 3`);
  console.log(`  Homework  : 3`);
  console.log(`  Expenses  : ${expensesData.length}`);
  console.log(`  Documents : ${docCount}`);
  console.log();

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
