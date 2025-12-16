/**
 * useReviews Hook
 *
 * Hook for managing reviews and feedback using GraphQL.
 * Connects mobile app with the reviews system.
 */

import { useCallback, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from './useAuth';

// Query to get profile ID by email
const GET_PROFILE_BY_EMAIL = gql`
  query GetProfileByEmail($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      email
    }
  }
`;

// Get reviews received by a user (reviews about them)
const GET_REVIEWS_RECEIVED = gql`
  query GetReviewsReceived($userId: String!, $limit: Int = 20, $offset: Int = 0) {
    reviews(
      where: { maid_id: { _eq: $userId } }
      limit: $limit
      offset: $offset
      order_by: { created_at: desc }
    ) {
      id
      rating
      comment
      created_at
      sponsor_id
      maid_id
    }
    reviews_aggregate(where: { maid_id: { _eq: $userId } }) {
      aggregate {
        count
        avg {
          rating
        }
      }
    }
  }
`;

// Get reviews given by a user (reviews they wrote)
const GET_REVIEWS_GIVEN = gql`
  query GetReviewsGiven($userId: String!, $limit: Int = 20, $offset: Int = 0) {
    reviews(
      where: { sponsor_id: { _eq: $userId } }
      limit: $limit
      offset: $offset
      order_by: { created_at: desc }
    ) {
      id
      rating
      comment
      created_at
      sponsor_id
      maid_id
      maid_profile {
        id
        full_name
        profile_photo_url
      }
    }
    reviews_aggregate(where: { sponsor_id: { _eq: $userId } }) {
      aggregate {
        count
      }
    }
  }
`;

// Get reviews for a specific maid
const GET_MAID_REVIEWS = gql`
  query GetMaidReviews($maidId: String!, $limit: Int = 20, $offset: Int = 0) {
    reviews(
      where: { maid_id: { _eq: $maidId } }
      limit: $limit
      offset: $offset
      order_by: { created_at: desc }
    ) {
      id
      rating
      comment
      created_at
      sponsor_id
    }
    reviews_aggregate(where: { maid_id: { _eq: $maidId } }) {
      aggregate {
        count
        avg {
          rating
        }
      }
    }
  }
`;

// Create a new review
const CREATE_REVIEW = gql`
  mutation CreateReview(
    $sponsorId: String!
    $maidId: String!
    $rating: Int!
    $comment: String
  ) {
    insert_reviews_one(
      object: {
        sponsor_id: $sponsorId
        maid_id: $maidId
        rating: $rating
        comment: $comment
      }
    ) {
      id
      rating
      comment
      created_at
      sponsor_id
      maid_id
    }
  }
`;

// Update a review
const UPDATE_REVIEW = gql`
  mutation UpdateReview($reviewId: uuid!, $rating: Int, $comment: String) {
    update_reviews_by_pk(
      pk_columns: { id: $reviewId }
      _set: { rating: $rating, comment: $comment }
    ) {
      id
      rating
      comment
      created_at
    }
  }
`;

// Delete a review
const DELETE_REVIEW = gql`
  mutation DeleteReview($reviewId: uuid!) {
    delete_reviews_by_pk(id: $reviewId) {
      id
    }
  }
`;

// Check if user can review a maid (no existing review)
const CHECK_CAN_REVIEW = gql`
  query CheckCanReview($sponsorId: String!, $maidId: String!) {
    reviews(
      where: { sponsor_id: { _eq: $sponsorId }, maid_id: { _eq: $maidId } }
      limit: 1
    ) {
      id
    }
  }
`;

// Types
export interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  sponsor_id: string;
  maid_id: string;
  maid_profile?: {
    id: string;
    full_name: string;
    profile_photo_url?: string;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
}

export interface CreateReviewInput {
  maidId: string;
  rating: number;
  comment?: string;
}

/**
 * Hook for managing reviews given by a sponsor
 */
export function useReviewsGiven() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);

  // Fetch profile ID
  const { loading: profileLoading } = useQuery(GET_PROFILE_BY_EMAIL, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  const userId = profileId;

  // Get reviews given
  const {
    data,
    loading: reviewsLoading,
    error,
    refetch,
    fetchMore,
  } = useQuery(GET_REVIEWS_GIVEN, {
    variables: { userId, limit: 20, offset: 0 },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  const reviews: Review[] = data?.reviews || [];
  const totalCount = data?.reviews_aggregate?.aggregate?.count || 0;
  const loading = profileLoading || reviewsLoading;

  // Load more reviews
  const loadMore = useCallback(async () => {
    if (!userId || reviews.length >= totalCount) return;

    await fetchMore({
      variables: {
        userId,
        limit: 20,
        offset: reviews.length,
      },
    });
  }, [userId, reviews.length, totalCount, fetchMore]);

  return {
    reviews,
    totalCount,
    loading,
    error,
    refetch,
    loadMore,
    hasMore: reviews.length < totalCount,
    profileId: userId,
  };
}

/**
 * Hook for managing reviews received by a maid
 */
export function useReviewsReceived() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);

  // Fetch profile ID
  const { loading: profileLoading } = useQuery(GET_PROFILE_BY_EMAIL, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  const userId = profileId;

  // Get reviews received
  const {
    data,
    loading: reviewsLoading,
    error,
    refetch,
  } = useQuery(GET_REVIEWS_RECEIVED, {
    variables: { userId, limit: 20, offset: 0 },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  const reviews: Review[] = data?.reviews || [];
  const totalCount = data?.reviews_aggregate?.aggregate?.count || 0;
  const averageRating = data?.reviews_aggregate?.aggregate?.avg?.rating || 0;
  const loading = profileLoading || reviewsLoading;

  return {
    reviews,
    totalCount,
    averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : 0,
    loading,
    error,
    refetch,
    profileId: userId,
  };
}

/**
 * Hook for viewing reviews of a specific maid
 */
export function useMaidReviews(maidId: string | null) {
  const {
    data,
    loading,
    error,
    refetch,
  } = useQuery(GET_MAID_REVIEWS, {
    variables: { maidId, limit: 20, offset: 0 },
    skip: !maidId,
    fetchPolicy: 'cache-and-network',
  });

  const reviews: Review[] = data?.reviews || [];
  const totalCount = data?.reviews_aggregate?.aggregate?.count || 0;
  const averageRating = data?.reviews_aggregate?.aggregate?.avg?.rating || 0;

  return {
    reviews,
    totalCount,
    averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : 0,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for creating, updating, and deleting reviews
 */
export function useReviewMutations() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);

  // Fetch profile ID
  useQuery(GET_PROFILE_BY_EMAIL, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  const [createReviewMutation, { loading: creating }] = useMutation(CREATE_REVIEW);
  const [updateReviewMutation, { loading: updating }] = useMutation(UPDATE_REVIEW);
  const [deleteReviewMutation, { loading: deleting }] = useMutation(DELETE_REVIEW);

  // Create a new review
  const createReview = useCallback(async (input: CreateReviewInput) => {
    if (!profileId) {
      throw new Error('User not authenticated');
    }

    if (input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    try {
      const result = await createReviewMutation({
        variables: {
          sponsorId: profileId,
          maidId: input.maidId,
          rating: input.rating,
          comment: input.comment?.trim() || null,
        },
      });

      return result.data?.insert_reviews_one;
    } catch (error) {
      console.error('[Reviews] Error creating review:', error);
      throw error;
    }
  }, [profileId, createReviewMutation]);

  // Update a review
  const updateReview = useCallback(async (
    reviewId: string,
    updates: { rating?: number; comment?: string }
  ) => {
    if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    try {
      const result = await updateReviewMutation({
        variables: {
          reviewId,
          rating: updates.rating,
          comment: updates.comment?.trim(),
        },
      });

      return result.data?.update_reviews_by_pk;
    } catch (error) {
      console.error('[Reviews] Error updating review:', error);
      throw error;
    }
  }, [updateReviewMutation]);

  // Delete a review
  const deleteReview = useCallback(async (reviewId: string) => {
    try {
      await deleteReviewMutation({
        variables: { reviewId },
      });

      return true;
    } catch (error) {
      console.error('[Reviews] Error deleting review:', error);
      throw error;
    }
  }, [deleteReviewMutation]);

  return {
    createReview,
    updateReview,
    deleteReview,
    isProcessing: creating || updating || deleting,
    profileId,
  };
}

/**
 * Hook to check if user can review a maid
 */
export function useCanReview(maidId: string | null) {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);

  // Fetch profile ID
  const { loading: profileLoading } = useQuery(GET_PROFILE_BY_EMAIL, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  const { data, loading: checkLoading } = useQuery(CHECK_CAN_REVIEW, {
    variables: { sponsorId: profileId, maidId },
    skip: !profileId || !maidId,
    fetchPolicy: 'network-only',
  });

  const existingReviews = data?.reviews || [];
  const canReview = existingReviews.length === 0;

  return {
    canReview,
    hasExistingReview: existingReviews.length > 0,
    loading: profileLoading || checkLoading,
  };
}

/**
 * Helper function to format relative time
 */
export function formatReviewDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Helper function to render star rating
 */
export function getStarRating(rating: number): string {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
}
