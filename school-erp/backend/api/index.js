require('dotenv').config();
const app = require('../src/app');
const connectDatabase = require('../config/db');

let isDbConnected = false;

module.exports = async (req, res) => {
  if (!isDbConnected) {
    // Prevent process.exit in serverless environment
    const originalExit = process.exit;
    process.exit = (code) => {
      console.warn(`process.exit(${code}) called, but ignored in Vercel serverless function.`);
    };

    try {
      await connectDatabase();
      isDbConnected = true;
    } catch (err) {
      console.error("Failed to connect to database in Vercel handler", err);
      return res.status(500).json({ error: "Database connection failed" });
    }
  }

  // Delegate request to the Express app
  return app(req, res);
};
