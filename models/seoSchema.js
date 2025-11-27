const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    productType: {
      type: String,
      enum: [
        "PVC",
        "Acrylish",
        "1mm",
        "0.8mm",
        "SOFFITTO",
        "liner",
        "Baffele",
        "Exterior cladding",
        "Skybond"
      ],
      default: "default",
      required: true,
    },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    banners: [
      {
        device: { type: String, enum: ["desktop", "tablet", "mobile"], required: true },
        image: { type: String, required: true },
      }
    ],
    content: { type: String }, // optional rich content
  },
  { timestamps: true }
);

module.exports = mongoose.model("Page", pageSchema);
