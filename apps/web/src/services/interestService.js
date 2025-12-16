/**
 * Interest Service
 * Handles interest requests for conversation starter feature
 *
 * Uses:
 * - Apollo Client/GraphQL for data operations (via Hasura)
 * - Firebase Auth for user authentication
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { auth } from '@/lib/firebaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('InterestService');

// GraphQL Queries
const GET_BROWSABLE_USERS = gql`
  query GetBrowsableUsers($userType: String!, $limit: Int = 20, $offset: Int = 0) {
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

const GET_MAID_DETAILS = gql`
  query GetMaidDetails($userId: String!) {
    maid_profiles(where: { user_id: { _eq: $userId } }, limit: 1) {
      id
      user_id
      full_name
      profile_photo_url
      nationality
      experience_years
      skills
      availability_status
      verification_status
    }
  }
`;

const GET_SPONSOR_DETAILS = gql`
  query GetSponsorDetails($userId: String!) {
    sponsor_profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      full_name
      avatar_url
      country
      city
      verification_status
    }
  }
`;

const GET_AGENCY_DETAILS = gql`
  query GetAgencyDetails($userId: String!) {
    agency_profiles(where: { id: { _eq: $userId } }, limit: 1) {
      id
      agency_name
      logo_url
      country
      city
      verified
      total_maids
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

const CHECK_EXISTING_INTEREST = gql`
  query CheckExistingInterest($senderId: String!, $recipientId: String!) {
    interest_requests(
      where: {
        _or: [
          { sender_id: { _eq: $senderId }, recipient_id: { _eq: $recipientId } }
          { sender_id: { _eq: $recipientId }, recipient_id: { _eq: $senderId } }
        ]
      }
      limit: 1
    ) {
      id
      status
      sender_id
    }
  }
`;

const CHECK_EXISTING_CONVERSATION = gql`
  query CheckExistingConversation($userId1: String!, $userId2: String!) {
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

// GraphQL Subscription for online status
const ONLINE_STATUS_SUBSCRIPTION = gql`
  subscription OnlineStatusUpdates($userType: String!) {
    profiles(
      where: { user_type: { _eq: $userType }, is_active: { _eq: true } }
      order_by: [{ is_online: desc }, { last_activity_at: desc_nulls_last }]
      limit: 50
    ) {
      id
      name
      is_online
      last_activity_at
    }
  }
`;

/**
 * Interest Service
 */
class InterestService {
  getCurrentUser() {
    return auth?.currentUser || null;
  }

  /**
   * Get browsable users by type
   */
  async getBrowsableUsers(userType, limit = 20, offset = 0) {
    try {
      const { data, error } = await apolloClient.query({
        query: GET_BROWSABLE_USERS,
        variables: { userType, limit, offset },
        fetchPolicy: 'network-only',
      });

      if (error) {
        throw error;
      }

      return {
        users: data?.profiles || [],
        total: data?.profiles_aggregate?.aggregate?.count || 0,
      };
    } catch (error) {
      log.error('Error fetching browsable users:', error);
      throw error;
    }
  }

  /**
   * Get detailed profile based on user type
   */
  async getUserDetails(userId, userType) {
    try {
      let query;
      switch (userType) {
        case 'maid':
          query = GET_MAID_DETAILS;
          break;
        case 'sponsor':
          query = GET_SPONSOR_DETAILS;
          break;
        case 'agency':
          query = GET_AGENCY_DETAILS;
          break;
        default:
          return null;
      }

      const { data, error } = await apolloClient.query({
        query,
        variables: { userId },
        fetchPolicy: 'cache-first',
      });

      if (error) {
        throw error;
      }

      // Return the first result from the appropriate key
      const key = `${userType}_profiles`;
      return data?.[key]?.[0] || null;
    } catch (error) {
      log.error('Error fetching user details:', error);
      return null;
    }
  }

  /**
   * Get user's sent and received interests
   */
  async getMyInterests(userId) {
    try {
      const { data, error } = await apolloClient.query({
        query: GET_MY_INTERESTS,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (error) {
        throw error;
      }

      return {
        sent: data?.sent || [],
        received: data?.received || [],
      };
    } catch (error) {
      log.error('Error fetching interests:', error);
      throw error;
    }
  }

  /**
   * Send an interest request
   */
  async sendInterest(recipientId, recipientType, message = null) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // First check if interest already exists
      const existingConnection = await this.checkExistingConnection(recipientId);
      if (existingConnection) {
        if (existingConnection.type === 'interest') {
          // Interest already exists
          if (existingConnection.isSender) {
            throw new Error('You have already sent an interest to this user');
          } else {
            throw new Error('This user has already sent you an interest');
          }
        } else if (existingConnection.type === 'conversation') {
          throw new Error('You already have a conversation with this user');
        }
      }

      // Get sender's user type from profile
      const { data: profileData } = await apolloClient.query({
        query: gql`
          query GetMyProfile($id: String!) {
            profiles(where: { id: { _eq: $id } }, limit: 1) {
              id
              user_type
            }
          }
        `,
        variables: { id: user.uid },
        fetchPolicy: 'network-only',
      });

      const senderType = profileData?.profiles?.[0]?.user_type;
      if (!senderType) {
        throw new Error('Could not determine sender type');
      }

      const { data, errors } = await apolloClient.mutate({
        mutation: SEND_INTEREST,
        variables: {
          senderId: user.uid,
          senderType,
          recipientId,
          recipientType,
          message,
        },
      });

      if (errors) {
        const errorMessage = errors[0]?.message || 'Failed to send interest';
        // Handle duplicate key error gracefully
        if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
          throw new Error('Interest already exists with this user');
        }
        throw new Error(errorMessage);
      }

      log.info('Interest sent successfully:', data?.insert_interest_requests_one);
      return data?.insert_interest_requests_one;
    } catch (error) {
      log.error('Error sending interest:', error);
      throw error;
    }
  }

  /**
   * Accept or reject an interest request
   */
  async respondToInterest(interestId, accept = true) {
    try {
      const status = accept ? 'accepted' : 'rejected';

      const { data, errors } = await apolloClient.mutate({
        mutation: RESPOND_TO_INTEREST,
        variables: { id: interestId, status },
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to respond to interest');
      }

      log.info(`Interest ${status}:`, data?.update_interest_requests_by_pk);
      return data?.update_interest_requests_by_pk;
    } catch (error) {
      log.error('Error responding to interest:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending interest request
   */
  async cancelInterest(interestId) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: CANCEL_INTEREST,
        variables: { id: interestId },
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to cancel interest');
      }

      return data?.update_interest_requests_by_pk;
    } catch (error) {
      log.error('Error cancelling interest:', error);
      throw error;
    }
  }

  /**
   * Check if interest or conversation already exists
   */
  async checkExistingConnection(recipientId) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Check for existing interest
      const { data: interestData } = await apolloClient.query({
        query: CHECK_EXISTING_INTEREST,
        variables: { senderId: user.uid, recipientId },
        fetchPolicy: 'network-only',
      });

      if (interestData?.interest_requests?.length > 0) {
        const interest = interestData.interest_requests[0];
        return {
          type: 'interest',
          status: interest.status,
          isSender: interest.sender_id === user.uid,
          id: interest.id,
        };
      }

      // Check for existing conversation
      const { data: conversationData } = await apolloClient.query({
        query: CHECK_EXISTING_CONVERSATION,
        variables: { userId1: user.uid, userId2: recipientId },
        fetchPolicy: 'network-only',
      });

      if (conversationData?.conversations?.length > 0) {
        return {
          type: 'conversation',
          id: conversationData.conversations[0].id,
        };
      }

      return null;
    } catch (error) {
      log.error('Error checking existing connection:', error);
      return null;
    }
  }

  /**
   * Create a direct conversation (for paid users)
   */
  async createConversation(recipientId, recipientType) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get sender's user type
      const { data: profileData } = await apolloClient.query({
        query: gql`
          query GetMyProfile($id: String!) {
            profiles(where: { id: { _eq: $id } }, limit: 1) {
              id
              user_type
            }
          }
        `,
        variables: { id: user.uid },
        fetchPolicy: 'network-only',
      });

      const senderType = profileData?.profiles?.[0]?.user_type;

      const { data, errors } = await apolloClient.mutate({
        mutation: CREATE_CONVERSATION,
        variables: {
          participant1Id: user.uid,
          participant1Type: senderType,
          participant2Id: recipientId,
          participant2Type: recipientType,
        },
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create conversation');
      }

      return data?.insert_conversations_one;
    } catch (error) {
      log.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Get online status subscription query for Apollo
   */
  getOnlineStatusSubscription() {
    return ONLINE_STATUS_SUBSCRIPTION;
  }
}

export default new InterestService();
