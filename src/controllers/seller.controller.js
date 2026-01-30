const { SellerInquiry } = require('../models/SellerInquiry');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');

/**
 * @desc    Submit a new seller inquiry
 * @route   POST /api/seller/submit
 * @access  Public
 */
const submitInquiry = async (req, res, next) => {
  try {
    const { name, email, phone, propertyType, address, message, images } = req.body;

    if (!name || !email || !phone || !propertyType) {
      return ApiResponse.error(res, 'Missing required fields', 400);
    }

    const inquiry = {
      name,
      email,
      phone,
      propertyType,
      address,
      message,
      images: Array.isArray(images) ? images : [], // Store image URLs
      status: 'pending', // pending, approved, rejected, contacted
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await SellerInquiry().insertOne(inquiry);
    inquiry._id = result.insertedId;

    // Optional: Send email notification to admin here

    return ApiResponse.success(res, 'Inquiry submitted successfully', { inquiry }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all seller inquiries (Admin only)
 * @route   GET /api/seller/admin/all
 * @access  Private (Admin)
 */
const getAllInquiries = async (req, res, next) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const inquiries = await SellerInquiry()
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit))
      .toArray();

    const total = await SellerInquiry().countDocuments(query);

    return ApiResponse.success(res, 'Seller inquiries retrieved', { 
      inquiries,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update inquiry status
 * @route   PUT /api/seller/admin/:id/status
 * @access  Private (Admin)
 */
const updateInquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected', 'contacted'].includes(status)) {
      return ApiResponse.error(res, 'Invalid status', 400);
    }

    const result = await SellerInquiry().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return ApiResponse.error(res, 'Inquiry not found', 404);
    }

    return ApiResponse.success(res, 'Inquiry status updated', { inquiry: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitInquiry,
  getAllInquiries,
  updateInquiryStatus
};
