const ApiKey = require('../models/apiKey.js');
const { hashKey } = require('../util/key-utils.js');

async function apiKeyMiddleware(req, res, next) {
  try {
    const key = req.header('x-api-key');
    if (!key) return res.status(401).json({ error: 'Missing API key (x-api-key header)' });

    const hashed = hashKey(key);

    const doc = await ApiKey.findOne({ hash: hashed }).exec();
    if (!doc || doc.revoked) return res.status(403).json({ error: 'Invalid or revoked API key' });

    // Optionally set info on req for logging/rate limiting/owner check:
    req.apiKeyOwner = { id: doc._id, name: doc.name };
    // update last used timestamp (non-blocking)
    ApiKey.updateOne({ _id: doc._id }, { $set: { lastUsedAt: new Date() } }).catch(() => {});
    next();
  } catch (err) {
    console.error('API key middleware error', err);
    res.status(500).json({ error: 'Server error validating API key' });
  }
}

module.exports = apiKeyMiddleware;
