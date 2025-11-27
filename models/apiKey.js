const mongoose = require("mongoose");

const ApiKeySchema = new mongoose.Schema({
  name: { type: String, required: true }, // human friendly name (client app)
  hash: { type: String, required: true }, // sha256 hash of the key
  createdAt: { type: Date, default: Date.now },
  revoked: { type: Boolean, default: false },
  notes: { type: String },
  lastUsedAt: { type: Date },
});

module.exports = mongoose.model("ApiKey", ApiKeySchema);
