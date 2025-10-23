const ProductEnquiry = require('../models/productEnquiry.model');

exports.submitProductEnquiry = async (req, res) => {
    try {
        const { fullName, email, phone, company, product, message } = req.body;

        // Validate required fields
        if (!fullName || !email || !phone || !product || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }

        // Create new enquiry
        const enquiry = await ProductEnquiry.create({
            fullName,
            email,
            phone,
            company: company || '',
            product,
            message
        });

        // Send success response
        res.status(201).json({
            success: true,
            message: 'Enquiry submitted successfully',
            data: {
                id: enquiry._id,
                fullName: enquiry.fullName,
                email: enquiry.email
            }
        });

    } catch (error) {
        console.error('Error submitting product enquiry:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        // Handle duplicate email (if you add unique constraint)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'An enquiry with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// @desc    Get all enquiries (Admin)
// @route   GET /api/product-enquiry
// @access  Private/Admin
exports.getAllEnquiries = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const query = status ? { status } : {};
        
        const enquiries = await ProductEnquiry.find(query)
            .sort({ submittedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await ProductEnquiry.countDocuments(query);

        res.status(200).json({
            success: true,
            data: enquiries,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });

    } catch (error) {
        console.error('Error fetching enquiries:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// @desc    Get single enquiry by ID (Admin)
// @route   GET /api/product-enquiry/:id
// @access  Private/Admin
exports.getEnquiryById = async (req, res) => {
    try {
        const enquiry = await ProductEnquiry.findById(req.params.id);

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: 'Enquiry not found'
            });
        }

        res.status(200).json({
            success: true,
            data: enquiry
        });

    } catch (error) {
        console.error('Error fetching enquiry:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// @desc    Update enquiry status (Admin)
// @route   PUT /api/product-enquiry/:id
// @access  Private/Admin
exports.updateEnquiryStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'contacted', 'resolved'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const enquiry = await ProductEnquiry.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: 'Enquiry not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Enquiry status updated successfully',
            data: enquiry
        });

    } catch (error) {
        console.error('Error updating enquiry:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// @desc    Delete enquiry (Admin)
// @route   DELETE /api/product-enquiry/:id
// @access  Private/Admin
exports.deleteEnquiry = async (req, res) => {
    try {
        const enquiry = await ProductEnquiry.findByIdAndDelete(req.params.id);

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: 'Enquiry not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Enquiry deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting enquiry:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};