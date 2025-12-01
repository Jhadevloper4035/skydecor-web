const express = require("express");
const router = express.Router();
const requireAdmin = require("../middleware/admin.js");

const {
  createProductEnquiry,
  getAllEnquiries,
  downloadAllEnquiries,
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
} = require("../controllers/enquiry.js");

const {
  uploadResume,
  handleUploadErrors,
  getAllApplications,
  submitApplication,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  downloadResume,
} = require("../controllers/jobEnquiry.js");

// Middleware for authentication (you need to create this)
// const { protect, authorize } = require('../middleware/auth');

// Product eqnuiry Route route
router.post("/productEnquiry", createProductEnquiry);
router.get("/productEnquiry", requireAdmin, getAllEnquiries);
router.get("/all/productEnquiry", requireAdmin, downloadAllEnquiries);
router.delete('/productEnquiry/:id', requireAdmin, deleteEnquiry);

// Protected routes (uncomment when you have auth middleware)
// router.get('/productEnquiry/stats', protect, authorize('admin'), getEnquiryStats);
// router.get('/productEnquiry/:id', protect, authorize('admin'), getEnquiryById);
// router.put('/productEnquiry/:id/status', protect, authorize('admin'), updateEnquiryStatus);
// router.post('/productEnquiry/:id/note', protect, authorize('admin'), addEnquiryNote);

// Create new contact lead (form submission)
router.post("/contactlead", createContactLead);
router.get("/contactleads", requireAdmin, getAllContactLeads);
// router.get("/stats", getLeadStats);
// router.get("/contactlead/:id", getContactLeadById);
// router.patch("/contactlead/:id", updateContactLead);
router.delete("/contactlead/:id", requireAdmin , deleteContactLead);

router.post("/jobapplication",
  uploadResume,
  handleUploadErrors,
  submitApplication
);  

router.get("/jobapplications", requireAdmin , getAllApplications);

router.get("/jobapplication/:id", getApplicationById);

router.patch("/jobapplication/:id", updateApplicationStatus);

router.delete("/jobapplication/:id", deleteApplication);

router.get("/jobapplication/:id/resume", downloadResume);

module.exports = router;
