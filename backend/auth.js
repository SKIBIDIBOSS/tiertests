const bcrypt = require('bcrypt');

const saltRounds = 10;

async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        console.error('Hash error:', error);
        throw error;
    }
}

async function verifyPassword(password, hash) {
    try {
        const result = await bcrypt.compare(password, hash);
        return result;
    } catch (error) {
        console.error('Verify error:', error);
        return false;
    }
}

module.exports = { hashPassword, verifyPassword };
