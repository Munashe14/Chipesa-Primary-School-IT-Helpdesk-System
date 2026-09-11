const bcrypt = require('bcryptjs');

const passwords = [
  'Admin@123',
  'Tech@123',
  'Staff@123',
  'Manage@123'
];

async function generateHashes() {
  for (const password of passwords) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log('---');
  }
}

generateHashes();
