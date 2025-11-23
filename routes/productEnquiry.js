const express = require('express');
const router = express.Router();

const {
    createProductEnquiry,
    getAllEnquiries,
    getEnquiryById,
    updateEnquiryStatus,
    addEnquiryNote,
    deleteEnquiry,
    getEnquiryStats
} = require('../controllers/productEnquiry.js');

// Middleware for authentication (you need to create this)
// const { protect, authorize } = require('../middleware/auth');

// Public route
router.post('/productEnquiry', createProductEnquiry);

// Protected routes (uncomment when you have auth middleware)
// router.get('/productEnquiry', protect, authorize('admin'), getAllEnquiries);
// router.get('/productEnquiry/stats', protect, authorize('admin'), getEnquiryStats);
// router.get('/productEnquiry/:id', protect, authorize('admin'), getEnquiryById);
// router.put('/productEnquiry/:id/status', protect, authorize('admin'), updateEnquiryStatus);
// router.post('/productEnquiry/:id/note', protect, authorize('admin'), addEnquiryNote);
// router.delete('/productEnquiry/:id', protect, authorize('admin'), deleteEnquiry);

module.exports = router;