/**
 * Review Service - GraphQL Implementation (Simplified)
 * Works with existing simple reviews table schema
 * Schema: id, sponsor_id, maid_id, rating, comment, created_at
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
      sponsor_id
      maid_id
      rating
      comment
      created_at
    }
  }
`;

const ListReviewsForMaidDocument = gql`
  query ListReviewsForMaid(
    $maidId: String!
    $limit: Int = 20
    $offset: Int = 0
  ) {
    reviews(
      where: {maid_id: {_eq: $maidId}}
      limit: $limit
      offset: $offset
      order_by: [{created_at: desc}]
    ) {
      id
      sponsor_id
      maid_id
      rating
      comment
      created_at
    }
    reviews_aggregate(where: {maid_id: {_eq: $maidId}}) {
      aggregate {
        count
      }
    }
  }
`;

const ListReviewsBySponsorDocument = gql`
  query ListReviewsBySponsor(
    $sponsorId: String!
    $limit: Int = 20
    $offset: Int = 0
  ) {
    reviews(
      where: {sponsor_id: {_eq: $sponsorId}}
      limit: $limit
      offset: $offset
      order_by: [{created_at: desc}]
    ) {
      id
      sponsor_id
      maid_id
      rating
      comment
      created_at
    }
    reviews_aggregate(where: {sponsor_id: {_eq: $sponsorId}}) {
      aggregate {
        count
      }
    }
  }
`;

const GetAverageRatingForMaidDocument = gql`
  query GetAverageRatingForMaid($maidId: String!) {
    reviews_aggregate(where: {maid_id: {_eq: $maidId}}) {
      aggregate {
        avg {
          rating
        }
        count
      }
    }
  }
`;

const GetRatingBreakdownForMaidDocument = gql`
  query GetRatingBreakdownForMaid($maidId: String!) {
    five_star: reviews_aggregate(
      where: {maid_id: {_eq: $maidId}, rating: {_eq: 5}}
    ) {
      aggregate {
        count
      }
    }
    four_star: reviews_aggregate(
      where: {maid_id: {_eq: $maidId}, rating: {_eq: 4}}
    ) {
      aggregate {
        count
      }
    }
    three_star: reviews_aggregate(
      where: {maid_id: {_eq: $maidId}, rating: {_eq: 3}}
    ) {
      aggregate {
        count
      }
    }
    two_star: reviews_aggregate(
      where: {maid_id: {_eq: $maidId}, rating: {_eq: 2}}
    ) {
      aggregate {
        count
      }
    }
    one_star: reviews_aggregate(
      where: {maid_id: {_eq: $maidId}, rating: {_eq: 1}}
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
      sponsor_id
      maid_id
      rating
      comment
      created_at
    }
  }
`;

const UpdateReviewDocument = gql`
  mutation UpdateReview($id: uuid!, $rating: Int, $comment: String) {
    update_reviews_by_pk(
      pk_columns: {id: $id}
      _set: {rating: $rating, comment: $comment}
    ) {
      id
      rating
      comment
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

// =====================================================
// SERVICE IMPLEMENTATION
// =====================================================

export const graphqlReviewService = {
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
   * Get reviews for a maid
   */
  async getReviewsForMaid(maidId, options = {}) {
    try {
      log.info('📋 [GraphQL] Fetching reviews for maid:', maidId);

      const variables = {
        maidId,
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      const { data, errors } = await apolloClient.query({
        query: ListReviewsForMaidDocument,
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
      log.error('❌ [GraphQL] Error fetching maid reviews:', error);
      return { data: [], count: 0, error };
    }
  },

  /**
   * Get reviews by a sponsor
   */
  async getReviewsBySponsor(sponsorId, options = {}) {
    try {
      log.info('📝 [GraphQL] Fetching reviews by sponsor:', sponsorId);

      const variables = {
        sponsorId,
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      const { data, errors } = await apolloClient.query({
        query: ListReviewsBySponsorDocument,
        variables,
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const reviews = data?.reviews || [];
      const totalCount = data?.reviews_aggregate?.aggregate?.count || 0;

      log.info(`✅ [GraphQL] Fetched ${reviews.length} reviews by sponsor`);
      return { data: reviews, count: totalCount, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching sponsor reviews:', error);
      return { data: [], count: 0, error };
    }
  },

  /**
   * Get average rating for a maid
   */
  async getAverageRating(maidId) {
    try {
      log.info('⭐ [GraphQL] Getting average rating for maid:', maidId);

      const { data, errors } = await apolloClient.query({
        query: GetAverageRatingForMaidDocument,
        variables: { maidId },
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
   * Get rating breakdown for a maid
   */
  async getRatingBreakdown(maidId) {
    try {
      log.info('📊 [GraphQL] Getting rating breakdown for maid:', maidId);

      const { data, errors } = await apolloClient.query({
        query: GetRatingBreakdownForMaidDocument,
        variables: { maidId },
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
            sponsor_id: reviewData.sponsor_id,
            maid_id: reviewData.maid_id,
            rating: reviewData.rating,
            comment: reviewData.comment || null,
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
          rating: updates.rating,
          comment: updates.comment,
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
};

export default graphqlReviewService;
