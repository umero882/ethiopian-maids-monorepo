/**
 * Review Service - GraphQL Implementation
 * Uses inline gql documents to bypass codegen requirement
 *
 * This service handles all review/rating operations via GraphQL/Hasura
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('ReviewService.GraphQL');

// =====================================================
// INLINE GRAPHQL DOCUMENTS - QUERIES
// =====================================================

const GetReviewDocument = gql`
  query GetReview($id: uuid!) {
    reviews_by_pk(id: $id) {
      id
      reviewer_id
      reviewee_id
      booking_id
      rating
      title
      comment
      review_type
      communication_rating
      professionalism_rating
      work_quality_rating
      reliability_rating
      status
      is_verified
      is_featured
      is_anonymous
      helpful_count
      unhelpful_count
      response
      response_at
      created_at
      updated_at
    }
  }
`;

const ListReviewsForUserDocument = gql`
  query ListReviewsForUser(
    $userId: String!
    $limit: Int = 20
    $offset: Int = 0
    $status: String
  ) {
    reviews(
      where: {
        reviewee_id: {_eq: $userId}
        status: {_eq: $status}
      }
      limit: $limit
      offset: $offset
      order_by: [{created_at: desc}]
    ) {
      id
      reviewer_id
      reviewee_id
      rating
      title
      comment
      review_type
      communication_rating
      professionalism_rating
      work_quality_rating
      reliability_rating
      status
      is_verified
      is_featured
      helpful_count
      response
      response_at
      created_at
    }
    reviews_aggregate(
      where: {
        reviewee_id: {_eq: $userId}
        status: {_eq: $status}
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const ListAllReviewsForUserDocument = gql`
  query ListAllReviewsForUser(
    $userId: String!
    $limit: Int = 20
    $offset: Int = 0
  ) {
    reviews(
      where: {reviewee_id: {_eq: $userId}}
      limit: $limit
      offset: $offset
      order_by: [{created_at: desc}]
    ) {
      id
      reviewer_id
      reviewee_id
      rating
      title
      comment
      review_type
      communication_rating
      professionalism_rating
      work_quality_rating
      reliability_rating
      status
      is_verified
      is_featured
      helpful_count
      response
      response_at
      created_at
    }
    reviews_aggregate(where: {reviewee_id: {_eq: $userId}}) {
      aggregate {
        count
      }
    }
  }
`;

const GetReviewsByReviewerDocument = gql`
  query GetReviewsByReviewer(
    $reviewerId: String!
    $limit: Int = 20
    $offset: Int = 0
  ) {
    reviews(
      where: {reviewer_id: {_eq: $reviewerId}}
      limit: $limit
      offset: $offset
      order_by: [{created_at: desc}]
    ) {
      id
      reviewer_id
      reviewee_id
      rating
      title
      comment
      review_type
      status
      created_at
    }
    reviews_aggregate(where: {reviewer_id: {_eq: $reviewerId}}) {
      aggregate {
        count
      }
    }
  }
`;

const GetAverageRatingDocument = gql`
  query GetAverageRating($userId: String!) {
    reviews_aggregate(
      where: {
        reviewee_id: {_eq: $userId}
        status: {_eq: "approved"}
      }
    ) {
      aggregate {
        avg {
          rating
        }
        count
      }
    }
  }
`;

const GetRatingBreakdownDocument = gql`
  query GetRatingBreakdown($userId: String!) {
    five_star: reviews_aggregate(
      where: {reviewee_id: {_eq: $userId}, status: {_eq: "approved"}, rating: {_eq: 5}}
    ) {
      aggregate {
        count
      }
    }
    four_star: reviews_aggregate(
      where: {reviewee_id: {_eq: $userId}, status: {_eq: "approved"}, rating: {_eq: 4}}
    ) {
      aggregate {
        count
      }
    }
    three_star: reviews_aggregate(
      where: {reviewee_id: {_eq: $userId}, status: {_eq: "approved"}, rating: {_eq: 3}}
    ) {
      aggregate {
        count
      }
    }
    two_star: reviews_aggregate(
      where: {reviewee_id: {_eq: $userId}, status: {_eq: "approved"}, rating: {_eq: 2}}
    ) {
      aggregate {
        count
      }
    }
    one_star: reviews_aggregate(
      where: {reviewee_id: {_eq: $userId}, status: {_eq: "approved"}, rating: {_eq: 1}}
    ) {
      aggregate {
        count
      }
    }
  }
`;

// =====================================================
// INLINE GRAPHQL DOCUMENTS - MUTATIONS
// =====================================================

const CreateReviewDocument = gql`
  mutation CreateReview($data: reviews_insert_input!) {
    insert_reviews_one(object: $data) {
      id
      reviewer_id
      reviewee_id
      booking_id
      rating
      title
      comment
      review_type
      communication_rating
      professionalism_rating
      work_quality_rating
      reliability_rating
      status
      created_at
    }
  }
`;

const UpdateReviewDocument = gql`
  mutation UpdateReview($id: uuid!, $updates: reviews_set_input!) {
    update_reviews_by_pk(pk_columns: {id: $id}, _set: $updates) {
      id
      rating
      title
      comment
      communication_rating
      professionalism_rating
      work_quality_rating
      reliability_rating
      updated_at
    }
  }
`;

const ApproveReviewDocument = gql`
  mutation ApproveReview($id: uuid!) {
    update_reviews_by_pk(
      pk_columns: {id: $id}
      _set: {status: "approved"}
    ) {
      id
      status
      updated_at
    }
  }
`;

const RejectReviewDocument = gql`
  mutation RejectReview($id: uuid!, $reason: String) {
    update_reviews_by_pk(
      pk_columns: {id: $id}
      _set: {status: "rejected", moderation_reason: $reason}
    ) {
      id
      status
      moderation_reason
      updated_at
    }
  }
`;

const AddReviewResponseDocument = gql`
  mutation AddReviewResponse($id: uuid!, $response: String!) {
    update_reviews_by_pk(
      pk_columns: {id: $id}
      _set: {response: $response, response_at: "now()"}
    ) {
      id
      response
      response_at
      updated_at
    }
  }
`;

const DeleteReviewDocument = gql`
  mutation DeleteReview($id: uuid!) {
    delete_reviews_by_pk(id: $id) {
      id
    }
  }
`;

const MarkReviewHelpfulDocument = gql`
  mutation MarkReviewHelpful($reviewId: uuid!, $userId: String!, $isHelpful: Boolean!) {
    insert_review_helpful_votes_one(
      object: {
        review_id: $reviewId
        user_id: $userId
        is_helpful: $isHelpful
      }
      on_conflict: {
        constraint: review_helpful_votes_review_id_user_id_key
        update_columns: [is_helpful]
      }
    ) {
      id
      is_helpful
    }
  }
`;

const RemoveHelpfulVoteDocument = gql`
  mutation RemoveHelpfulVote($reviewId: uuid!, $userId: String!) {
    delete_review_helpful_votes(
      where: {
        review_id: {_eq: $reviewId}
        user_id: {_eq: $userId}
      }
    ) {
      affected_rows
    }
  }
`;

// =====================================================
// SERVICE IMPLEMENTATION
// =====================================================

export const graphqlReviewService = {
  // =====================================================
  // QUERY METHODS
  // =====================================================

  /**
   * Get a single review by ID
   */
  async getReview(reviewId) {
    try {
      log.info('🔍 [GraphQL] Fetching review:', reviewId);

      const { data, errors } = await apolloClient.query({
        query: GetReviewDocument,
        variables: { id: reviewId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const review = data?.reviews_by_pk;

      if (!review) {
        return {
          data: null,
          error: { code: 'REVIEW_NOT_FOUND', message: 'Review not found' },
        };
      }

      log.info('✅ [GraphQL] Review fetched successfully');
      return { data: review, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching review:', error);
      return { data: null, error };
    }
  },

  /**
   * Get reviews for a user (reviews about them)
   */
  async getReviewsForUser(userId, options = {}) {
    try {
      log.info('📋 [GraphQL] Fetching reviews for user:', userId);

      const variables = {
        userId,
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      // Add status filter if specified
      if (options.status) {
        variables.status = options.status;
      }

      const { data, errors } = await apolloClient.query({
        query: options.status
          ? ListReviewsForUserDocument
          : ListAllReviewsForUserDocument,
        variables,
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const reviews = data?.reviews || [];
      const totalCount = data?.reviews_aggregate?.aggregate?.count || 0;

      log.info(`✅ [GraphQL] Fetched ${reviews.length} reviews (total: ${totalCount})`);
      return { data: reviews, count: totalCount, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching user reviews:', error);
      return { data: [], count: 0, error };
    }
  },

  /**
   * Get reviews by a user (reviews they wrote)
   */
  async getReviewsByReviewer(reviewerId, options = {}) {
    try {
      log.info('📝 [GraphQL] Fetching reviews by reviewer:', reviewerId);

      const variables = {
        reviewerId,
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      const { data, errors } = await apolloClient.query({
        query: GetReviewsByReviewerDocument,
        variables,
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const reviews = data?.reviews || [];
      const totalCount = data?.reviews_aggregate?.aggregate?.count || 0;

      log.info(`✅ [GraphQL] Fetched ${reviews.length} reviews by reviewer`);
      return { data: reviews, count: totalCount, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching reviewer reviews:', error);
      return { data: [], count: 0, error };
    }
  },

  /**
   * Get average rating for a user
   */
  async getAverageRating(userId) {
    try {
      log.info('⭐ [GraphQL] Getting average rating for user:', userId);

      const { data, errors } = await apolloClient.query({
        query: GetAverageRatingDocument,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const avg = data?.reviews_aggregate?.aggregate?.avg?.rating || 0;
      const count = data?.reviews_aggregate?.aggregate?.count || 0;

      const result = {
        average: avg ? parseFloat(avg.toFixed(2)) : 0,
        total_reviews: count,
      };

      log.info(`✅ [GraphQL] Average rating: ${result.average} (${result.total_reviews} reviews)`);
      return { data: result, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error getting average rating:', error);
      return { data: { average: 0, total_reviews: 0 }, error };
    }
  },

  /**
   * Get rating breakdown (star distribution)
   */
  async getRatingBreakdown(userId) {
    try {
      log.info('📊 [GraphQL] Getting rating breakdown for user:', userId);

      const { data, errors } = await apolloClient.query({
        query: GetRatingBreakdownDocument,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const breakdown = {
        five_star: data?.five_star?.aggregate?.count || 0,
        four_star: data?.four_star?.aggregate?.count || 0,
        three_star: data?.three_star?.aggregate?.count || 0,
        two_star: data?.two_star?.aggregate?.count || 0,
        one_star: data?.one_star?.aggregate?.count || 0,
      };

      const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
      const average =
        total > 0
          ? (
              (breakdown.five_star * 5 +
                breakdown.four_star * 4 +
                breakdown.three_star * 3 +
                breakdown.two_star * 2 +
                breakdown.one_star * 1) /
              total
            ).toFixed(2)
          : 0;

      const result = {
        ...breakdown,
        total_reviews: total,
        average_rating: parseFloat(average),
      };

      log.info(`✅ [GraphQL] Rating breakdown fetched`);
      return { data: result, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error getting rating breakdown:', error);
      return {
        data: {
          five_star: 0,
          four_star: 0,
          three_star: 0,
          two_star: 0,
          one_star: 0,
          total_reviews: 0,
          average_rating: 0,
        },
        error,
      };
    }
  },

  // =====================================================
  // MUTATION METHODS
  // =====================================================

  /**
   * Create a new review
   */
  async createReview(reviewData) {
    try {
      log.info('➕ [GraphQL] Creating review');

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateReviewDocument,
        variables: {
          data: {
            reviewer_id: reviewData.reviewer_id,
            reviewee_id: reviewData.reviewee_id,
            booking_id: reviewData.booking_id || null,
            rating: reviewData.rating,
            title: reviewData.title || null,
            comment: reviewData.comment || null,
            review_type: reviewData.review_type,
            communication_rating: reviewData.communication_rating || null,
            professionalism_rating: reviewData.professionalism_rating || null,
            work_quality_rating: reviewData.work_quality_rating || null,
            reliability_rating: reviewData.reliability_rating || null,
            is_anonymous: reviewData.is_anonymous || false,
            // status defaults to 'pending' in database
          },
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const review = data?.insert_reviews_one;
      log.info('✅ [GraphQL] Review created:', review?.id);
      return { data: review, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error creating review:', error);
      return { data: null, error };
    }
  },

  /**
   * Update a review
   */
  async updateReview(reviewId, updates) {
    try {
      log.info('✏️ [GraphQL] Updating review:', reviewId);

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateReviewDocument,
        variables: {
          id: reviewId,
          updates,
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const review = data?.update_reviews_by_pk;
      log.info('✅ [GraphQL] Review updated');
      return { data: review, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error updating review:', error);
      return { data: null, error };
    }
  },

  /**
   * Approve a review (moderation)
   */
  async approveReview(reviewId) {
    try {
      log.info('✅ [GraphQL] Approving review:', reviewId);

      const { data, errors } = await apolloClient.mutate({
        mutation: ApproveReviewDocument,
        variables: { id: reviewId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const review = data?.update_reviews_by_pk;
      log.info('✅ [GraphQL] Review approved');
      return { data: review, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error approving review:', error);
      return { data: null, error };
    }
  },

  /**
   * Reject a review (moderation)
   */
  async rejectReview(reviewId, reason) {
    try {
      log.info('❌ [GraphQL] Rejecting review:', reviewId);

      const { data, errors } = await apolloClient.mutate({
        mutation: RejectReviewDocument,
        variables: { id: reviewId, reason },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const review = data?.update_reviews_by_pk;
      log.info('✅ [GraphQL] Review rejected');
      return { data: review, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error rejecting review:', error);
      return { data: null, error };
    }
  },

  /**
   * Add a response to a review (reviewee responding)
   */
  async addResponse(reviewId, response) {
    try {
      log.info('💬 [GraphQL] Adding response to review:', reviewId);

      const { data, errors } = await apolloClient.mutate({
        mutation: AddReviewResponseDocument,
        variables: { id: reviewId, response },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const review = data?.update_reviews_by_pk;
      log.info('✅ [GraphQL] Response added');
      return { data: review, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error adding response:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId) {
    try {
      log.info('🗑️ [GraphQL] Deleting review:', reviewId);

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteReviewDocument,
        variables: { id: reviewId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const review = data?.delete_reviews_by_pk;
      log.info('✅ [GraphQL] Review deleted');
      return { data: review, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error deleting review:', error);
      return { data: null, error };
    }
  },

  /**
   * Mark review as helpful/unhelpful
   */
  async markReviewHelpful(reviewId, userId, isHelpful) {
    try {
      log.info(`👍 [GraphQL] Marking review as ${isHelpful ? 'helpful' : 'unhelpful'}:`, reviewId);

      const { data, errors } = await apolloClient.mutate({
        mutation: MarkReviewHelpfulDocument,
        variables: { reviewId, userId, isHelpful },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const vote = data?.insert_review_helpful_votes_one;
      log.info('✅ [GraphQL] Helpful vote recorded');
      return { data: vote, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error marking review helpful:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove helpful vote
   */
  async removeHelpfulVote(reviewId, userId) {
    try {
      log.info('🗑️ [GraphQL] Removing helpful vote:', reviewId);

      const { data, errors } = await apolloClient.mutate({
        mutation: RemoveHelpfulVoteDocument,
        variables: { reviewId, userId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const affectedRows = data?.delete_review_helpful_votes?.affected_rows || 0;
      log.info(`✅ [GraphQL] Helpful vote removed (${affectedRows} rows)`);
      return { data: affectedRows, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error removing helpful vote:', error);
      return { data: 0, error };
    }
  },
};

export default graphqlReviewService;
