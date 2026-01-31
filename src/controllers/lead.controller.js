const { Leads } = require('../models/Lead');
const { Properties } = require('../models/Property');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');
const { createNotificationHelper } = require('./notification.controller');
const { sendInquiryConfirmationEmail } = require('../utils/emailSender');

/**
 * @desc    Create a new lead (inquiry)
 * @route   POST /api/leads
 * @access  Public
 */
const createLead = async (req, res, next) => {
  try {
    const { name, email, phone, message, propertyId, interestType, subject } = req.body;

    // Validate required fields (propertyId is now optional for general inquiries)
    if (!name || !email || !phone) {
      return ApiResponse.error(res, 'Please provide all required fields', 400);
    }

    let targetItem = null;
    let itemType = interestType || 'general';

    // If propertyId is provided, try to find the item
    if (propertyId && ObjectId.isValid(propertyId)) {
      // Try finding in properties first
      targetItem = await Properties().findOne({ _id: new ObjectId(propertyId) });
      if (targetItem) {
        itemType = 'property';
      } else {
        // Then try projects
        targetItem = await Projects().findOne({ _id: new ObjectId(propertyId) });
        if (targetItem) {
          itemType = 'project';
        }
      }
    }

    // Create lead object
    const lead = {
      name,
      email,
      phone,
      message: message || '',
      subject: subject || (itemType === 'general' ? 'General Inquiry' : `Inquiry for ${itemType}`),
      targetId: propertyId ? new ObjectId(propertyId) : null,
      agent: targetItem?.agent ? new ObjectId(targetItem.agent) : null,
      interestType: itemType,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Leads().insertOne(lead);
    const createdLead = { ...lead, _id: result.insertedId };

    // Send confirmation email to user (async)
    try {
      if (itemType === 'property' || itemType === 'project') {
        await sendInquiryConfirmationEmail(createdLead, targetItem);
      } else {
        // For general inquiries, maybe a simpler email or same with no property
        await sendInquiryConfirmationEmail(createdLead, null);
      }
    } catch (emailError) {
      console.error('Failed to send inquiry confirmation email:', emailError);
    }

    // Create notification for agent if exists
    if (targetItem?.agent) {
      await createNotificationHelper(
        targetItem.agent,
        'New Inquiry Received',
        `You have a new inquiry for ${itemType}: ${targetItem.title}.`,
        `/agent/leads/${createdLead._id}`
      );
    }

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

    // Notify user about status change if relevant (Async)
    const { sendLeadStatusUpdateEmail } = require('../utils/emailSender');
    if (status === 'contacted' || status === 'converted') {
      try {
        await sendLeadStatusUpdateEmail(lead, status);
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }

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

const addLeadNote = async (req, res, next) => {
  try {
    const { text } = req.body;
    const leadId = new ObjectId(req.params.id);

    if (!text) {
      return ApiResponse.error(res, 'Note text is required', 400);
    }

    const note = {
      _id: new ObjectId(),
      text,
      author: new ObjectId(req.user._id),
      authorName: req.user.name,
      createdAt: new Date()
    };

    const result = await Leads().updateOne(
      { _id: leadId },
      { 
        $push: { notes: note },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return ApiResponse.error(res, 'Lead not found', 404);
    }

    return ApiResponse.success(res, 'Note added successfully', { note });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLead,
  getLeads,
  updateLeadStatus,
  getMyInquiries,
  addLeadNote,
};
