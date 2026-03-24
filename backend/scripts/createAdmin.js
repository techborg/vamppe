const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to:', process.env.MONGO_URI);

  const email = 'admin@vamppe.com';
  const plainPassword = 'Admin@vamppe1';
  const password = await bcrypt.hash(plainPassword, 12);

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { username: 'vamppe_admin', password, isAdmin: true, verified: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Verify the hash works
  const ok = await bcrypt.compare(plainPassword, user.password);
  console.log('✓ Account ready, hash verify:', ok);
  console.log('  Email:    admin@vamppe.com');
  console.log('  Password: Admin@vamppe1');
  console.log('  isAdmin:', user.isAdmin);
  console.log('  Login at: http://localhost:5173/admin/login');
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
