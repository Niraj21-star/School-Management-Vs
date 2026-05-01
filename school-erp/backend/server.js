require('dotenv').config();

const app = require('./src/app');
const connectDatabase = require('./config/db');
const { seedDemoUsers } = require('./src/services/seedDemoUsers.service');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Ensure database is connected before starting the HTTP server.
    await connectDatabase();

    if (process.env.NODE_ENV !== 'production') {
      const seededUsers = await seedDemoUsers();
      const createdCount = seededUsers.filter((user) => user.created).length;
      if (createdCount > 0) {
        console.log(`Seeded ${createdCount} demo user${createdCount === 1 ? '' : 's'}`);
      }
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
