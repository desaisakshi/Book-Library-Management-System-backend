require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('./database');
const { User } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync({ alter: true });
    console.log('✅ Tables synced');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@library.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const [admin, created] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        email: adminEmail,
        password_hash: adminPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_verified: true
      }
    });

    if (created) {
      console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log(`ℹ️  Admin already exists: ${adminEmail}`);
    }

    console.log('\n🎉 Seed complete! Start the server with: npm run dev\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
