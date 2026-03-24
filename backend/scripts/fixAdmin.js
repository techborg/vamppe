const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const User = require('../models/User');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await User.updateOne(
    { email: 'admin@vamppe.com' },
    { isAdmin: true, verified: true, emailVerified: true }
  );
  console.log('Updated:', result.modifiedCount, 'document(s)');
  const u = await User.findOne({ email: 'admin@vamppe.com' });
  console.log('isAdmin:', u.isAdmin);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
