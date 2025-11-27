const mongoose = require('mongoose');

const productEnquirySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [
      /^[6-9]\d{9}$/,
      'Please provide a valid 10-digit Indian phone number'
    ]
  },
  estimatedQuantity: {
    type: String,
    trim: true,
    default: ''
  },
  productInterest: {
    type: String,
    required: [true, 'Product interest is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters long'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  terms: {
    type: Boolean,
    required: [true, 'You must agree to terms and conditions'],
    validate: {
      validator: function(value) {
        return value === true;
      },
      message: 'You must agree to terms and conditions'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'qualified', 'converted', 'rejected'],
    default: 'pending'
  },
  source: {
    type: String,
    default: 'website'
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  notes: [{
    content: String,
    addedBy: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followUpDate: {
    type: Date
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productEnquirySchema.index({ email: 1 });
productEnquirySchema.index({ phone: 1 });
productEnquirySchema.index({ status: 1 });
productEnquirySchema.index({ createdAt: -1 });
productEnquirySchema.index({ productInterest: 1 });

// Virtual for time elapsed since enquiry
productEnquirySchema.virtual('timeElapsed').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
});

// Pre-save middleware to sanitize phone number
productEnquirySchema.pre('save', function(next) {
  if (this.phone) {
    this.phone = this.phone.replace(/\D/g, '');
  }
  next();
});

// Static method to get enquiries by status
productEnquirySchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get recent enquiries
productEnquirySchema.statics.getRecent = function(limit = 10) {
  return this.find().sort({ createdAt: -1 }).limit(limit);
};

// Instance method to add note
productEnquirySchema.methods.addNote = function(content, addedBy) {
  this.notes.push({
    content,
    addedBy,
    addedAt: new Date()
  });
  return this.save();
};

// Instance method to update status
productEnquirySchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

const ProductEnquiry = mongoose.model('ProductEnquiry', productEnquirySchema);

module.exports = ProductEnquiry;