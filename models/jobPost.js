const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    // Personal Information
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[\d\s\+\-\(\)]{10,15}$/, "Please enter a valid phone number"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      minlength: [2, "City must be at least 2 characters"],
      maxlength: [50, "City cannot exceed 50 characters"],
    },

    // Job Details
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job ID is required"],
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
    },
    experience: {
      type: String,
      required: [true, "Experience level is required"],
      enum: [
        "Fresher",
        "0-1 years",
        "1-3 years",
        "3-5 years",
        "5-10 years",
        "10+ years",
      ],
    },
    qualification: {
      type: String,
      required: [true, "Qualification is required"],
      trim: true,
      minlength: [2, "Qualification must be at least 2 characters"],
      maxlength: [100, "Qualification cannot exceed 100 characters"],
    },
    currentCompany: {
      type: String,
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
      default: "",
    },

    // Cover Letter
    coverLetter: {
      type: String,
      required: [true, "Cover letter is required"],
      trim: true,
      minlength: [50, "Cover letter must be at least 50 characters"],
      maxlength: [1000, "Cover letter cannot exceed 1000 characters"],
    },

    // Resume File
    resume: {
      filename: {
        type: String,
        required: [true, "Resume filename is required"],
      },
      originalName: {
        type: String,
        required: [true, "Original filename is required"],
      },
      path: {
        type: String,
        required: [true, "Resume path is required"],
      },
      size: {
        type: Number,
        required: [true, "File size is required"],
      },
      mimetype: {
        type: String,
        required: [true, "File type is required"],
        enum: ["application/pdf"],
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },

    // Consent
    consent: {
      type: Boolean,
      required: [true, "Consent is required"],
      validate: {
        validator: function (v) {
          return v === true;
        },
        message: "You must consent to data storage",
      },
    },

    // Application Status
    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "rejected", "hired"],
      default: "pending",
    },

    // Metadata
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
jobApplicationSchema.index({ email: 1 });
jobApplicationSchema.index({ jobId: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ submittedAt: -1 });

// Virtual for application age in days
jobApplicationSchema.virtual("daysOld").get(function () {
  return Math.floor((Date.now() - this.submittedAt) / (1000 * 60 * 60 * 24));
});

// Method to get formatted file size
jobApplicationSchema.methods.getFormattedFileSize = function () {
  const bytes = this.resume.size;
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Pre-save hook to capture IP and User Agent if available
jobApplicationSchema.pre("save", function (next) {
  if (this.isNew && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  next();
});

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

module.exports = JobApplication;
