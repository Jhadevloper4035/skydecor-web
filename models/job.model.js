const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    posted: {
      type: String, 
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("Job", JobSchema);
