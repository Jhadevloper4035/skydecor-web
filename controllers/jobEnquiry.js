const JobApplication = require('../models/jobPost.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/resumes');
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Create unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, 'resume-' + uniqueSuffix + '-' + sanitizedName);
  }
});

// File filter to accept only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware to handle file upload
exports.uploadResume = upload.single('resume');

// Handle multer errors
exports.handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size must be less than 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Error uploading file'
    });
  }
  next();
};

// Submit job application
exports.submitApplication = async (req, res) => {
  try {
    // Validate that file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resume file is required'
      });
    }

    // Extract form data
    const {
      fullName,
      email,
      phone,
      city,
      jobId,
      position,
      experience,
      qualification,
      currentCompany,
      coverLetter,
      consent
    } = req.body;

    // Validate consent
    if (consent !== 'true' && consent !== true) {
      // Delete uploaded file if consent is not given
      await fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
      
      return res.status(400).json({
        success: false,
        message: 'You must consent to data storage to submit this application'
      });
    }

    // Prepare resume data
    const resumeData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date()
    };

    // Capture request metadata
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Create job application
    const application = new JobApplication({
      fullName,
      email,
      phone,
      city,
      jobId,
      position,
      experience,
      qualification,
      currentCompany: currentCompany || '',
      coverLetter,
      resume: resumeData,
      consent: true,
      ipAddress,
      userAgent,
      status: 'pending'
    });

    // Save to database
    await application.save();

    // Send success response with redirect URL
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      redirectUrl: '/thankyou',
      data: {
        applicationId: application._id,
        submittedAt: application.submittedAt
      }
    });

  } catch (error) {
    // If there's an error and a file was uploaded, delete it
    if (req.file) {
      await fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
    }

    console.error('Job application submission error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
        errors: error.errors
      });
    }

    // Handle duplicate email for same job (if you add unique index)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this position with this email'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Failed to submit application. Please try again later.'
    });
  }
};

// Get all applications (admin endpoint)
exports.getAllApplications = async (req, res) => {
  try {
    const { status, jobId, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (jobId) query.jobId = jobId;

    const applications = await JobApplication.find(query)
      .populate('jobId', 'title department location')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await JobApplication.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
};

// Get single application by ID (admin endpoint)
exports.getApplicationById = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id)
      .populate('jobId', 'title department location salary employmentType');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application'
    });
  }
};

// Update application status (admin endpoint)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;

    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const application = await JobApplication.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: application
    });

  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application'
    });
  }
};

// Delete application (admin endpoint)
exports.deleteApplication = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Delete the resume file
    if (application.resume && application.resume.path) {
      await fs.unlink(application.resume.path).catch(err => 
        console.error('Error deleting resume file:', err)
      );
    }

    // Delete the application from database
    await JobApplication.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting application'
    });
  }
};

// Download resume file (admin endpoint)
exports.downloadResume = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (!application.resume || !application.resume.path) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found'
      });
    }

    // Check if file exists
    try {
      await fs.access(application.resume.path);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found on server'
      });
    }

    // Send file for download
    res.download(
      application.resume.path,
      application.resume.originalName,
      (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Error downloading file'
            });
          }
        }
      }
    );

  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading resume'
    });
  }
};