const ProductEnquiry = require('../models/productEnquiry.model.js');
const { validationResult } = require('express-validator');

// @desc    Create new product enquiry
// @route   POST /api/lead/productEnquiry
// @access  Public
exports.createProductEnquiry = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      estimatedQuantity,
      productInterest,
      message,
      terms
    } = req.body;

    // Validation
    if (!fullName || !email || !phone || !productInterest || !message || !terms) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate name length
    if (fullName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 3 characters long'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate phone number
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian phone number'
      });
    }

    // Validate message length
    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long'
      });
    }

    // Validate terms acceptance
    if (terms !== true) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to terms and conditions'
      });
    }

    // Check for duplicate enquiry (same email and product within last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingEnquiry = await ProductEnquiry.findOne({
      email: email.toLowerCase(),
      productInterest,
      createdAt: { $gte: twentyFourHoursAgo }
    });

    if (existingEnquiry) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an enquiry for this product recently. Our team will contact you soon.'
      });
    }

    // Get IP address and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'] || '';

    // Create new enquiry
    const enquiry = await ProductEnquiry.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: cleanPhone,
      estimatedQuantity: estimatedQuantity?.trim() || '',
      productInterest: productInterest.trim(),
      message: message.trim(),
      terms,
      ipAddress,
      userAgent,
      source: 'website'
    });

    // TODO: Send email notification to admin/sales team
    // await sendEnquiryNotification(enquiry);

    // TODO: Send confirmation email to customer
    // await sendCustomerConfirmation(enquiry);

    res.status(201).json({
      success: true,
      message: 'Thank you for your enquiry! Our team will contact you shortly.',
      data: {
        enquiryId: enquiry._id,
        fullName: enquiry.fullName,
        email: enquiry.email
      }
    });

  } catch (error) {
    console.error('Error creating product enquiry:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit enquiry. Please try again later.'
    });
  }
};

// @desc    Get all enquiries (Admin)
// @route   GET /api/lead/productEnquiry
// @access  Private/Admin
exports.getAllEnquiries = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { productInterest: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const enquiries = await ProductEnquiry.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('assignedTo', 'name email');

    const total = await ProductEnquiry.countDocuments(query);

    res.status(200).json({
      success: true,
      count: enquiries.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: enquiries
    });

  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enquiries'
    });
  }
};

// @desc    Get single enquiry by ID (Admin)
// @route   GET /api/lead/productEnquiry/:id
// @access  Private/Admin
exports.getEnquiryById = async (req, res) => {
  try {
    const enquiry = await ProductEnquiry.findById(req.params.id)
      .populate('assignedTo', 'name email');

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
      message: 'Failed to fetch enquiry'
    });
  }
};

// @desc    Update enquiry status (Admin)
// @route   PUT /api/lead/productEnquiry/:id/status
// @access  Private/Admin
exports.updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'contacted', 'qualified', 'converted', 'rejected'];
    if (!validStatuses.includes(status)) {
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
      message: 'Status updated successfully',
      data: enquiry
    });

  } catch (error) {
    console.error('Error updating enquiry status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

// @desc    Add note to enquiry (Admin)
// @route   POST /api/lead/productEnquiry/:id/note
// @access  Private/Admin
exports.addEnquiryNote = async (req, res) => {
  try {
    const { content, addedBy } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    const enquiry = await ProductEnquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }

    await enquiry.addNote(content, addedBy || 'Admin');

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: enquiry
    });

  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note'
    });
  }
};

// @desc    Delete enquiry (Admin)
// @route   DELETE /api/lead/productEnquiry/:id
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
      message: 'Failed to delete enquiry'
    });
  }
};

// @desc    Get enquiry statistics (Admin)
// @route   GET /api/lead/productEnquiry/stats
// @access  Private/Admin
exports.getEnquiryStats = async (req, res) => {
  try {
    const totalEnquiries = await ProductEnquiry.countDocuments();
    const pendingEnquiries = await ProductEnquiry.countDocuments({ status: 'pending' });
    const contactedEnquiries = await ProductEnquiry.countDocuments({ status: 'contacted' });
    const qualifiedEnquiries = await ProductEnquiry.countDocuments({ status: 'qualified' });
    const convertedEnquiries = await ProductEnquiry.countDocuments({ status: 'converted' });
    const rejectedEnquiries = await ProductEnquiry.countDocuments({ status: 'rejected' });

    // Get enquiries from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentEnquiries = await ProductEnquiry.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get most enquired products
    const topProducts = await ProductEnquiry.aggregate([
      {
        $group: {
          _id: '$productInterest',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalEnquiries,
        pending: pendingEnquiries,
        contacted: contactedEnquiries,
        qualified: qualifiedEnquiries,
        converted: convertedEnquiries,
        rejected: rejectedEnquiries,
        lastSevenDays: recentEnquiries,
        topProducts: topProducts.map(p => ({
          product: p._id,
          count: p.count
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching enquiry stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};