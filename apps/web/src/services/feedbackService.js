/**
 * Feedback Service
 * Handles all feedback/review operations for the Ethiopian Maids platform
 * Migrated to GraphQL/Hasura
 *
 * Database Schema:
 * - reviews table: Stores all reviews and ratings
 * - bookings table: Links reviews to completed bookings
 *
 * @module services/feedbackService
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

// GraphQL Queries
const GET_COMPLETED_BOOKINGS_FOR_FEEDBACK = gql`
  query GetCompletedBookingsForFeedback($sponsorId: uuid!) {
    bookings(
      where: { sponsor_id: { _eq: $sponsorId }, status: { _eq: "completed" } }
      order_by: { end_date: desc }
    ) {
      id
      start_date
      end_date
      status
      booking_type
      maid_id
    }
  }
`;

const GET_MAIDS_BY_IDS = gql`
  query GetMaidsByIds($maidIds: [uuid!]!) {
    maid_profiles(where: { id: { _in: $maidIds } }) {
      id
      full_name
      avatar_url
    }
  }
`;

const GET_REVIEWS_BY_SPONSOR_AND_MAIDS = gql`
  query GetReviewsBySponsorAndMaids($sponsorId: uuid!, $maidIds: [uuid!]!) {
    reviews(
      where: { sponsor_id: { _eq: $sponsorId }, maid_id: { _in: $maidIds } }
    ) {
      id
      rating
      comment
      created_at
      maid_id
    }
  }
`;

const GET_SPONSOR_REVIEWS = gql`
  query GetSponsorReviews($sponsorId: uuid!) {
    reviews(
      where: { sponsor_id: { _eq: $sponsorId } }
      order_by: { created_at: desc }
    ) {
      id
      rating
      comment
      created_at
      maid_id
    }
  }
`;

const CHECK_EXISTING_REVIEW = gql`
  query CheckExistingReview($sponsorId: uuid!, $maidId: uuid!) {
    reviews(
      where: { sponsor_id: { _eq: $sponsorId }, maid_id: { _eq: $maidId } }
    ) {
      id
    }
  }
`;

const CREATE_REVIEW = gql`
  mutation CreateReview($object: reviews_insert_input!) {
    insert_reviews_one(object: $object) {
      id
      sponsor_id
      maid_id
      rating
      comment
      created_at
    }
  }
`;

const GET_REVIEW_BY_ID = gql`
  query GetReviewById($reviewId: uuid!) {
    reviews_by_pk(id: $reviewId) {
      id
      sponsor_id
    }
  }
`;

const UPDATE_REVIEW = gql`
  mutation UpdateReview($reviewId: uuid!, $set: reviews_set_input!) {
    update_reviews_by_pk(pk_columns: { id: $reviewId }, _set: $set) {
      id
      rating
      comment
      updated_at
    }
  }
`;

const DELETE_REVIEW = gql`
  mutation DeleteReview($reviewId: uuid!) {
    delete_reviews_by_pk(id: $reviewId) {
      id
    }
  }
`;

const GET_MAID_REVIEWS = gql`
  query GetMaidReviews($maidId: uuid!) {
    reviews(where: { maid_id: { _eq: $maidId } }) {
      rating
    }
  }
`;

/**
 * Fetch all completed bookings for a sponsor that are eligible for feedback
 * @param {string} sponsorId - UUID of the sponsor
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getCompletedBookingsForFeedback = async (sponsorId) => {
  try {
    // First, get completed bookings
    const { data: bookingsData, errors: bookingsErrors } = await apolloClient.query({
      query: GET_COMPLETED_BOOKINGS_FOR_FEEDBACK,
      variables: { sponsorId },
      fetchPolicy: 'network-only'
    });

    if (bookingsErrors) throw new Error(bookingsErrors[0]?.message || 'GraphQL error');

    const bookings = bookingsData?.bookings || [];

    if (bookings.length === 0) {
      return { success: true, data: [] };
    }

    // Get maid information for all bookings
    const maidIds = [...new Set(bookings.map(b => b.maid_id))];
    const { data: maidsData, errors: maidsErrors } = await apolloClient.query({
      query: GET_MAIDS_BY_IDS,
      variables: { maidIds },
      fetchPolicy: 'network-only'
    });

    if (maidsErrors) throw new Error(maidsErrors[0]?.message || 'GraphQL error');

    // Get existing reviews for this sponsor and these maids
    const { data: reviewsData, errors: reviewsErrors } = await apolloClient.query({
      query: GET_REVIEWS_BY_SPONSOR_AND_MAIDS,
      variables: { sponsorId, maidIds },
      fetchPolicy: 'network-only'
    });

    if (reviewsErrors) throw new Error(reviewsErrors[0]?.message || 'GraphQL error');

    const maids = maidsData?.maid_profiles || [];
    const reviews = reviewsData?.reviews || [];

    // Create maps for quick lookup
    const maidMap = new Map(maids.map(m => [m.id, m]));
    const reviewMap = new Map(reviews.map(r => [r.maid_id, r]));

    // Format the data for easier use
    const formattedBookings = bookings.map(booking => {
      const maid = maidMap.get(booking.maid_id);
      const review = reviewMap.get(booking.maid_id);

      return {
        id: booking.id,
        maidId: booking.maid_id,
        maidName: maid?.full_name || 'Unknown',
        maidAvatar: maid?.avatar_url,
        startDate: booking.start_date,
        endDate: booking.end_date,
        bookingType: booking.booking_type,
        hasReview: !!review,
        existingReview: review || null,
      };
    });

    return {
      success: true,
      data: formattedBookings,
    };
  } catch (error) {
    console.error('Error fetching completed bookings:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch completed bookings',
    };
  }
};

/**
 * Fetch all reviews submitted by a sponsor
 * @param {string} sponsorId - UUID of the sponsor (reviewer)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getSponsorReviews = async (sponsorId) => {
  try {
    // Get all reviews by this sponsor
    const { data: reviewsData, errors: reviewsErrors } = await apolloClient.query({
      query: GET_SPONSOR_REVIEWS,
      variables: { sponsorId },
      fetchPolicy: 'network-only'
    });

    if (reviewsErrors) throw new Error(reviewsErrors[0]?.message || 'GraphQL error');

    const reviews = reviewsData?.reviews || [];

    if (reviews.length === 0) {
      return { success: true, data: [] };
    }

    // Get maid information for all reviewees
    const maidIds = [...new Set(reviews.map(r => r.maid_id))];
    const { data: maidsData, errors: maidsErrors } = await apolloClient.query({
      query: GET_MAIDS_BY_IDS,
      variables: { maidIds },
      fetchPolicy: 'network-only'
    });

    if (maidsErrors) throw new Error(maidsErrors[0]?.message || 'GraphQL error');

    const maids = maidsData?.maid_profiles || [];

    // Create map for quick lookup
    const maidMap = new Map(maids.map(m => [m.id, m]));

    // Format the data (simplified to match actual schema)
    const formattedReviews = reviews.map(review => {
      const maid = maidMap.get(review.maid_id);

      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        maidId: review.maid_id,
        maidName: maid?.full_name || 'Unknown',
        maidAvatar: maid?.avatar_url,
      };
    });

    return {
      success: true,
      data: formattedReviews,
    };
  } catch (error) {
    console.error('Error fetching sponsor reviews:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch reviews',
    };
  }
};

/**
 * Create a new review for a completed booking
 * @param {Object} reviewData - Review data
 * @param {string} reviewData.sponsorId - UUID of the sponsor
 * @param {string} reviewData.maidId - UUID of the maid
 * @param {number} reviewData.rating - Rating from 1-5
 * @param {string} reviewData.comment - Review comment
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createReview = async (reviewData) => {
  try {
    // Validate required fields
    if (!reviewData.sponsorId || !reviewData.maidId) {
      throw new Error('Sponsor ID and Maid ID are required');
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (!reviewData.comment || reviewData.comment.trim().length === 0) {
      throw new Error('Comment is required');
    }

    // Prevent self-reviews
    if (reviewData.sponsorId === reviewData.maidId) {
      throw new Error('You cannot review yourself');
    }

    // Check if review already exists for this maid by this sponsor
    const { data: existingData, errors: existingErrors } = await apolloClient.query({
      query: CHECK_EXISTING_REVIEW,
      variables: { sponsorId: reviewData.sponsorId, maidId: reviewData.maidId },
      fetchPolicy: 'network-only'
    });

    if (existingErrors) throw new Error(existingErrors[0]?.message || 'GraphQL error');

    const existingReviews = existingData?.reviews || [];

    if (existingReviews.length > 0) {
      throw new Error('You have already submitted a review for this maid');
    }

    // Create the review (only fields that exist in schema)
    const { data: newReviewData, errors: newReviewErrors } = await apolloClient.mutate({
      mutation: CREATE_REVIEW,
      variables: {
        object: {
          sponsor_id: reviewData.sponsorId,
          maid_id: reviewData.maidId,
          rating: reviewData.rating,
          comment: reviewData.comment.trim(),
        }
      }
    });

    if (newReviewErrors) throw new Error(newReviewErrors[0]?.message || 'GraphQL error');

    return {
      success: true,
      data: newReviewData?.insert_reviews_one,
      message: 'Review submitted successfully',
    };
  } catch (error) {
    console.error('Error creating review:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit review',
    };
  }
};

/**
 * Update an existing review
 * @param {string} reviewId - UUID of the review
 * @param {string} sponsorId - UUID of the sponsor (for permission check)
 * @param {Object} updates - Fields to update
 * @param {number} updates.rating - Updated rating (optional)
 * @param {string} updates.comment - Updated comment (optional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateReview = async (reviewId, sponsorId, updates) => {
  try {
    // Verify the review belongs to the sponsor
    const { data: existingData, errors: existingErrors } = await apolloClient.query({
      query: GET_REVIEW_BY_ID,
      variables: { reviewId },
      fetchPolicy: 'network-only'
    });

    if (existingErrors) throw new Error('Review not found');

    const existingReview = existingData?.reviews_by_pk;

    if (!existingReview) {
      throw new Error('Review not found');
    }

    if (existingReview.sponsor_id !== sponsorId) {
      throw new Error('You can only edit your own reviews');
    }

    // Validate updates
    const updateData = {};

    if (updates.rating !== undefined) {
      if (updates.rating < 1 || updates.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      updateData.rating = updates.rating;
    }

    if (updates.comment !== undefined) {
      if (!updates.comment || updates.comment.trim().length === 0) {
        throw new Error('Comment cannot be empty');
      }
      updateData.comment = updates.comment.trim();
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid updates provided');
    }

    // Update the review
    const { data: updatedData, errors: updateErrors } = await apolloClient.mutate({
      mutation: UPDATE_REVIEW,
      variables: { reviewId, set: updateData }
    });

    if (updateErrors) throw new Error(updateErrors[0]?.message || 'GraphQL error');

    return {
      success: true,
      data: updatedData?.update_reviews_by_pk,
      message: 'Review updated successfully',
    };
  } catch (error) {
    console.error('Error updating review:', error);
    return {
      success: false,
      error: error.message || 'Failed to update review',
    };
  }
};

/**
 * Delete a review (hard delete since no status column exists)
 * @param {string} reviewId - UUID of the review
 * @param {string} sponsorId - UUID of the sponsor (for permission check)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteReview = async (reviewId, sponsorId) => {
  try {
    // Verify the review belongs to the sponsor
    const { data: existingData, errors: existingErrors } = await apolloClient.query({
      query: GET_REVIEW_BY_ID,
      variables: { reviewId },
      fetchPolicy: 'network-only'
    });

    if (existingErrors) throw new Error('Review not found');

    const existingReview = existingData?.reviews_by_pk;

    if (!existingReview) {
      throw new Error('Review not found');
    }

    if (existingReview.sponsor_id !== sponsorId) {
      throw new Error('You can only delete your own reviews');
    }

    // Hard delete the review
    const { errors: deleteErrors } = await apolloClient.mutate({
      mutation: DELETE_REVIEW,
      variables: { reviewId }
    });

    if (deleteErrors) throw new Error(deleteErrors[0]?.message || 'GraphQL error');

    return {
      success: true,
      message: 'Review deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting review:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete review',
    };
  }
};

/**
 * Get review statistics for a maid
 * @param {string} maidId - UUID of the maid
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getMaidReviewStats = async (maidId) => {
  try {
    const { data, errors } = await apolloClient.query({
      query: GET_MAID_REVIEWS,
      variables: { maidId },
      fetchPolicy: 'network-only'
    });

    if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

    const reviews = data?.reviews || [];

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return {
      success: true,
      data: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
      },
    };
  } catch (error) {
    console.error('Error fetching maid review stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch review statistics',
    };
  }
};

/**
 * Check if a sponsor can review a specific maid
 * @param {string} sponsorId - UUID of the sponsor
 * @param {string} maidId - UUID of the maid
 * @returns {Promise<{success: boolean, canReview: boolean, reason?: string}>}
 */
export const canReviewMaid = async (sponsorId, maidId) => {
  try {
    // Check if review already exists
    const { data, errors } = await apolloClient.query({
      query: CHECK_EXISTING_REVIEW,
      variables: { sponsorId, maidId },
      fetchPolicy: 'network-only'
    });

    if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

    const existingReviews = data?.reviews || [];

    if (existingReviews.length > 0) {
      return {
        success: true,
        canReview: false,
        reason: 'You have already reviewed this maid',
      };
    }

    return {
      success: true,
      canReview: true,
    };
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return {
      success: false,
      canReview: false,
      reason: error.message || 'Failed to check review eligibility',
    };
  }
};

export default {
  getCompletedBookingsForFeedback,
  getSponsorReviews,
  createReview,
  updateReview,
  deleteReview,
  getMaidReviewStats,
  canReviewMaid,
};
