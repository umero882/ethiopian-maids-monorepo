/**
 * Review Service
 *
 * This module exports the GraphQL implementation of review services.
 * Supabase fallback has been removed as part of the GraphQL migration.
 */

import { graphqlReviewService } from './reviewService.graphql.simple';
import { createLogger } from '@/utils/logger';

const log = createLogger('ReviewService');

/**
 * Review Service - GraphQL implementation
 */
export const reviewService = {
  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  async getReview(reviewId) {
    log.debug('Getting review via GraphQL', { reviewId });
    return graphqlReviewService.getReview(reviewId);
  },

  async getReviewsForUser(userId, options = {}) {
    log.debug('Getting reviews for user via GraphQL', { userId });
    return graphqlReviewService.getReviewsForUser(userId, options);
  },

  async getReviewsByReviewer(reviewerId, options = {}) {
    log.debug('Getting reviews by reviewer via GraphQL', { reviewerId });
    return graphqlReviewService.getReviewsByReviewer(reviewerId, options);
  },

  async getAverageRating(userId) {
    log.debug('Getting average rating via GraphQL', { userId });
    return graphqlReviewService.getAverageRating(userId);
  },

  async getRatingBreakdown(userId) {
    log.debug('Getting rating breakdown via GraphQL', { userId });
    return graphqlReviewService.getRatingBreakdown(userId);
  },

  // ============================================================================
  // MUTATION METHODS
  // ============================================================================

  async createReview(reviewData) {
    log.debug('Creating review via GraphQL');
    return graphqlReviewService.createReview(reviewData);
  },

  async updateReview(reviewId, updates) {
    log.debug('Updating review via GraphQL', { reviewId });
    return graphqlReviewService.updateReview(reviewId, updates);
  },

  async approveReview(reviewId) {
    log.debug('Approving review via GraphQL', { reviewId });
    return graphqlReviewService.approveReview(reviewId);
  },

  async rejectReview(reviewId, reason) {
    log.debug('Rejecting review via GraphQL', { reviewId });
    return graphqlReviewService.rejectReview(reviewId, reason);
  },

  async addResponse(reviewId, response) {
    log.debug('Adding response to review via GraphQL', { reviewId });
    return graphqlReviewService.addResponse(reviewId, response);
  },

  async deleteReview(reviewId) {
    log.debug('Deleting review via GraphQL', { reviewId });
    return graphqlReviewService.deleteReview(reviewId);
  },

  async markReviewHelpful(reviewId, userId, isHelpful) {
    log.debug('Marking review as helpful via GraphQL', { reviewId, userId, isHelpful });
    return graphqlReviewService.markReviewHelpful(reviewId, userId, isHelpful);
  },

  async removeHelpfulVote(reviewId, userId) {
    log.debug('Removing helpful vote via GraphQL', { reviewId, userId });
    return graphqlReviewService.removeHelpfulVote(reviewId, userId);
  },
};

export default reviewService;
