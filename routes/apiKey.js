const route = require("express").Router();
const ApiKey = require("../models/apiKey.js");
const { generateKey, hashKey } = require("../util/key-utils.js");
const apiKeyMiddleware = require("../middleware/apiKey.js");
const requireAdmin = require("../middleware/admin.js");

// create a new API key — returns **plain key** only once
route.post("/genrate", requireAdmin, async (req, res) => {
  try {
    const { name, notes } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });

    const plainKey = generateKey(32); // 64 hex chars
    const hash = hashKey(plainKey);

    const doc = await ApiKey.create({ name, hash, notes });
    // Return plain key to admin **only now** (they must copy it and share securely)
    res.json({ id: doc._id, name: doc.name, apiKey: plainKey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating key" });
  }
});

// list keys
route.get("/list", requireAdmin, async (req, res) => {
  const list = await ApiKey.find({}, "-hash").lean(); // do not return hash
  res.json(list);
});

// revoke key
route.post("/revoke/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  await ApiKey.updateOne({ _id: id }, { $set: { revoked: true } });
  res.json({ ok: true });
});

// un-revoke
route.post("/unrevoke/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  await ApiKey.updateOne({ _id: id }, { $set: { revoked: false } });
  res.json({ ok: true });
});

module.exports = route;
