const User = require('../models/User');

// Ensures there is exactly ONE admin account, created from env vars on first boot.
// Prevents anyone from registering as admin through the public register endpoint.
const seedAdmin = async () => {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) return;

  const name = process.env.ADMIN_NAME || 'Super Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@clubconnect.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';

  await User.create({ name, email, password, role: 'admin', membershipStatus: 'accepted' });
  console.log(`Seeded single admin account -> ${email} (change password after first login!)`);
};

module.exports = seedAdmin;
