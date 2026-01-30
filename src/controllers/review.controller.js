const { ObjectId } = require('mongodb');
const { Reviews } = require('../models/Review');
const { Properties } = require('../models/Property');
const { Users } = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

/**
 * Create a new review
 */
const createReview = async (req, res, next) => {
  try {
    const { propertyId, agentId, rating, comment, userName, userEmail } = req.body;
    
    // Auth is optional now
    const userId = req.user?._id;

    if (!rating || rating < 1 || rating > 5) {
      return ApiResponse.error(res, 'Please provide a rating between 1 and 5', 400);
    }

    const review = {
      propertyId: propertyId ? new ObjectId(propertyId) : null,
      agentId: agentId ? new ObjectId(agentId) : null,
      userId: userId ? new ObjectId(userId) : null,
      userName: req.user?.name || userName || 'Guest User',
      userPhoto: req.user?.photo || null,
      userEmail: req.user?.email || userEmail || null,
      rating: parseInt(rating),
      comment: comment || '',
      status: 'published', // Auto-publish for instant visibility
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Reviews().insertOne(review);
    
    // Immediately update ratings for the property or agent
    if (review.propertyId) {
      await updatePropertyAverageRating(review.propertyId);
    }
    if (review.agentId) {
      await updateAgentAverageRating(review.agentId);
    }

    return ApiResponse.success(res, 'Review published successfully', {
      reviewId: result.insertedId
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a property
 */
const getPropertyReviews = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    
    const reviews = await Reviews().find({ 
      propertyId: new ObjectId(propertyId),
      status: 'published'
    }).sort({ createdAt: -1 }).toArray();

    return ApiResponse.success(res, 'Property reviews fetched', { reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for an agent
 */
const getAgentReviews = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    
    const reviews = await Reviews().find({ 
      agentId: new ObjectId(agentId),
      status: 'published'
    }).sort({ createdAt: -1 }).toArray();

    return ApiResponse.success(res, 'Agent reviews fetched', { reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reviews (Admin)
 */
const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const reviews = await Reviews().find(query).sort({ createdAt: -1 }).toArray();

    return ApiResponse.success(res, 'All reviews fetched for admin', { reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * Update review status (Admin)
 */
const updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['published', 'rejected'].includes(status)) {
      return ApiResponse.error(res, 'Invalid status', 400);
    }

    const reviewId = new ObjectId(id);
    const review = await Reviews().findOne({ _id: reviewId });

    if (!review) {
      return ApiResponse.error(res, 'Review not found', 404);
    }

    await Reviews().updateOne(
      { _id: reviewId },
      { $set: { status, updatedAt: new Date() } }
    );

    // If published, update average rating for property/agent
    if (status === 'published') {
      if (review.propertyId) {
        await updatePropertyAverageRating(review.propertyId);
      }
      if (review.agentId) {
        await updateAgentAverageRating(review.agentId);
      }
    }

    return ApiResponse.success(res, `Review ${status} successfully`);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Update property average rating
 */
const updatePropertyAverageRating = async (propertyId) => {
  const stats = await Reviews().aggregate([
    { $match: { propertyId, status: 'published' } },
    { $group: { _id: '$propertyId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]).toArray();

  if (stats.length > 0) {
    await Properties().updateOne(
      { _id: propertyId },
      { $set: { 
        averageRating: parseFloat(stats[0].avgRating.toFixed(1)),
        reviewCount: stats[0].count
      } }
    );
  }
};

/**
 * Helper: Update agent average rating
 */
const updateAgentAverageRating = async (agentId) => {
  const stats = await Reviews().aggregate([
    { $match: { agentId, status: 'published' } },
    { $group: { _id: '$agentId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]).toArray();

  if (stats.length > 0) {
    await Users().updateOne(
      { _id: agentId },
      { $set: { 
        averageRating: parseFloat(stats[0].avgRating.toFixed(1)),
        reviewCount: stats[0].count
      } }
    );
  }
};

/**
 * Update a review (Owner only)
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const reviewId = new ObjectId(id);

    const review = await Reviews().findOne({ _id: reviewId });
    if (!review) return ApiResponse.error(res, 'Review not found', 404);

    // Only the user who wrote it can edit
    if (!req.user || !review.userId || review.userId.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Unauthorized to edit this review', 401);
    }

    const updates = {
      updatedAt: new Date()
    };
    if (rating) updates.rating = parseInt(rating);
    if (comment) updates.comment = comment;

    await Reviews().updateOne(
      { _id: reviewId },
      { $set: updates }
    );

    // Recalculate ratings if rating changed
    if (rating) {
      if (review.propertyId) await updatePropertyAverageRating(review.propertyId);
      if (review.agentId) await updateAgentAverageRating(review.agentId);
    }

    return ApiResponse.success(res, 'Review updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a review (Admin or Owner)
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviewId = new ObjectId(id);
    
    const review = await Reviews().findOne({ _id: reviewId });
    if (!review) return ApiResponse.error(res, 'Review not found', 404);

    // Only Admin or the user who wrote it can delete
    const isOwner = req.user && review.userId && review.userId.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isAdmin && !isOwner) {
      return ApiResponse.error(res, 'Unauthorized', 401);
    }

    await Reviews().deleteOne({ _id: reviewId });

    // Recalculate ratings
    if (review.propertyId) await updatePropertyAverageRating(review.propertyId);
    if (review.agentId) await updateAgentAverageRating(review.agentId);

    return ApiResponse.success(res, 'Review deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getPropertyReviews,
  getAgentReviews,
  getAllReviewsAdmin,
  updateReviewStatus,
  updateReview,
  deleteReview
};
