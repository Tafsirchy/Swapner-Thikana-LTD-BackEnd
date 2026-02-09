const { Properties } = require('../models/Property');
const { Projects } = require('../models/Project');
const { Leads } = require('../models/Lead');
const { Users } = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { ObjectId } = require('mongodb');

/**
 * @desc    Get system-wide analytics (Admin)
 */
const getAdminAnalytics = async (req, res, next) => {
  try {
    // 1. Distribution by Property Type
    const typeDistribution = await Properties().aggregate([
      { $group: { _id: '$propertyType', count: { $sum: 1 } } }
    ]).toArray();

    // 2. Leads over time (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const leadsTrend = await Leads().aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    // 3. Lead Status distribution
    const statusDistribution = await Leads().aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();

    // 4. Top viewed properties
    const topProperties = await Properties().find()
      .sort({ views: -1 })
      .limit(5)
      .project({ title: 1, views: 1, price: 1, 'location.area': 1 })
      .toArray();

    // 5. User growth
    const userGrowth = await Users().aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    return ApiResponse.success(res, 'Admin analytics fetched', {
      typeDistribution,
      leadsTrend,
      statusDistribution,
      topProperties,
      userGrowth
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get agent-specific analytics
 */
const getAgentAnalytics = async (req, res, next) => {
  try {
    const agentId = new ObjectId(req.user._id);

    // 1. My Listings Performance (Properties + Projects)
    const [properties, projects] = await Promise.all([
      Properties().find({ agent: agentId }).project({ title: 1, views: 1, status: 1, type: 'property' }).toArray(),
      Projects().find({ agent: agentId }).project({ title: 1, views: 1, status: 1, type: 'project' }).toArray()
    ]);

    const listingsPerformance = [...properties, ...projects].sort((a, b) => (b.views || 0) - (a.views || 0));

    // 2. My Lead Conversion
    const leadStats = await Leads().aggregate([
      { $match: { agent: agentId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();

    // 3. New leads in last 7 days (Aggregate)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentLeadsStats = await Leads().aggregate([
      { $match: { agent: agentId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    // 4. Individual Recent Leads (Actual Lead Details)
    const recentLeads = await Leads().aggregate([
      { $match: { agent: agentId } },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'properties',
          localField: 'targetId',
          foreignField: '_id',
          as: 'propertyDetails'
        }
      },
      {
        $lookup: {
          from: 'projects',
          localField: 'targetId',
          foreignField: '_id',
          as: 'projectDetails'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          status: 1,
          createdAt: 1,
          interestType: 1,
          'property.title': {
             $cond: {
               if: { $eq: ['$interestType', 'property'] },
               then: { $arrayElemAt: ['$propertyDetails.title', 0] },
               else: { $arrayElemAt: ['$projectDetails.title', 0] }
             }
          }
        }
      }
    ]).toArray();

    // 5. Profile Strength Calculation
    const user = await Users().findOne({ _id: agentId });
    const profileFields = ['bio', 'image', 'specialization', 'experience', 'phone'];
    const completedFields = profileFields.filter(field => !!user[field]);
    const profileStrength = {
      score: Math.round((completedFields.length / profileFields.length) * 100),
      missingFields: profileFields.filter(field => !user[field])
    };

    return ApiResponse.success(res, 'Agent analytics fetched', {
      listingsPerformance,
      leadStats,
      recentLeadsStats,
      recentLeads,
      profileStrength
    });
  } catch (error) {
    next(error);
  }
};

const { SavedSearches } = require('../models/SavedSearch');

/**
 * @desc    Get customer-specific analytics
 */
const getCustomerAnalytics = async (req, res, next) => {
  try {
    const userId = new ObjectId(req.user._id);

    // 1. Saved Homes Count (from User profile)
    const user = await Users().findOne({ _id: userId });
    const savedHomesCount = user.savedProperties ? user.savedProperties.length : 0;

    // 2. Active Inquiries Count
    const activeInquiriesCount = await Leads().countDocuments({ 
      user: userId, 
      status: { $ne: 'closed' } 
    });

    // 3. Saved Searches Count
    const savedSearchesCount = await SavedSearches().countDocuments({ user: userId });

    // 4. Recent Inquiries (Last 5)
    // We need to look up property details for these inquiries
    const recentInquiries = await Leads().aggregate([
      { $match: { user: userId } },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'properties',
          localField: 'property',
          foreignField: '_id',
          as: 'propertyDetails'
        }
      },
      {
        $project: {
          status: 1,
          createdAt: 1,
          'property.title': { $arrayElemAt: ['$propertyDetails.title', 0] },
          'property.image': { $arrayElemAt: ['$propertyDetails.images', 0] }
        }
      }
    ]).toArray();

    return ApiResponse.success(res, 'Customer analytics fetched', {
      savedHomesCount,
      activeInquiriesCount,
      savedSearchesCount,
      recentInquiries
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminAnalytics,
  getAgentAnalytics,
  getCustomerAnalytics
};
