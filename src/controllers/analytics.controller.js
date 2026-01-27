const { Properties } = require('../models/Property');
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

    // 1. My Listings Performance
    const listingsPerformance = await Properties().find({ agent: agentId })
      .sort({ views: -1 })
      .project({ title: 1, views: 1, status: 1 })
      .toArray();

    // 2. My Lead Conversion
    const leadStats = await Leads().aggregate([
      { $match: { agent: agentId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();

    // 3. New leads in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentLeads = await Leads().aggregate([
      { $match: { agent: agentId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    return ApiResponse.success(res, 'Agent analytics fetched', {
      listingsPerformance,
      leadStats,
      recentLeads
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminAnalytics,
  getAgentAnalytics
};
