const Lead = require('../models/Lead');
const Property = require('../models/Property');
const Project = require('../models/Project');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Create new lead/inquiry
 * @route   POST /api/leads
 * @access  Public
 */
const createLead = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      message,
      leadType,
      relatedProperty,
      relatedProject,
    } = req.body;

    const leadData = {
      name,
      email,
      phone,
      message: message || '',
      leadType,
      relatedProperty: relatedProperty || null,
      relatedProject: relatedProject || null,
      source: 'website',
    };

    // Auto-assign to property agent if property inquiry
    if (relatedProperty) {
      const property = await Property.findById(relatedProperty);
      if (property) {
        leadData.assignedTo = property.agent;
        // Increment inquiries count
        property.inquiries += 1;
        await property.save();
      }
    }

    const lead = await Lead.create(leadData);

    // TODO: Send email notification to agent/admin

    return ApiResponse.success(
      res,
      'Your inquiry has been submitted successfully. We will contact you soon.',
      { lead },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all leads (for agents/admins)
 * @route   GET /api/leads
 * @access  Private (Agent, Admin)
 */
const getLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      leadType,
      assignedTo,
    } = req.query;

    const filter = {};

    // Agents can only see their assigned leads
    if (req.user.role === 'agent') {
      filter.assignedTo = req.user._id;
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (status) filter.status = status;
    if (leadType) filter.leadType = leadType;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const leads = await Lead.find(filter)
      .populate('relatedProperty', 'title slug price location')
      .populate('relatedProject', 'name slug')
      .populate('assignedTo', 'name email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    const totalLeads = await Lead.countDocuments(filter);
    const totalPages = Math.ceil(totalLeads / limitNum);

    return ApiResponse.paginated(
      res,
      'Leads retrieved successfully',
      leads,
      {
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalItems: totalLeads,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single lead
 * @route   GET /api/leads/:id
 * @access  Private (Agent - own leads, Admin - all)
 */
const getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('relatedProperty', 'title slug price location')
      .populate('relatedProject', 'name slug')
      .populate('assignedTo', 'name email phone')
      .populate('notes.addedBy', 'name');

    if (!lead) {
      return ApiResponse.error(res, 'Lead not found', 404);
    }

    // Check access
    if (
      req.user.role === 'agent' &&
      lead.assignedTo._id.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(res, 'Not authorized to view this lead', 403);
    }

    return ApiResponse.success(res, 'Lead retrieved successfully', { lead });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update lead status
 * @route   PUT /api/leads/:id
 * @access  Private (Agent - own leads, Admin - all)
 */
const updateLead = async (req, res, next) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return ApiResponse.error(res, 'Lead not found', 404);
    }

    // Check access
    if (
      req.user.role === 'agent' &&
      lead.assignedTo.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(res, 'Not authorized to update this lead', 403);
    }

    const { status, followUpDate, assignedTo } = req.body;

    if (status) lead.status = status;
    if (followUpDate) lead.followUpDate = followUpDate;
    if (assignedTo && req.user.role === 'admin') lead.assignedTo = assignedTo;

    await lead.save();

    return ApiResponse.success(res, 'Lead updated successfully', { lead });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add note to lead
 * @route   POST /api/leads/:id/notes
 * @access  Private (Agent, Admin)
 */
const addNote = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return ApiResponse.error(res, 'Lead not found', 404);
    }

    // Check access
    if (
      req.user.role === 'agent' &&
      lead.assignedTo.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(res, 'Not authorized to add notes to this lead', 403);
    }

    lead.notes.push({
      text: req.body.note,
      addedBy: req.user._id,
    });

    await lead.save();

    return ApiResponse.success(res, 'Note added successfully', { lead });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLead,
  getLeads,
  getLead,
  updateLead,
  addNote,
};
