import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminReviewsService');

// ============================================
// GraphQL Queries
// ============================================

const GET_ADMIN_REVIEWS = gql`
  query GetAdminReviews(
    $where: reviews_bool_exp
    $orderBy: [reviews_order_by!]
    $limit: Int!
    $offset: Int!
  ) {
    reviews(
      where: $where
      order_by: $orderBy
      limit: $limit
      offset: $offset
    ) {
      id
      rating
      comment
      created_at
      maid_id
      sponsor_id
    }
    reviews_aggregate(where: $where) {
      aggregate {
        count
        avg {
          rating
        }
      }
    }
  }
`;

const GET_ADMIN_REVIEW_BY_ID = gql`
  query GetAdminReviewById($id: uuid!) {
    reviews_by_pk(id: $id) {
      id
      rating
      comment
      created_at
      maid_id
      sponsor_id
    }
  }
`;

const GET_ADMIN_REVIEWS_STATS = gql`
  query GetAdminReviewsStats {
    total: reviews_aggregate {
      aggregate {
        count
        avg {
          rating
        }
      }
    }
    rating_5: reviews_aggregate(where: { rating: { _eq: 5 } }) {
      aggregate {
        count
      }
    }
    rating_4: reviews_aggregate(where: { rating: { _eq: 4 } }) {
      aggregate {
        count
      }
    }
    rating_3: reviews_aggregate(where: { rating: { _eq: 3 } }) {
      aggregate {
        count
      }
    }
    rating_2: reviews_aggregate(where: { rating: { _eq: 2 } }) {
      aggregate {
        count
      }
    }
    rating_1: reviews_aggregate(where: { rating: { _eq: 1 } }) {
      aggregate {
        count
      }
    }
  }
`;

// Query to get sponsor info by IDs
const GET_SPONSORS_BY_IDS = gql`
  query GetSponsorsByIds($ids: [String!]!) {
    sponsors(where: { id: { _in: $ids } }) {
      id
      full_name
      email
      phone_number
    }
  }
`;

// Query to get maid info by IDs
const GET_MAIDS_BY_IDS = gql`
  query GetMaidsByIds($ids: [uuid!]!) {
    maids(where: { id: { _in: $ids } }) {
      id
      full_name
      email
      phone_number
      profile_photo_url
    }
  }
`;

// ============================================
// GraphQL Mutations
// ============================================

const DELETE_REVIEW = gql`
  mutation DeleteReview($id: uuid!) {
    delete_reviews_by_pk(id: $id) {
      id
    }
  }
`;

const UPDATE_REVIEW = gql`
  mutation UpdateReview($id: uuid!, $data: reviews_set_input!) {
    update_reviews_by_pk(
      pk_columns: { id: $id }
      _set: $data
    ) {
      id
      rating
      comment
      created_at
    }
  }
`;

// ============================================
// Service Functions
// ============================================

/**
 * Build GraphQL where clause for admin review filters
 */
function buildAdminReviewFilters(filters) {
  if (!filters) return {};

  const conditions = [];

  // Rating filter
  if (filters.rating && filters.rating !== 'all') {
    if (filters.rating === 'high') {
      conditions.push({ rating: { _gte: 4 } });
    } else if (filters.rating === 'medium') {
      conditions.push({ rating: { _eq: 3 } });
    } else if (filters.rating === 'low') {
      conditions.push({ rating: { _lte: 2 } });
    } else if (!isNaN(parseInt(filters.rating))) {
      conditions.push({ rating: { _eq: parseInt(filters.rating) } });
    }
  }

  // Date range filter
  if (filters.dateFrom) {
    conditions.push({ created_at: { _gte: filters.dateFrom } });
  }
  if (filters.dateTo) {
    conditions.push({ created_at: { _lte: filters.dateTo } });
  }

  // Search term
  if (filters.searchTerm && filters.searchTerm.trim()) {
    const term = `%${filters.searchTerm.trim()}%`;
    conditions.push({
      comment: { _ilike: term },
    });
  }

  // Maid ID filter
  if (filters.maidId) {
    conditions.push({ maid_id: { _eq: filters.maidId } });
  }

  // Sponsor ID filter
  if (filters.sponsorId) {
    conditions.push({ sponsor_id: { _eq: filters.sponsorId } });
  }

  return conditions.length > 0 ? { _and: conditions } : {};
}

/**
 * Build order_by clause
 */
function buildOrderBy(sortBy, sortDirection = 'desc') {
  const direction = sortDirection === 'asc' ? 'asc' : 'desc';

  switch (sortBy) {
    case 'rating':
      return [{ rating: direction }];
    case 'comment':
      return [{ comment: direction }];
    case 'created':
    default:
      return [{ created_at: direction }];
  }
}

/**
 * Fetch sponsor details for a list of sponsor IDs
 */
async function fetchSponsorDetails(sponsorIds) {
  if (!sponsorIds || sponsorIds.length === 0) return {};

  try {
    const { data, errors } = await apolloClient.query({
      query: GET_SPONSORS_BY_IDS,
      variables: { ids: sponsorIds },
      fetchPolicy: 'network-only',
    });

    if (errors?.length > 0) {
      log.error('[AdminReviews] Error fetching sponsors:', errors);
      return {};
    }

    const sponsorMap = {};
    (data?.sponsors || []).forEach(sponsor => {
      sponsorMap[sponsor.id] = sponsor;
    });
    return sponsorMap;
  } catch (error) {
    log.error('[AdminReviews] Error fetching sponsors:', error);
    return {};
  }
}

/**
 * Fetch maid details for a list of maid IDs
 */
async function fetchMaidDetails(maidIds) {
  if (!maidIds || maidIds.length === 0) return {};

  try {
    const { data, errors } = await apolloClient.query({
      query: GET_MAIDS_BY_IDS,
      variables: { ids: maidIds },
      fetchPolicy: 'network-only',
    });

    if (errors?.length > 0) {
      log.error('[AdminReviews] Error fetching maids:', errors);
      return {};
    }

    const maidMap = {};
    (data?.maids || []).forEach(maid => {
      maidMap[maid.id] = maid;
    });
    return maidMap;
  } catch (error) {
    log.error('[AdminReviews] Error fetching maids:', error);
    return {};
  }
}

export const adminReviewsService = {
  /**
   * Get all reviews with filtering, search, sorting, and pagination
   */
  async getReviews({
    filters = {},
    sortBy = 'created',
    sortDirection = 'desc',
    page = 1,
    limit = 20,
  } = {}) {
    try {
      const where = buildAdminReviewFilters(filters);
      const orderBy = buildOrderBy(sortBy, sortDirection);
      const offset = (page - 1) * limit;

      const { data, errors } = await apolloClient.query({
        query: GET_ADMIN_REVIEWS,
        variables: { where, orderBy, limit, offset },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const reviews = data?.reviews || [];
      const totalCount = data?.reviews_aggregate?.aggregate?.count || 0;
      const averageRating = data?.reviews_aggregate?.aggregate?.avg?.rating || 0;

      // Get unique sponsor and maid IDs
      const sponsorIds = [...new Set(reviews.map(r => r.sponsor_id).filter(Boolean))];
      const maidIds = [...new Set(reviews.map(r => r.maid_id).filter(Boolean))];

      // Fetch related user details
      const [sponsorMap, maidMap] = await Promise.all([
        fetchSponsorDetails(sponsorIds),
        fetchMaidDetails(maidIds),
      ]);

      // Enrich reviews with user info
      const enrichedReviews = reviews.map(review => ({
        ...review,
        reviewer: sponsorMap[review.sponsor_id] || {
          id: review.sponsor_id,
          full_name: 'Unknown Sponsor',
          type: 'sponsor',
        },
        reviewed_user: maidMap[review.maid_id] || {
          id: review.maid_id,
          full_name: 'Unknown Maid',
          type: 'maid',
        },
      }));

      log.debug(`[AdminReviews] Fetched ${reviews.length} reviews (total: ${totalCount})`);

      return {
        data: {
          reviews: enrichedReviews,
          totalCount,
          averageRating,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
        error: null,
      };
    } catch (error) {
      log.error('[AdminReviews] Error fetching reviews:', error);
      return { data: null, error };
    }
  },

  /**
   * Get single review by ID with full details
   */
  async getReviewById(reviewId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_ADMIN_REVIEW_BY_ID,
        variables: { id: reviewId },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const review = data?.reviews_by_pk;
      if (!review) {
        return { data: null, error: new Error('Review not found') };
      }

      // Fetch related user details
      const [sponsorMap, maidMap] = await Promise.all([
        fetchSponsorDetails(review.sponsor_id ? [review.sponsor_id] : []),
        fetchMaidDetails(review.maid_id ? [review.maid_id] : []),
      ]);

      const enrichedReview = {
        ...review,
        reviewer: sponsorMap[review.sponsor_id] || {
          id: review.sponsor_id,
          full_name: 'Unknown Sponsor',
          type: 'sponsor',
        },
        reviewed_user: maidMap[review.maid_id] || {
          id: review.maid_id,
          full_name: 'Unknown Maid',
          type: 'maid',
        },
      };

      return { data: enrichedReview, error: null };
    } catch (error) {
      log.error('[AdminReviews] Error fetching review:', error);
      return { data: null, error };
    }
  },

  /**
   * Get dashboard statistics
   */
  async getStats() {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_ADMIN_REVIEWS_STATS,
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const stats = {
        total: data?.total?.aggregate?.count || 0,
        averageRating: data?.total?.aggregate?.avg?.rating || 0,
        rating5: data?.rating_5?.aggregate?.count || 0,
        rating4: data?.rating_4?.aggregate?.count || 0,
        rating3: data?.rating_3?.aggregate?.count || 0,
        rating2: data?.rating_2?.aggregate?.count || 0,
        rating1: data?.rating_1?.aggregate?.count || 0,
      };

      log.debug('[AdminReviews] Fetched stats:', stats);
      return { data: stats, error: null };
    } catch (error) {
      log.error('[AdminReviews] Error fetching stats:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: DELETE_REVIEW,
        variables: { id: reviewId },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminReviews] Review deleted: ${reviewId}`);
      return { data: data?.delete_reviews_by_pk, error: null };
    } catch (error) {
      log.error('[AdminReviews] Error deleting review:', error);
      return { data: null, error };
    }
  },

  /**
   * Update a review (e.g., edit comment for moderation)
   */
  async updateReview(reviewId, reviewData) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_REVIEW,
        variables: { id: reviewId, data: reviewData },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`[AdminReviews] Review updated: ${reviewId}`);
      return { data: data?.update_reviews_by_pk, error: null };
    } catch (error) {
      log.error('[AdminReviews] Error updating review:', error);
      return { data: null, error };
    }
  },
};

export default adminReviewsService;
