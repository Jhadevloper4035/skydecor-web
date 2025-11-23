const express = require("express");
const router = express.Router();

const {
  createProductEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  addEnquiryNote,
  deleteEnquiry,
  getEnquiryStats,
} = require("../controllers/productEnquiry.js");

const {
  createContactLead,
  getAllContactLeads,
  getLeadStats,
  getContactLeadById,
  updateContactLead,
  deleteContactLead,
} = require("../controllers/contactLead.controller.js");

const jobApplicationController = require("../controllers/jobaplication.controller.js");

// Middleware for authentication (you need to create this)
// const { protect, authorize } = require('../middleware/auth');

// Product eqnuiry Route route
router.post("/productEnquiry", createProductEnquiry);

// Protected routes (uncomment when you have auth middleware)
// router.get('/productEnquiry', protect, authorize('admin'), getAllEnquiries);
// router.get('/productEnquiry/stats', protect, authorize('admin'), getEnquiryStats);
// router.get('/productEnquiry/:id', protect, authorize('admin'), getEnquiryById);
// router.put('/productEnquiry/:id/status', protect, authorize('admin'), updateEnquiryStatus);
// router.post('/productEnquiry/:id/note', protect, authorize('admin'), addEnquiryNote);
// router.delete('/productEnquiry/:id', protect, authorize('admin'), deleteEnquiry);

// Create new contact lead (form submission)
router.post("/contactlead", createContactLead);
// router.get("/contactleads", getAllContactLeads);
// router.get("/stats", getLeadStats);
// router.get("/contactlead/:id", getContactLeadById);
// router.patch("/contactlead/:id", updateContactLead);
// router.delete("/contactlead/:id", deleteContactLead);

router.post(
  "/jobapplication",
  jobApplicationController.uploadResume,
  jobApplicationController.handleUploadErrors,
  jobApplicationController.submitApplication
);


router.get(
  "/jobapplications",
  // Add your authentication middleware here
  // authMiddleware.isAdmin,
  jobApplicationController.getAllApplications
);

router.get(
  "/jobapplication/:id",
  // Add your authentication middleware here
  // authMiddleware.isAdmin,
  jobApplicationController.getApplicationById
);

router.patch(
  "/jobapplication/:id",
  // Add your authentication middleware here
  // authMiddleware.isAdmin,
  jobApplicationController.updateApplicationStatus
);

router.delete(
  "/jobapplication/:id",
  // Add your authentication middleware here
  // authMiddleware.isAdmin,
  jobApplicationController.deleteApplication
);

/**
 * @route   GET /api/lead/jobapplication/:id/resume
 * @desc    Download resume file for an application
 * @access  Private/Admin
 */
router.get(
  "/jobapplication/:id/resume",
  // Add your authentication middleware here
  // authMiddleware.isAdmin,
  jobApplicationController.downloadResume
);

module.exports = router;
