const mongoose = require("mongoose");

const contactLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must not exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[\d\s\+\-\(\)]{10,15}$/, "Please enter a valid phone number"],
    },
    enquiryType: {
      type: String,
      required: [true, "Enquiry type is required"],
      enum: [
        "Product Information",
        "Price Quote",
        "Dealer Enquiry",
        "Support",
        "Bulk Order",
        "Other",
      ],
    },
    comments: {
      type: String,
      required: [true, "Comments are required"],
      trim: true,
      minlength: [10, "Comments must be at least 10 characters"],
      maxlength: [500, "Comments must not exceed 500 characters"],
    },
    products: {
      type: [String],
      required: [true, "At least one product must be selected"],
      validate: {
        validator: function (products) {
          return products && products.length > 0;
        },
        message: "At least one product must be selected",
      },
      enum: [
        "ACRYLISH LAMINATES",
        "PVC LAMINATES",
        "1 MM + LAMINATES",
        "0.8 MM LAMINATES",
        "LINER",
        "SOFFITO PANELS",
        "EXTERIOR CLADDING",
      ],
    },
    consent: {
      type: Boolean,
      required: [true, "Consent is required"],
      validate: {
        validator: function (value) {
          return value === true;
        },
        message: "You must provide consent to store your information",
      },
    },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "converted", "closed"],
      default: "new",
    },
    source: {
      type: String,
      default: "website",
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Indexes for better query performance
contactLeadSchema.index({ email: 1 });
contactLeadSchema.index({ phone: 1 });
contactLeadSchema.index({ createdAt: -1 });
contactLeadSchema.index({ status: 1 });

// Virtual for full submission date
contactLeadSchema.virtual("submittedDate").get(function () {
  return this.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Method to format products as comma-separated string
contactLeadSchema.methods.getProductsString = function () {
  return this.products.join(", ");
};

// Static method to get leads by status
contactLeadSchema.statics.getByStatus = function (status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to get recent leads
contactLeadSchema.statics.getRecent = function (limit = 10) {
  return this.find().sort({ createdAt: -1 }).limit(limit);
};

// Pre-save middleware to ensure products is always an array
contactLeadSchema.pre("save", function (next) {
  if (this.products && !Array.isArray(this.products)) {
    this.products = [this.products];
  }
  next();
});

const ContactLead = mongoose.model("ContactLead", contactLeadSchema);

module.exports = ContactLead;
