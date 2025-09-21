const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    id: {
      type: String, // you can also use Number if it's numeric
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
