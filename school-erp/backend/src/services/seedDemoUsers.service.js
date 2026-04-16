const { User } = require('../models/User');

const DEMO_USERS = [
  { name: 'Admin User', email: 'admin@school.com', password: 'admin123', role: 'admin' },
  { name: 'Clerk User', email: 'clerk@school.com', password: 'clerk123', role: 'clerk' },
  { name: 'Teacher User', email: 'teacher@school.com', password: 'teacher123', role: 'teacher' },
];

const seedDemoUsers = async () => {
  const results = [];

  for (const demoUser of DEMO_USERS) {
    const existingUser = await User.findOne({ email: demoUser.email });

    if (existingUser) {
      results.push({ email: demoUser.email, created: false });
      continue;
    }

    await User.create(demoUser);
    results.push({ email: demoUser.email, created: true });
  }

  return results;
};

module.exports = {
  DEMO_USERS,
  seedDemoUsers,
};