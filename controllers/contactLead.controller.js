const ContactLead = require('../models/contactlead.model.js'); // Adjust path as needed

/**
 * Create a new contact lead
 * POST /api/lead/contactlead
 */
exports.createContactLead = async (req, res) => {
    try {
        // Extract data from request body
        const {
            name,
            email,
            phone,
            enquiryType,
            comments,
            products,
            consent
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !enquiryType || !comments || !products || !consent) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be filled'
            });
        }

        // Validate products array
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one product must be selected'
            });
        }

        // Validate consent
        if (consent !== true && consent !== 'true') {
            return res.status(400).json({
                success: false,
                message: 'You must provide consent to store your information'
            });
        }

        // Get IP address and user agent for tracking
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
        const userAgent = req.headers['user-agent'];

        // Create new contact lead
        const contactLead = new ContactLead({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            enquiryType,
            comments: comments.trim(),
            products,
            consent: true,
            ipAddress,
            userAgent
        });

        // Save to database
        await contactLead.save();

        // Log successful submission
      

        // Send success response with redirect URL
        return res.status(201).json({
            success: true,
            message: 'Your inquiry has been submitted successfully',
            redirectUrl: '/thankyou',
            data: {
                id: contactLead._id,
                name: contactLead.name,
                email: contactLead.email
            }
        });

    } catch (error) {
        console.error('Error creating contact lead:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', '),
                errors: messages
            });
        }

        // Handle duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'An inquiry with this email already exists'
            });
        }

        // Generic error response
        return res.status(500).json({
            success: false,
            message: 'An error occurred while submitting your inquiry. Please try again later.'
        });
    }
};

/**
 * Get all contact leads (Admin)
 * GET /api/lead/contactleads
 */
exports.getAllContactLeads = async (req, res) => {
    try {
        const { status, limit = 50, page = 1 } = req.query;

        const query = status ? { status } : {};
        const skip = (page - 1) * limit;

        const leads = await ContactLead.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await ContactLead.countDocuments(query);

        res.status(200).json({
            success: true,
            data: leads,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching contact leads:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contact leads'
        });
    }
};

/**
 * Get single contact lead by ID (Admin)
 * GET /api/lead/contactlead/:id
 */
exports.getContactLeadById = async (req, res) => {
    try {
        const lead = await ContactLead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Contact lead not found'
            });
        }

        res.status(200).json({
            success: true,
            data: lead
        });

    } catch (error) {
        console.error('Error fetching contact lead:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contact lead'
        });
    }
};

/**
 * Update contact lead status (Admin)
 * PATCH /api/lead/contactlead/:id
 */
exports.updateContactLead = async (req, res) => {
    try {
        const { status, notes } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;

        const lead = await ContactLead.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Contact lead not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Contact lead updated successfully',
            data: lead
        });

    } catch (error) {
        console.error('Error updating contact lead:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating contact lead'
        });
    }
};

/**
 * Delete contact lead (Admin)
 * DELETE /api/lead/contactlead/:id
 */
exports.deleteContactLead = async (req, res) => {
    try {
        const lead = await ContactLead.findByIdAndDelete(req.params.id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Contact lead not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Contact lead deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting contact lead:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting contact lead'
        });
    }
};

/**
 * Get contact leads statistics (Admin)
 * GET /api/lead/stats
 */
exports.getLeadStats = async (req, res) => {
    try {
        const total = await ContactLead.countDocuments();
        const newLeads = await ContactLead.countDocuments({ status: 'new' });
        const contacted = await ContactLead.countDocuments({ status: 'contacted' });
        const qualified = await ContactLead.countDocuments({ status: 'qualified' });
        const converted = await ContactLead.countDocuments({ status: 'converted' });
        const closed = await ContactLead.countDocuments({ status: 'closed' });

        // Get leads from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentLeads = await ContactLead.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Get most popular products
        const productStats = await ContactLead.aggregate([
            { $unwind: '$products' },
            { $group: { _id: '$products', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                total,
                byStatus: {
                    new: newLeads,
                    contacted,
                    qualified,
                    converted,
                    closed
                },
                recentLeads,
                popularProducts: productStats
            }
        });

    } catch (error) {
        console.error('Error fetching lead stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lead statistics'
        });
    }
};