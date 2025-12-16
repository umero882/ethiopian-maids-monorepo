/**
 * Communication Service - GraphQL Implementation
 * Uses inline gql documents to bypass codegen requirement
 *
 * This service handles all conversations and messages operations via GraphQL/Hasura
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('CommunicationService.GraphQL');

// =====================================================
// INLINE GRAPHQL DOCUMENTS - CONVERSATIONS
// =====================================================

const GetConversationDocument = gql`
  query GetConversation($id: uuid!) {
    conversations_by_pk(id: $id) {
      id
      participant1_id
      participant1_type
      participant2_id
      participant2_type
      agency_id
      status
      last_message_at
      last_message_preview
      participant1_unread_count
      participant2_unread_count
      created_at
      updated_at
    }
  }
`;

const ListUserConversationsDocument = gql`
  query ListUserConversations(
    $userId: String!
    $limit: Int = 20
    $offset: Int = 0
    $status: String = "active"
  ) {
    conversations(
      where: {
        _and: [
          {
            _or: [
              {participant1_id: {_eq: $userId}}
              {participant2_id: {_eq: $userId}}
            ]
          }
          {status: {_eq: $status}}
        ]
      }
      limit: $limit
      offset: $offset
      order_by: [{last_message_at: desc_nulls_last}, {created_at: desc}]
    ) {
      id
      participant1_id
      participant1_type
      participant2_id
      participant2_type
      status
      last_message_at
      last_message_preview
      participant1_unread_count
      participant2_unread_count
      created_at
    }
    conversations_aggregate(
      where: {
        _and: [
          {
            _or: [
              {participant1_id: {_eq: $userId}}
              {participant2_id: {_eq: $userId}}
            ]
          }
          {status: {_eq: $status}}
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const FindConversationBetweenUsersDocument = gql`
  query FindConversationBetweenUsers($user1Id: String!, $user2Id: String!) {
    conversations(
      where: {
        _or: [
          {
            _and: [
              {participant1_id: {_eq: $user1Id}}
              {participant2_id: {_eq: $user2Id}}
            ]
          }
          {
            _and: [
              {participant1_id: {_eq: $user2Id}}
              {participant2_id: {_eq: $user1Id}}
            ]
          }
        ]
        status: {_neq: "deleted"}
      }
      limit: 1
    ) {
      id
      participant1_id
      participant1_type
      participant2_id
      participant2_type
      status
      last_message_at
      last_message_preview
      participant1_unread_count
      participant2_unread_count
      created_at
    }
  }
`;

const CreateConversationDocument = gql`
  mutation CreateConversation($data: conversations_insert_input!) {
    insert_conversations_one(object: $data) {
      id
      participant1_id
      participant1_type
      participant2_id
      participant2_type
      status
      created_at
    }
  }
`;

const UpdateConversationDocument = gql`
  mutation UpdateConversation($id: uuid!, $data: conversations_set_input!) {
    update_conversations_by_pk(
      pk_columns: {id: $id}
      _set: $data
    ) {
      id
      participant1_id
      participant2_id
      status
      last_message_at
      last_message_preview
      participant1_unread_count
      participant2_unread_count
      updated_at
    }
  }
`;

const ArchiveConversationDocument = gql`
  mutation ArchiveConversation($id: uuid!) {
    update_conversations_by_pk(
      pk_columns: {id: $id}
      _set: {status: "archived"}
    ) {
      id
      status
      updated_at
    }
  }
`;

// =====================================================
// INLINE GRAPHQL DOCUMENTS - MESSAGES
// =====================================================

const ListConversationMessagesDocument = gql`
  query ListConversationMessages(
    $conversationId: uuid!
    $limit: Int = 50
    $offset: Int = 0
  ) {
    messages(
      where: {conversation_id: {_eq: $conversationId}}
      limit: $limit
      offset: $offset
      order_by: [{created_at: asc}]
    ) {
      id
      conversation_id
      sender_id
      receiver_id
      content
      read
      created_at
    }
    messages_aggregate(where: {conversation_id: {_eq: $conversationId}}) {
      aggregate {
        count
      }
    }
  }
`;

const ListUserMessagesDocument = gql`
  query ListUserMessages(
    $userId: String!
    $limit: Int = 50
    $offset: Int = 0
  ) {
    messages(
      where: {
        _or: [
          {sender_id: {_eq: $userId}}
          {receiver_id: {_eq: $userId}}
        ]
      }
      limit: $limit
      offset: $offset
      order_by: [{created_at: desc}]
    ) {
      id
      sender_id
      receiver_id
      content
      read
      created_at
    }
    messages_aggregate(
      where: {
        _or: [
          {sender_id: {_eq: $userId}}
          {receiver_id: {_eq: $userId}}
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GetUnreadMessagesCountDocument = gql`
  query GetUnreadMessagesCount($userId: String!) {
    messages_aggregate(
      where: {
        receiver_id: {_eq: $userId}
        read: {_eq: false}
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const SendMessageDocument = gql`
  mutation SendMessage($data: messages_insert_input!) {
    insert_messages_one(object: $data) {
      id
      conversation_id
      sender_id
      receiver_id
      content
      read
      created_at
    }
  }
`;

const MarkMessageAsReadDocument = gql`
  mutation MarkMessageAsRead($id: uuid!) {
    update_messages_by_pk(
      pk_columns: {id: $id}
      _set: {read: true}
    ) {
      id
      read
      updated_at
    }
  }
`;

const MarkMultipleMessagesAsReadDocument = gql`
  mutation MarkMultipleMessagesAsRead($ids: [uuid!]!) {
    update_messages(
      where: {id: {_in: $ids}}
      _set: {read: true}
    ) {
      affected_rows
      returning {
        id
        read
      }
    }
  }
`;

const ArchiveMessageDocument = gql`
  mutation ArchiveMessage($id: uuid!) {
    update_messages_by_pk(
      pk_columns: {id: $id}
      _set: {is_archived: true}
    ) {
      id
      is_archived
      updated_at
    }
  }
`;

const DeleteMessageDocument = gql`
  mutation DeleteMessage($id: uuid!) {
    delete_messages_by_pk(id: $id) {
      id
    }
  }
`;

// =====================================================
// SERVICE IMPLEMENTATION
// =====================================================

export const graphqlCommunicationService = {
  // =====================================================
  // CONVERSATION METHODS
  // =====================================================

  /**
   * Get a conversation by ID
   */
  async getConversation(conversationId) {
    try {
      log.info('🔍 [GraphQL] Fetching conversation:', conversationId);

      const { data, errors } = await apolloClient.query({
        query: GetConversationDocument,
        variables: { id: conversationId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const conversation = data?.conversations_by_pk;

      if (!conversation) {
        return {
          data: null,
          error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' },
        };
      }

      log.info('✅ [GraphQL] Conversation fetched successfully');
      return { data: conversation, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching conversation:', error);
      return { data: null, error };
    }
  },

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId, options = {}) {
    try {
      log.info('📋 [GraphQL] Fetching conversations for user:', userId);

      const { data, errors } = await apolloClient.query({
        query: ListUserConversationsDocument,
        variables: {
          userId,
          limit: options.limit || 20,
          offset: options.offset || 0,
          status: options.status || 'active',
        },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const conversations = data?.conversations || [];
      const totalCount = data?.conversations_aggregate?.aggregate?.count || 0;

      log.info(`✅ [GraphQL] Fetched ${conversations.length} conversations (total: ${totalCount})`);
      return { data: conversations, count: totalCount, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching user conversations:', error);
      return { data: [], count: 0, error };
    }
  },

  /**
   * Find or create conversation between two users
   */
  async findOrCreateConversation(user1Id, user2Id, user1Type, user2Type) {
    try {
      log.info('🔍 [GraphQL] Finding conversation between users:', user1Id, user2Id);

      // First, try to find existing conversation
      const { data: findData, errors: findErrors } = await apolloClient.query({
        query: FindConversationBetweenUsersDocument,
        variables: { user1Id, user2Id },
        fetchPolicy: 'network-only',
      });

      if (findErrors && findErrors.length > 0) {
        throw new Error(findErrors[0].message);
      }

      const existing = findData?.conversations?.[0];

      if (existing) {
        log.info('✅ [GraphQL] Found existing conversation:', existing.id);
        return { data: existing, error: null };
      }

      // Create new conversation
      log.info('➕ [GraphQL] Creating new conversation');

      const { data: createData, errors: createErrors } = await apolloClient.mutate({
        mutation: CreateConversationDocument,
        variables: {
          data: {
            participant1_id: user1Id,
            participant1_type: user1Type || 'user',
            participant2_id: user2Id,
            participant2_type: user2Type || 'user',
            status: 'active',
          },
        },
      });

      if (createErrors && createErrors.length > 0) {
        throw new Error(createErrors[0].message);
      }

      const conversation = createData?.insert_conversations_one;
      log.info('✅ [GraphQL] Conversation created successfully:', conversation?.id);
      return { data: conversation, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error finding/creating conversation:', error);
      return { data: null, error };
    }
  },

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId) {
    try {
      log.info('📦 [GraphQL] Archiving conversation:', conversationId);

      const { data, errors } = await apolloClient.mutate({
        mutation: ArchiveConversationDocument,
        variables: { id: conversationId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const conversation = data?.update_conversations_by_pk;
      log.info('✅ [GraphQL] Conversation archived successfully');
      return { data: conversation, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error archiving conversation:', error);
      return { data: null, error };
    }
  },

  // =====================================================
  // MESSAGE METHODS
  // =====================================================

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(conversationId, options = {}) {
    try {
      log.info('💬 [GraphQL] VERSION: 2025-11-20-v2 - Fetching messages for conversation:', conversationId);

      const result = await apolloClient.query({
        query: ListConversationMessagesDocument,
        variables: {
          conversationId,
          limit: options.limit || 50,
          offset: options.offset || 0,
        },
        fetchPolicy: 'network-only',
      });

      log.info('🔍 [DEBUG] Full result object:', JSON.stringify(result));
      log.info('🔍 [DEBUG] result.data:', JSON.stringify(result.data));
      log.info('🔍 [DEBUG] result.errors:', JSON.stringify(result.errors));

      const { data, errors } = result;

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const messages = data?.messages || [];
      const totalCount = data?.messages_aggregate?.aggregate?.count || 0;

      log.info(`✅ [GraphQL] Fetched ${messages.length} messages (total: ${totalCount})`);
      return { data: messages, count: totalCount, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching conversation messages:', error);
      return { data: [], count: 0, error };
    }
  },

  /**
   * Get all messages for a user (direct messages without conversation)
   */
  async getUserMessages(userId, options = {}) {
    try {
      log.info('📬 [GraphQL] Fetching messages for user:', userId);

      const { data, errors } = await apolloClient.query({
        query: ListUserMessagesDocument,
        variables: {
          userId,
          limit: options.limit || 50,
          offset: options.offset || 0,
          isArchived: options.isArchived || false,
        },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const messages = data?.messages || [];
      const totalCount = data?.messages_aggregate?.aggregate?.count || 0;

      log.info(`✅ [GraphQL] Fetched ${messages.length} user messages (total: ${totalCount})`);
      return { data: messages, count: totalCount, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching user messages:', error);
      return { data: [], count: 0, error };
    }
  },

  /**
   * Get unread messages count for a user
   */
  async getUnreadCount(userId) {
    try {
      log.info('🔢 [GraphQL] Getting unread count for user:', userId);

      const { data, errors } = await apolloClient.query({
        query: GetUnreadMessagesCountDocument,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const count = data?.messages_aggregate?.aggregate?.count || 0;

      log.info(`✅ [GraphQL] Unread count: ${count}`);
      return { data: count, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error getting unread count:', error);
      return { data: 0, error };
    }
  },

  /**
   * Send a message
   */
  async sendMessage(senderId, recipientId, messageData) {
    try {
      log.info('➕ [GraphQL] Sending message from:', senderId, 'to:', recipientId);

      const { data, errors } = await apolloClient.mutate({
        mutation: SendMessageDocument,
        variables: {
          data: {
            sender_id: senderId,
            receiver_id: recipientId,
            conversation_id: messageData.conversationId || messageData.conversation_id,
            content: messageData.content || messageData.message || '',
            read: false,
          },
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const message = data?.insert_messages_one;
      log.info('✅ [GraphQL] Message sent successfully:', message?.id);
      return { data: message, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error sending message:', error);
      return { data: null, error };
    }
  },

  /**
   * Mark a message as read
   */
  async markAsRead(messageId) {
    try {
      log.info('✓ [GraphQL] Marking message as read:', messageId);

      const { data, errors } = await apolloClient.mutate({
        mutation: MarkMessageAsReadDocument,
        variables: { id: messageId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const message = data?.update_messages_by_pk;
      log.info('✅ [GraphQL] Message marked as read');
      return { data: message, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error marking message as read:', error);
      return { data: null, error };
    }
  },

  /**
   * Mark multiple messages as read
   */
  async markMultipleAsRead(messageIds) {
    try {
      log.info('✓ [GraphQL] Marking multiple messages as read:', messageIds.length);

      const { data, errors } = await apolloClient.mutate({
        mutation: MarkMultipleMessagesAsReadDocument,
        variables: { ids: messageIds },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const affectedRows = data?.update_messages?.affected_rows || 0;
      log.info(`✅ [GraphQL] Marked ${affectedRows} messages as read`);
      return { data: affectedRows, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error marking multiple messages as read:', error);
      return { data: 0, error };
    }
  },

  /**
   * Archive a message
   */
  async archiveMessage(messageId) {
    try {
      log.info('📦 [GraphQL] Archiving message:', messageId);

      const { data, errors } = await apolloClient.mutate({
        mutation: ArchiveMessageDocument,
        variables: { id: messageId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const message = data?.update_messages_by_pk;
      log.info('✅ [GraphQL] Message archived successfully');
      return { data: message, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error archiving message:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId) {
    try {
      log.info('🗑️ [GraphQL] Deleting message:', messageId);

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteMessageDocument,
        variables: { id: messageId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const message = data?.delete_messages_by_pk;
      log.info('✅ [GraphQL] Message deleted successfully');
      return { data: message, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error deleting message:', error);
      return { data: null, error };
    }
  },
};

export default graphqlCommunicationService;
