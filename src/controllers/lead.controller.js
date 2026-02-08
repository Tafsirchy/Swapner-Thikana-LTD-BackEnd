const { Leads } = require('../models/Lead');
const { Properties } = require('../models/Property');
const { Projects } = require('../models/Project');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');
const { createNotificationHelper } = require('./notification.controller');
const { sendInquiryConfirmationEmail } = require('../utils/emailSender');
const { Reminders } = require('../models/Reminder');


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
      subject: subject || (targetItem ? `Inquiry for ${itemType}: ${targetItem.title}` : 'General Inquiry'),
      targetId: targetItem ? new ObjectId(propertyId) : null,
      agent: targetItem?.agent ? new ObjectId(targetItem.agent) : null,
      interestType: targetItem ? itemType : 'general',
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Leads().insertOne(lead);
    const createdLead = { ...lead, _id: result.insertedId };

    // Send confirmation email to user (async)
    // Send confirmation email to user (non-blocking/fire-and-forget)
    // We don't await this so the UI gets an immediate response
    const emailPromise = (itemType === 'property' || itemType === 'project')
      ? sendInquiryConfirmationEmail(createdLead, targetItem)
      : sendInquiryConfirmationEmail(createdLead, null);

    emailPromise.catch(emailError => {
      console.error('Failed to send inquiry confirmation email:', emailError);
    });

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
      query.agent = new ObjectId(req.user._id);
    }

    const leads = await Leads()
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Populate target titles if missing
    const enrichedLeads = await Promise.all(leads.map(async (lead) => {
        if (lead.targetId && !lead.propertyName) {
            let item = null;
            if (lead.interestType === 'property') {
                item = await Properties().findOne({ _id: lead.targetId }, { projection: { title: 1 } });
            } else if (lead.interestType === 'project') {
                item = await Projects().findOne({ _id: lead.targetId }, { projection: { title: 1 } });
            }
            if (item) {
                return { ...lead, propertyName: item.title };
            }
        }
        return lead;
    }));

    return ApiResponse.success(res, 'Leads fetched', { leads: enrichedLeads });
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
    if (req.user.role === 'agent' && lead.agent?.toString() !== req.user._id.toString()) {
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

    // Populate target titles
    const enrichedInquiries = await Promise.all(inquiries.map(async (inquiry) => {
        if (inquiry.targetId && !inquiry.propertyName) {
            let item = null;
            if (inquiry.interestType === 'property') {
                item = await Properties().findOne({ _id: inquiry.targetId }, { projection: { title: 1 } });
            } else if (inquiry.interestType === 'project') {
                item = await Projects().findOne({ _id: inquiry.targetId }, { projection: { title: 1 } });
            }
            if (item) {
                return { ...inquiry, propertyName: item.title };
            }
        }
        return inquiry;
    }));

    return ApiResponse.success(res, 'My inquiries fetched', { inquiries: enrichedInquiries });
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

    const lead = await Leads().findOne({ _id: leadId });
    if (!lead) {
      return ApiResponse.error(res, 'Lead not found', 404);
    }

    // Role check: Only assigned agent or admin
    if (req.user.role === 'agent' && lead.agent?.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to add notes to this lead', 403);
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

    // Notify Agent if Admin/Management added the note
    if ((req.user.role === 'admin' || req.user.role === 'management') && lead.agent && lead.agent.toString() !== req.user._id.toString()) {
       await createNotificationHelper(
        lead.agent,
        'lead_note',
        'New Note on Lead',
        `${req.user.name} added a note to lead: ${lead.name}`,
        `/dashboard/leads/${leadId}`
      );
    }

    return ApiResponse.success(res, 'Note added successfully', { note });
  } catch (error) {
    next(error);
  }
};

const assignLead = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const leadId = new ObjectId(req.params.id);

    if (!agentId) {
      return ApiResponse.error(res, 'Agent ID is required', 400);
    }

    const lead = await Leads().findOne({ _id: leadId });
    if (!lead) {
      return ApiResponse.error(res, 'Lead not found', 404);
    }

    // Role check: Only admin/management can assign leads
    if (req.user.role !== 'admin' && req.user.role !== 'management') {
      return ApiResponse.error(res, 'Not authorized to assign leads', 403);
    }

    await Leads().updateOne(
      { _id: leadId },
      { $set: { agent: new ObjectId(agentId), updatedAt: new Date() } }
    );

    // Notify the Agent
    await createNotificationHelper(
      new ObjectId(agentId),
      'lead_assigned',
      'New Lead Assigned',
      `You have been assigned a new lead: ${lead.name}`,
      `/dashboard/leads/${leadId}`
    );

    return ApiResponse.success(res, 'Lead assigned successfully');
  } catch (error) {
    next(error);
  }
};

const deleteLead = async (req, res, next) => {
  try {
    const leadId = new ObjectId(req.params.id);
    const lead = await Leads().findOne({ _id: leadId });

    if (!lead) {
      return ApiResponse.error(res, 'Lead not found', 404);
    }

    // Role check: Only assigned agent or admin
    if (req.user.role === 'agent' && lead.agent?.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to delete this lead', 403);
    }
    
    // 1. Delete associated reminders
    await Reminders().deleteMany({ lead: leadId });

    const result = await Leads().deleteOne({ _id: leadId });

    
    if (result.deletedCount === 0) {
      return ApiResponse.error(res, 'Lead not found', 404);
    }

    return ApiResponse.success(res, 'Lead deleted successfully');
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
  deleteLead,
  assignLead
};
