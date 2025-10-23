const express = require('express');
const router = express.Router();
const {
    submitProductEnquiry,
    getAllEnquiries,
    getEnquiryById,
    updateEnquiryStatus,
    deleteEnquiry
} = require('../controllers/productEnquiry.js');

// Import your auth middleware here if you have one
// const { protect, authorize } = require('../middleware/auth');

// Public route - Submit enquiry
router.post('/', submitProductEnquiry);

// Admin routes - Uncomment and add your auth middleware
// router.get('/', protect, authorize('admin'), getAllEnquiries);
// router.get('/:id', protect, authorize('admin'), getEnquiryById);
// router.put('/:id', protect, authorize('admin'), updateEnquiryStatus);
// router.delete('/:id', protect, authorize('admin'), deleteEnquiry);

// For now, without auth (remove these in production):
router.get('/', getAllEnquiries);
router.get('/:id', getEnquiryById);
router.put('/:id', updateEnquiryStatus);
router.delete('/:id', deleteEnquiry);

module.exports = router;