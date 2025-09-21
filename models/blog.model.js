const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    meta_name: {
      type: String,
      default: null,
    },
    meta_tags: {
      type: String,
      default: null,
    },
    meta_title: {
      type: String,
      default: null,
    },
    meta_description: {
      type: String,
      default: null,
    },
    author: {
      type: String,
      default: "Admin",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Blog", blogSchema);
