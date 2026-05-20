const REQUIRED_ENV = [
  'MONGO_URI',
  'JWT_SECRET',
  'CORS_ORIGIN'
];

const validateEnv = () => {
  const missing = [];
  
  for (const envVar of REQUIRED_ENV) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', '❌ CRITICAL CONFIGURATION ERROR: Missing required environment variables:');
    missing.forEach(variable => {
      console.error('\x1b[33m%s\x1b[0m', `   - ${variable}`);
    });
    console.error('\x1b[31m%s\x1b[0m', 'Please check your .env file or host environment settings.');
    process.exit(1);
  }

  // Warn about weak JWT Secret
  if (process.env.JWT_SECRET === 'replace_with_a_strong_secret') {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️ WARNING: JWT_SECRET is still using the default placeholder value. Please update it in production!');
  }

  // Set NODE_ENV to production if not set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  console.log('\x1b[32m%s\x1b[0m', '✔ Environment variables validated successfully.');
};

module.exports = {
  validateEnv
};
