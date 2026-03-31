const bcrypt = require('bcrypt');

const saltRounds = 10;

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

async function verifyPassword(password, hash) {
    const result = await bcrypt.compare(password, hash);
    return result;
}

module.exports = { hashPassword, verifyPassword };
