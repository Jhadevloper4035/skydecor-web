const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  images: {
    type: [String], 
    required: true,
    validate: [arrayLimit, '{PATH} must have at least one image']
  }
});

// Custom validator to ensure images array is not empty
function arrayLimit(val) {
  return val.length > 0;
}

module.exports = mongoose.model('Event', eventSchema);
