/**
 * useInterests Hook
 *
 * Handles interest requests for conversation starter feature.
 * Synced with web interestService.js
 */

import { useCallback, useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import { apolloClient } from '@ethio/api-client';
import { useAuth } from './useAuth';

// GraphQL Queries
const GET_BROWSABLE_USERS = gql`
  query GetBrowsableUsers($userType: String!, $limit: Int = 30, $offset: Int = 0) {
    profiles(
      where: {
        user_type: { _eq: $userType }
        is_active: { _eq: true }
      }
      order_by: [{ is_online: desc }, { last_activity_at: desc_nulls_last }]
      limit: $limit
      offset: $offset
    ) {
      id
      full_name
      email
      user_type
      avatar_url
      country
      is_online
      last_activity_at
    }
    profiles_aggregate(
      where: {
        user_type: { _eq: $userType }
        is_active: { _eq: true }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GET_MY_INTERESTS = gql`
  query GetMyInterests($userId: String!) {
    sent: interest_requests(
      where: { sender_id: { _eq: $userId } }
      order_by: { created_at: desc }
    ) {
      id
      sender_id
      sender_type
      recipient_id
      recipient_type
      status
      message
      created_at
      responded_at
      expires_at
    }
    received: interest_requests(
      where: { recipient_id: { _eq: $userId } }
      order_by: { created_at: desc }
    ) {
      id
      sender_id
      sender_type
      recipient_id
      recipient_type
      status
      message
      created_at
      expires_at
    }
  }
`;

// Query for pending sent interests (for messages screen)
const GET_PENDING_SENT_INTERESTS = gql`
  query GetPendingSentInterests($userId: String!) {
    interest_requests(
      where: {
        sender_id: { _eq: $userId }
        status: { _eq: "pending" }
      }
      order_by: { created_at: desc }
    ) {
      id
      sender_id
      sender_type
      recipient_id
      recipient_type
      status
      message
      created_at
      expires_at
    }
  }
`;

// Query for pending received interests (for messages screen - sponsor/agency view)
const GET_PENDING_RECEIVED_INTERESTS = gql`
  query GetPendingReceivedInterests($userId: String!) {
    interest_requests(
      where: {
        recipient_id: { _eq: $userId }
        status: { _eq: "pending" }
      }
      order_by: { created_at: desc }
    ) {
      id
      sender_id
      sender_type
      recipient_id
      recipient_type
      status
      message
      created_at
      expires_at
    }
  }
`;

// Query to get profiles by IDs
// Also fetches full_name from user-type specific tables
// Note: maid_profiles uses user_id as key, so we alias it as id for Apollo caching
const GET_PROFILES_BY_IDS = gql`
  query GetProfilesByIds($ids: [String!]!) {
    profiles(where: { id: { _in: $ids } }) {
      id
      full_name
      email
      avatar_url
      user_type
      is_online
      last_activity_at
      country
    }
    sponsor_profiles(where: { id: { _in: $ids } }) {
      id
      full_name
    }
    maid_profiles(where: { user_id: { _in: $ids } }) {
      id: user_id
      user_id
      full_name
      first_name
      last_name
      profile_photo_url
    }
    agency_profiles(where: { id: { _in: $ids } }) {
      id
      full_name
      logo_url
    }
  }
`;

const CHECK_EXISTING_CONNECTION = gql`
  query CheckExistingConnection($userId1: String!, $userId2: String!) {
    interest_requests(
      where: {
        _or: [
          { sender_id: { _eq: $userId1 }, recipient_id: { _eq: $userId2 } }
          { sender_id: { _eq: $userId2 }, recipient_id: { _eq: $userId1 } }
        ]
      }
      limit: 1
    ) {
      id
      status
      sender_id
    }
    conversations(
      where: {
        _or: [
          { participant1_id: { _eq: $userId1 }, participant2_id: { _eq: $userId2 } }
          { participant1_id: { _eq: $userId2 }, participant2_id: { _eq: $userId1 } }
        ]
        status: { _eq: "active" }
      }
      limit: 1
    ) {
      id
    }
  }
`;

const GET_MY_PROFILE = gql`
  query GetMyProfile($id: String!) {
    profiles(where: { id: { _eq: $id } }, limit: 1) {
      user_type
    }
  }
`;

// Mutations
const SEND_INTEREST = gql`
  mutation SendInterest(
    $senderId: String!
    $senderType: String!
    $recipientId: String!
    $recipientType: String!
    $message: String
  ) {
    insert_interest_requests_one(
      object: {
        sender_id: $senderId
        sender_type: $senderType
        recipient_id: $recipientId
        recipient_type: $recipientType
        message: $message
      }
    ) {
      id
      status
      created_at
    }
  }
`;

const RESPOND_TO_INTEREST = gql`
  mutation RespondToInterest($id: uuid!, $status: String!) {
    update_interest_requests_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, responded_at: "now()" }
    ) {
      id
      status
      sender_id
      sender_type
      recipient_id
      recipient_type
      responded_at
    }
  }
`;

const CANCEL_INTEREST = gql`
  mutation CancelInterest($id: uuid!) {
    update_interest_requests_by_pk(
      pk_columns: { id: $id }
      _set: { status: "cancelled" }
    ) {
      id
      status
    }
  }
`;

// Query to find existing conversation between two users (in either direction)
const FIND_EXISTING_CONVERSATION = gql`
  query FindExistingConversation($user1: String!, $user2: String!) {
    conversations(
      where: {
        _or: [
          { _and: [{ participant1_id: { _eq: $user1 } }, { participant2_id: { _eq: $user2 } }] }
          { _and: [{ participant1_id: { _eq: $user2 } }, { participant2_id: { _eq: $user1 } }] }
        ]
      }
      limit: 1
    ) {
      id
      participant1_id
      participant2_id
      status
    }
  }
`;

const CREATE_CONVERSATION = gql`
  mutation CreateConversation(
    $participant1Id: String!
    $participant1Type: String!
    $participant2Id: String!
    $participant2Type: String!
  ) {
    insert_conversations_one(
      object: {
        participant1_id: $participant1Id
        participant1_type: $participant1Type
        participant2_id: $participant2Id
        participant2_type: $participant2Type
        status: "active"
      }
      on_conflict: {
        constraint: unique_conversation
        update_columns: [status]
      }
    ) {
      id
      participant1_id
      participant2_id
    }
  }
`;

// Subscription for real-time online status
const ONLINE_STATUS_SUBSCRIPTION = gql`
  subscription OnlineStatusUpdates($userType: String!) {
    profiles(
      where: { user_type: { _eq: $userType }, is_active: { _eq: true } }
      order_by: [{ is_online: desc }, { last_activity_at: desc_nulls_last }]
      limit: 50
    ) {
      id
      is_online
      last_activity_at
    }
  }
`;

export interface BrowsableUser {
  id: string;
  full_name: string | null;
  email: string | null;
  user_type: string;
  avatar_url: string | null;
  country: string | null;
  is_online: boolean;
  last_activity_at: string | null;
  name: string; // Computed: full_name || email username || truncated id
}

export interface InterestRequest {
  id: string;
  sender_id: string;
  sender_type: string;
  recipient_id: string;
  recipient_type: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  message: string | null;
  created_at: string;
  responded_at: string | null;
  expires_at: string | null;
}

export interface ExistingConnection {
  type: 'interest' | 'conversation';
  id: string;
  status?: string;
  isSender?: boolean;
}

export interface RecipientProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  user_type: string;
  is_online: boolean;
  last_activity_at: string | null;
  country: string | null;
}

export interface PendingInterestWithProfile extends InterestRequest {
  recipient_profile: RecipientProfile | null;
}

export interface ReceivedInterestWithProfile extends InterestRequest {
  sender_profile: RecipientProfile | null; // Reusing RecipientProfile as structure is same
}

/**
 * Hook to browse users by type
 */
export function useBrowsableUsers(userType: string, limit = 30) {
  const {
    data,
    loading,
    error,
    refetch,
  } = useQuery(GET_BROWSABLE_USERS, {
    variables: { userType, limit },
    skip: !userType,
    fetchPolicy: 'cache-and-network',
  });

  // Real-time subscription for online status updates
  useSubscription(ONLINE_STATUS_SUBSCRIPTION, {
    variables: { userType },
    skip: !userType,
    onData: () => {
      refetch();
    },
  });

  // Transform profiles to include computed 'name' property with fallback logic
  // Priority: full_name > email username > truncated id (matching web implementation)
  const users: BrowsableUser[] = (data?.profiles || []).map((profile: any) => ({
    ...profile,
    name: profile.full_name || profile.email?.split('@')[0] || profile.id?.substring(0, 8) + '...',
  }));
  const total = data?.profiles_aggregate?.aggregate?.count || 0;

  return {
    users,
    total,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to get user's interests (sent and received)
 */
export function useMyInterests() {
  const { user } = useAuth();
  // Use profile_id (database ID) instead of uid (Firebase ID) for legacy users
  const userId = user?.uid || (user as any)?.profile_id;

  const {
    data,
    loading,
    error,
    refetch,
  } = useQuery(GET_MY_INTERESTS, {
    variables: { userId: userId || '' },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  const sent: InterestRequest[] = data?.sent || [];
  const received: InterestRequest[] = data?.received || [];

  return {
    sent,
    received,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to send interest requests
 */
export function useSendInterest() {
  const { user, userType } = useAuth();
  const [sendInterestMutation] = useMutation(SEND_INTEREST);
  const [loading, setLoading] = useState(false);

  // Use profile_id (database ID) for queries and mutations
  const profileId = user?.uid || (user as any)?.profile_id;

  // Use userType from auth context (already loaded during sign-in)
  // Fallback to query if not available
  const { data: profileData } = useQuery(GET_MY_PROFILE, {
    variables: { id: profileId || '' },
    skip: !profileId || !!userType, // Skip if we already have userType from auth
  });

  const senderType = userType || profileData?.profiles?.[0]?.user_type;

  const sendInterest = useCallback(async (
    recipientId: string,
    recipientType: string,
    message: string | null = null
  ) => {
    if (!profileId) {
      console.error('[useSendInterest] Missing profileId');
      throw new Error('Not authenticated');
    }
    if (!senderType) {
      console.error('[useSendInterest] Missing senderType, profileId:', profileId);
      throw new Error('User type not available. Please try again.');
    }

    setLoading(true);
    try {
      const result = await sendInterestMutation({
        variables: {
          senderId: profileId,
          senderType,
          recipientId,
          recipientType,
          message,
        },
      });
      return result.data?.insert_interest_requests_one;
    } finally {
      setLoading(false);
    }
  }, [profileId, senderType, sendInterestMutation]);

  return {
    sendInterest,
    loading,
    senderType,
  };
}

/**
 * Hook to respond to interest requests
 */
export function useRespondToInterest() {
  const [respondMutation] = useMutation(RESPOND_TO_INTEREST);
  const [loading, setLoading] = useState(false);

  const acceptInterest = useCallback(async (interestId: string) => {
    setLoading(true);
    try {
      const result = await respondMutation({
        variables: { id: interestId, status: 'accepted' },
      });
      return result.data?.update_interest_requests_by_pk;
    } finally {
      setLoading(false);
    }
  }, [respondMutation]);

  const rejectInterest = useCallback(async (interestId: string) => {
    setLoading(true);
    try {
      const result = await respondMutation({
        variables: { id: interestId, status: 'rejected' },
      });
      return result.data?.update_interest_requests_by_pk;
    } finally {
      setLoading(false);
    }
  }, [respondMutation]);

  return {
    acceptInterest,
    rejectInterest,
    loading,
  };
}

/**
 * Hook to cancel interest requests
 */
export function useCancelInterest() {
  const [cancelMutation] = useMutation(CANCEL_INTEREST);
  const [loading, setLoading] = useState(false);

  const cancelInterest = useCallback(async (interestId: string) => {
    setLoading(true);
    try {
      const result = await cancelMutation({
        variables: { id: interestId },
      });
      return result.data?.update_interest_requests_by_pk;
    } finally {
      setLoading(false);
    }
  }, [cancelMutation]);

  return {
    cancelInterest,
    loading,
  };
}

/**
 * Hook to check existing connection with a user
 */
export function useCheckConnection(recipientId: string | null) {
  const { user } = useAuth();
  // Use profile_id (database ID) for queries
  const profileId = user?.uid || (user as any)?.profile_id;

  const { data, loading, refetch } = useQuery(CHECK_EXISTING_CONNECTION, {
    variables: {
      userId1: profileId || '',
      userId2: recipientId || '',
    },
    skip: !profileId || !recipientId,
    fetchPolicy: 'network-only',
  });

  const getConnection = useCallback((): ExistingConnection | null => {
    if (!data) return null;

    // Check for existing conversation
    if (data.conversations?.length > 0) {
      return {
        type: 'conversation',
        id: data.conversations[0].id,
      };
    }

    // Check for existing interest
    if (data.interest_requests?.length > 0) {
      const interest = data.interest_requests[0];
      return {
        type: 'interest',
        id: interest.id,
        status: interest.status,
        isSender: interest.sender_id === profileId,
      };
    }

    return null;
  }, [data, profileId]);

  return {
    connection: getConnection(),
    loading,
    refetch,
  };
}

/**
 * Hook to create a direct conversation
 * Checks for existing conversation first to prevent duplicates
 */
export function useCreateConversation() {
  const { user, userType } = useAuth();
  const [createMutation] = useMutation(CREATE_CONVERSATION);
  const [loading, setLoading] = useState(false);

  // Use profile_id (database ID) for mutations
  const profileId = user?.uid || (user as any)?.profile_id;

  // Use userType from auth context (already loaded during sign-in)
  // Fallback to query if not available
  const { data: profileData } = useQuery(GET_MY_PROFILE, {
    variables: { id: profileId || '' },
    skip: !profileId || !!userType, // Skip if we already have userType from auth
  });

  const senderType = userType || profileData?.profiles?.[0]?.user_type;

  const createConversation = useCallback(async (
    recipientId: string,
    recipientType: string
  ) => {
    if (!profileId) {
      console.error('[useCreateConversation] Missing profileId');
      throw new Error('Not authenticated');
    }
    if (!senderType) {
      console.error('[useCreateConversation] Missing senderType, profileId:', profileId);
      throw new Error('User type not available. Please try again.');
    }

    setLoading(true);
    try {
      // First, check if a conversation already exists between these two users
      const { data: existingData } = await apolloClient.query({
        query: FIND_EXISTING_CONVERSATION,
        variables: {
          user1: profileId,
          user2: recipientId,
        },
        fetchPolicy: 'network-only',
      });

      // If conversation exists, return it
      if (existingData?.conversations?.length > 0) {
        console.log('[useCreateConversation] Found existing conversation:', existingData.conversations[0].id);
        return existingData.conversations[0];
      }

      // No existing conversation, create a new one
      console.log('[useCreateConversation] Creating new conversation');
      const result = await createMutation({
        variables: {
          participant1Id: profileId,
          participant1Type: senderType,
          participant2Id: recipientId,
          participant2Type: recipientType,
        },
      });
      return result.data?.insert_conversations_one;
    } finally {
      setLoading(false);
    }
  }, [profileId, senderType, createMutation]);

  return {
    createConversation,
    loading,
  };
}

/**
 * Hook to get pending sent interests with recipient profile info
 * Used for displaying pending interests in messages screen
 */
export function usePendingSentInterests() {
  const { user } = useAuth();
  // Use profile_id (database ID) for queries
  const userId = user?.uid || (user as any)?.profile_id;

  const {
    data: interestsData,
    loading: interestsLoading,
    error: interestsError,
    refetch: refetchInterests,
  } = useQuery(GET_PENDING_SENT_INTERESTS, {
    variables: { userId: userId || '' },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  // Get recipient IDs from interests
  const recipientIds = (interestsData?.interest_requests || []).map(
    (interest: InterestRequest) => interest.recipient_id
  );

  // Fetch profiles for recipients
  const {
    data: profilesData,
    loading: profilesLoading,
    refetch: refetchProfiles,
  } = useQuery(GET_PROFILES_BY_IDS, {
    variables: { ids: recipientIds },
    skip: recipientIds.length === 0,
    fetchPolicy: 'cache-and-network',
  });

  // Create a map of profiles by ID, merging names from user-type specific tables
  const profilesMap = new Map<string, RecipientProfile>();
  (profilesData?.profiles || []).forEach((profile: RecipientProfile) => {
    profilesMap.set(profile.id, { ...profile });
  });

  // Merge sponsor full_names from sponsor_profiles table (uses String ID matching profiles.id)
  (profilesData?.sponsor_profiles || []).forEach((sponsor: { id: string; full_name?: string }) => {
    // Create base entry if doesn't exist
    if (!profilesMap.has(sponsor.id)) {
      profilesMap.set(sponsor.id, { id: sponsor.id, user_type: 'sponsor' } as RecipientProfile);
    }
    const profile = profilesMap.get(sponsor.id)!;
    if (sponsor.full_name) {
      profile.full_name = sponsor.full_name;
    }
  });

  // Merge maid names and photos - priority: full_name > first_name + last_name
  (profilesData?.maid_profiles || []).forEach((maid: { user_id: string; full_name?: string; first_name?: string; last_name?: string; profile_photo_url?: string }) => {
    // Create base entry if doesn't exist
    if (!profilesMap.has(maid.user_id)) {
      profilesMap.set(maid.user_id, { id: maid.user_id, user_type: 'maid' } as RecipientProfile);
    }
    const profile = profilesMap.get(maid.user_id)!;
    if (maid.full_name) {
      profile.full_name = maid.full_name;
    } else if (maid.first_name || maid.last_name) {
      const parts = [maid.first_name, maid.last_name].filter(Boolean);
      if (parts.length > 0) {
        profile.full_name = parts.join(' ');
      }
    }
    // Merge profile photo URL into avatar_url
    if (maid.profile_photo_url) {
      profile.avatar_url = maid.profile_photo_url;
    }
  });

  // Merge agency names and logo
  (profilesData?.agency_profiles || []).forEach((agency: { id: string; full_name?: string; logo_url?: string }) => {
    // Create base entry if doesn't exist
    if (!profilesMap.has(agency.id)) {
      profilesMap.set(agency.id, { id: agency.id, user_type: 'agency' } as RecipientProfile);
    }
    const profile = profilesMap.get(agency.id)!;
    if (agency.full_name) {
      profile.full_name = agency.full_name;
    }
    // Merge logo_url into avatar_url
    if (agency.logo_url) {
      profile.avatar_url = agency.logo_url;
    }
  });

  // Combine interests with profiles
  const pendingInterests: PendingInterestWithProfile[] = (
    interestsData?.interest_requests || []
  ).map((interest: InterestRequest) => ({
    ...interest,
    recipient_profile: profilesMap.get(interest.recipient_id) || null,
  }));

  const refetch = useCallback(async () => {
    await refetchInterests();
    if (recipientIds.length > 0) {
      await refetchProfiles();
    }
  }, [refetchInterests, refetchProfiles, recipientIds.length]);

  return {
    pendingInterests,
    loading: interestsLoading || profilesLoading,
    error: interestsError,
    refetch,
  };
}

/**
 * Hook to get pending received interests with sender profile info
 * Used for displaying received interests in messages screen (for sponsors/agencies)
 */
export function usePendingReceivedInterests() {
  const { user } = useAuth();
  // Use profile_id (database ID) for queries - critical for legacy users with UUID profile IDs
  const userId = user?.uid || (user as any)?.profile_id;

  const {
    data: interestsData,
    loading: interestsLoading,
    error: interestsError,
    refetch: refetchInterests,
  } = useQuery(GET_PENDING_RECEIVED_INTERESTS, {
    variables: { userId: userId || '' },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    onError: (error) => {
      console.error('Error fetching received interests:', error);
    },
  });

  // Debug logging
  useEffect(() => {
    console.log('=== Received Interests Debug ===');
    console.log('User ID:', userId);
    console.log('Interests Data:', interestsData);
    console.log('Error:', interestsError);
    console.log('Loading:', interestsLoading);
  }, [userId, interestsData, interestsError, interestsLoading]);

  // Get sender IDs from interests
  const senderIds = (interestsData?.interest_requests || []).map(
    (interest: InterestRequest) => interest.sender_id
  );

  // Fetch profiles for senders
  const {
    data: profilesData,
    loading: profilesLoading,
    refetch: refetchProfiles,
  } = useQuery(GET_PROFILES_BY_IDS, {
    variables: { ids: senderIds },
    skip: senderIds.length === 0,
    fetchPolicy: 'cache-and-network',
  });

  // Create a map of profiles by ID, merging names from user-type specific tables
  const profilesMap = new Map<string, RecipientProfile>();
  (profilesData?.profiles || []).forEach((profile: RecipientProfile) => {
    profilesMap.set(profile.id, { ...profile });
  });

  // Merge sponsor full_names from sponsor_profiles table (uses String ID matching profiles.id)
  (profilesData?.sponsor_profiles || []).forEach((sponsor: { id: string; full_name?: string }) => {
    // Create base entry if doesn't exist
    if (!profilesMap.has(sponsor.id)) {
      profilesMap.set(sponsor.id, { id: sponsor.id, user_type: 'sponsor' } as RecipientProfile);
    }
    const profile = profilesMap.get(sponsor.id)!;
    if (sponsor.full_name) {
      profile.full_name = sponsor.full_name;
    }
  });

  // Merge maid names and photos - priority: full_name > first_name + last_name
  (profilesData?.maid_profiles || []).forEach((maid: { user_id: string; full_name?: string; first_name?: string; last_name?: string; profile_photo_url?: string }) => {
    // Create base entry if doesn't exist
    if (!profilesMap.has(maid.user_id)) {
      profilesMap.set(maid.user_id, { id: maid.user_id, user_type: 'maid' } as RecipientProfile);
    }
    const profile = profilesMap.get(maid.user_id)!;
    if (maid.full_name) {
      profile.full_name = maid.full_name;
    } else if (maid.first_name || maid.last_name) {
      const parts = [maid.first_name, maid.last_name].filter(Boolean);
      if (parts.length > 0) {
        profile.full_name = parts.join(' ');
      }
    }
    // Merge profile photo URL into avatar_url
    if (maid.profile_photo_url) {
      profile.avatar_url = maid.profile_photo_url;
    }
  });

  // Merge agency names and logo
  (profilesData?.agency_profiles || []).forEach((agency: { id: string; full_name?: string; logo_url?: string }) => {
    // Create base entry if doesn't exist
    if (!profilesMap.has(agency.id)) {
      profilesMap.set(agency.id, { id: agency.id, user_type: 'agency' } as RecipientProfile);
    }
    const profile = profilesMap.get(agency.id)!;
    if (agency.full_name) {
      profile.full_name = agency.full_name;
    }
    // Merge logo_url into avatar_url
    if (agency.logo_url) {
      profile.avatar_url = agency.logo_url;
    }
  });

  // Combine interests with profiles
  const receivedInterests: ReceivedInterestWithProfile[] = (
    interestsData?.interest_requests || []
  ).map((interest: InterestRequest) => ({
    ...interest,
    sender_profile: profilesMap.get(interest.sender_id) || null,
  }));

  const refetch = useCallback(async () => {
    await refetchInterests();
    if (senderIds.length > 0) {
      await refetchProfiles();
    }
  }, [refetchInterests, refetchProfiles, senderIds.length]);

  return {
    receivedInterests,
    count: receivedInterests.length,
    loading: interestsLoading || profilesLoading,
    error: interestsError,
    refetch,
  };
}
