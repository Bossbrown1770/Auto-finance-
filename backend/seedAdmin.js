const mongoose = require('mongoose');
const User = require('./models/User');
const config = require('./config/env');

async function seedAdmin() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'awosangrooney01@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit();
    }

    // Create super admin
    const admin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'awosangrooney01@gmail.com',
      password: 'Suhman12',
      passwordConfirm: 'Suhman12',
      role: 'admin',
      adminApproved: true
    });

    console.log('✅ Super Admin created:', admin.email);
    process.exit();
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

seedAdmin();