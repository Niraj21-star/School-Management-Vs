const { User } = require('../models/User');

const bootstrapProductionAdmin = async () => {
  try {
    // 1. Check if ANY users exist in the database
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      // Database is already populated, no need to bootstrap
      return false;
    }

    // 2. Check for required environment variables
    const email = process.env.PROD_ADMIN_EMAIL;
    const password = process.env.PROD_ADMIN_PASSWORD;

    if (!email || !password) {
      console.warn('⚠️ PROD_ADMIN_EMAIL or PROD_ADMIN_PASSWORD not set in environment variables.');
      console.warn('⚠️ Cannot create the initial production admin account.');
      return false;
    }

    // 3. Create the super-admin user
    await User.create({
      name: 'Super Admin',
      email: email.toLowerCase().trim(),
      password: password,
      role: 'admin',
    });

    console.log(`✅ Successfully bootstrapped initial production admin: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error bootstrapping production admin:', error.message);
    return false;
  }
};

module.exports = {
  bootstrapProductionAdmin,
};
