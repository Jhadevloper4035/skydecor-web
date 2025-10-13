const mongoose = require("mongoose");

// Custom validator to ensure images array is not empty
function arrayLimit(val) {
  return val.length > 0;
}

const showroomSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    mail: {
      type: String,
      trim: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    contact: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, "Please fill a valid contact number"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    maplink: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
    },
    images: {
      type: [String],
      required: true,
      default: [],
      validate: [arrayLimit, "{PATH} must have at least one image"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Showroom", showroomSchema);
