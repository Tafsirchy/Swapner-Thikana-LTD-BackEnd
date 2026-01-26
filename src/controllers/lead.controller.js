const { Leads } = require('../models/Lead');
const { Properties } = require('../models/Property');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');

/**
 * @desc    Create a new lead (inquiry)
 * @route   POST /api/leads
 * @access  Public
 */
const createLead = async (req, res, next) => {
  try {
    const { name, email, phone, message, interestType } = req.body;
    
    const leadData = {
      name,
      email: email.toLowerCase(),
      phone,
      message,
      interestType: interestType || 'property',
      status: 'new',
      createdAt: new Date(),
    };

    const finalPropertyId = propertyId || req.body.propertyId;
    if (finalPropertyId) {
      leadData.propertyId = new ObjectId(finalPropertyId);
      
      // Try to find property to get the agent ID
      const property = await Properties().findOne({ _id: leadData.propertyId });
      if (property) {
        leadData.assignedTo = property.agent;
        leadData.propertyName = property.title;
      }
    }

    const result = await Leads().insertOne(leadData);

    return ApiResponse.success(res, 'Inquiry submitted successfully. We will contact you soon.', { leadId: result.insertedId }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all leads (Admin/Agent)
 * @route   GET /api/leads
 * @access  Private
 */
const getLeads = async (req, res, next) => {
  try {
    const query = {};
    
    // Agents only see their leads
    if (req.user.role === 'agent') {
      query.assignedTo = new ObjectId(req.user._id);
    }

    const leads = await Leads()
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return ApiResponse.success(res, 'Leads fetched', { leads });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update lead status
 * @route   PATCH /api/leads/:id/status
 * @access  Private
 */
const updateLeadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const leadId = new ObjectId(req.params.id);

    const lead = await Leads().findOne({ _id: leadId });
    if (!lead) {
      return ApiResponse.error(res, 'Lead not found', 404);
    }

    // Role check
    if (req.user.role === 'agent' && lead.assignedTo.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized', 403);
    }

    await Leads().updateOne(
       { _id: leadId },
       { $set: { status, updatedAt: new Date() } }
    );

    return ApiResponse.success(res, 'Lead status updated');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get my inquiries (Customer)
 * @route   GET /api/leads/my-inquiries
 * @access  Private
 */
const getMyInquiries = async (req, res, next) => {
  try {
    // Find leads matching user's email
    const inquiries = await Leads()
      .find({ email: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    return ApiResponse.success(res, 'My inquiries fetched', { inquiries });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLead,
  getLeads,
  updateLeadStatus,
  getMyInquiries,
};
