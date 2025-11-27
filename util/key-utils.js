const crypto = require('crypto');

function generateKey(length = 32) {
  // generate a strong random key (hex)
  return crypto.randomBytes(length).toString('hex'); // 64 chars if length=32
}

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

module.exports = { generateKey, hashKey };
