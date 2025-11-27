const mongoose = require('mongoose');
const slugify = require('slugify');

const eventSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  coverImage: {
    type: String,
    required: true,
    trim: true
  },
  images: {
    type: [String], 
    required: true,
    validate: {
      validator: function(val) {
        return val.length > 0;
      },
      message: 'At least one image is required'
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for common queries
eventSchema.index({ date: -1, slug: 1 });

// Pre-save hook to auto-generate slug from title
eventSchema.pre('save', async function(next) {
  // Only generate slug if title is modified or it's a new document
  if (this.isModified('title') || this.isNew) {
    let baseSlug = slugify(this.title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug uniqueness
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Static method to find by slug (optimized with lean for read-only operations)
eventSchema.statics.findBySlug = function(slug, lean = true) {
  const query = this.findOne({ slug });
  return lean ? query.lean() : query;
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function(limit = 10) {
  return this.find({ date: { $gte: new Date() } })
    .sort({ date: 1 })
    .limit(limit)
    .lean();
};

// Static method to find events by date range
eventSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  })
  .sort({ date: -1 })
  .lean();
};

// Instance method to check if event is upcoming
eventSchema.methods.isUpcoming = function() {
  return this.date >= new Date();
};

// Virtual for formatted date (example)
eventSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

module.exports = mongoose.model('Event', eventSchema);