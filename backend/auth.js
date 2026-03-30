const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function verifyPassword(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}

module.exports = { hashPassword, verifyPassword };
