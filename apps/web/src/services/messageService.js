/**
 * Message Service - GraphQL Implementation
 * Handles messaging operations using Hasura GraphQL API
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('MessageService');

// Send message mutation
const SEND_MESSAGE = gql`
  mutation SendMessage($data: messages_insert_input!) {
    insert_messages_one(object: $data) {
      id
      conversation_id
      sender_id
      recipient_id
      subject
      content
      message_type
      is_read
      created_at
    }
  }
`;

// Get or create conversation
const GET_OR_CREATE_CONVERSATION = gql`
  mutation GetOrCreateConversation($data: conversations_insert_input!) {
    insert_conversations_one(
      object: $data
      on_conflict: {
        constraint: conversations_participant1_id_participant2_id_key
        update_columns: [updated_at]
      }
    ) {
      id
      participant1_id
      participant2_id
      status
      created_at
    }
  }
`;

// Find existing conversation
const FIND_CONVERSATION = gql`
  query FindConversation($userId1: String!, $userId2: String!) {
    conversations(
      where: {
        _or: [
          { _and: [{ participant1_id: { _eq: $userId1 } }, { participant2_id: { _eq: $userId2 } }] }
          { _and: [{ participant1_id: { _eq: $userId2 } }, { participant2_id: { _eq: $userId1 } }] }
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

/**
 * Message Service
 */
export const messageService = {
  /**
   * Send a message to a recipient
   * @param {Object} params - Message parameters
   * @param {string} params.senderId - Sender user ID
   * @param {string} params.recipientId - Recipient user ID
   * @param {string} params.subject - Message subject
   * @param {string} params.content - Message content
   * @param {string} params.messageType - Type of message (inquiry, application, etc.)
   * @param {string} params.conversationId - Optional conversation ID
   * @returns {Promise<{data: Object|null, error: any}>}
   */
  async sendMessage({ senderId, recipientId, subject, content, messageType = 'inquiry', conversationId = null }) {
    try {
      log.debug('[GraphQL] Sending message:', { senderId, recipientId, messageType });

      // If no conversation ID, try to find or create one
      let convId = conversationId;
      if (!convId) {
        try {
          // First try to find existing conversation
          const { data: findData } = await apolloClient.query({
            query: FIND_CONVERSATION,
            variables: { userId1: senderId, userId2: recipientId },
            fetchPolicy: 'network-only',
          });

          if (findData?.conversations?.length > 0) {
            convId = findData.conversations[0].id;
          } else {
            // Create new conversation
            const { data: convData } = await apolloClient.mutate({
              mutation: GET_OR_CREATE_CONVERSATION,
              variables: {
                data: {
                  participant1_id: senderId,
                  participant1_type: 'sponsor',
                  participant2_id: recipientId,
                  participant2_type: 'maid',
                  status: 'active',
                },
              },
            });
            convId = convData?.insert_conversations_one?.id;
          }
        } catch (convErr) {
          log.warn('[GraphQL] Could not create/find conversation, sending without:', convErr);
        }
      }

      // Send the message
      const { data, errors } = await apolloClient.mutate({
        mutation: SEND_MESSAGE,
        variables: {
          data: {
            sender_id: senderId,
            recipient_id: recipientId,
            conversation_id: convId,
            subject,
            content,
            message_type: messageType,
            is_read: false,
          },
        },
      });

      if (errors) throw errors[0];

      log.info('[GraphQL] Message sent successfully:', data?.insert_messages_one?.id);
      return { data: data?.insert_messages_one, error: null };
    } catch (error) {
      log.error('[GraphQL] Error sending message:', error);
      return { data: null, error };
    }
  },

  /**
   * Get conversation between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<{data: Object|null, error: any}>}
   */
  async getConversation(userId1, userId2) {
    try {
      const { data, error } = await apolloClient.query({
        query: FIND_CONVERSATION,
        variables: { userId1, userId2 },
        fetchPolicy: 'network-only',
      });

      if (error) throw error;

      return { data: data?.conversations?.[0] || null, error: null };
    } catch (error) {
      log.error('[GraphQL] Error finding conversation:', error);
      return { data: null, error };
    }
  },
};

export default messageService;
