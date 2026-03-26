/**
 * Run once to designate the primary admin by email.
 * Usage: node src/scripts/setPrimaryAdmin.js admin@estatehub.com
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node src/scripts/setPrimaryAdmin.js <admin-email>');
  process.exit(1);
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  // Clear any existing primary flag
  await User.updateMany({ isPrimary: true }, { isPrimary: false });

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase(), role: 'admin' },
    { isPrimary: true },
    { new: true }
  );

  if (!user) {
    console.error(`No admin found with email: ${email}`);
    process.exit(1);
  }

  console.log(`✅ Primary admin set: ${user.name} (${user.email})`);
  await mongoose.disconnect();
})();
