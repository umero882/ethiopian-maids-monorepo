/**
 * GraphQL Implementation of MessageRepository
 */

import { ApolloClient, gql } from '@apollo/client';
import {
  Message,
  MessageRepository,
  MessageSearchCriteria,
  ConversationSummary,
} from '@ethio/domain-communications';

export class GraphQLMessageRepository implements MessageRepository {
  constructor(private readonly client: ApolloClient<any>) {}

  async findById(id: string): Promise<Message | null> {
    const { data } = await this.client.query({
      query: gql`
        query GetMessage($id: uuid!) {
          messages_by_pk(id: $id) {
            id
            conversation_id
            sender_id
            recipient_id
            content
            message_type
            metadata
            is_read
            read_at
            created_at
            updated_at
          }
        }
      `,
      variables: { id },
    });

    return data?.messages_by_pk ? this.mapToEntity(data.messages_by_pk) : null;
  }

  async getConversation(
    userId1: string,
    userId2: string,
    limit?: number,
    offset?: number
  ): Promise<Message[]> {
    const { data } = await this.client.query({
      query: gql`
        query GetConversation($user1: uuid!, $user2: uuid!, $limit: Int!, $offset: Int!) {
          messages(
            where: {
              _or: [
                { sender_id: { _eq: $user1 }, recipient_id: { _eq: $user2 } }
                { sender_id: { _eq: $user2 }, recipient_id: { _eq: $user1 } }
              ]
            }
            order_by: { created_at: desc }
            limit: $limit
            offset: $offset
          ) {
            id
            conversation_id
            sender_id
            recipient_id
            content
            message_type
            metadata
            is_read
            read_at
            created_at
            updated_at
          }
        }
      `,
      variables: {
        user1: userId1,
        user2: userId2,
        limit: limit || 50,
        offset: offset || 0,
      },
    });

    return (data?.messages || []).map((msg: any) => this.mapToEntity(msg));
  }

  async getOrCreateConversationId(userId1: string, userId2: string): Promise<string> {
    // Generate deterministic conversation ID by sorting user IDs
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  }

  async getUserConversations(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<ConversationSummary[]> {
    // This is a complex query - we need to get all unique conversation partners
    // and their last messages with unread counts
    const { data } = await this.client.query({
      query: gql`
        query GetUserConversations($user_id: uuid!, $limit: Int!, $offset: Int!) {
          # Get messages where user is sender or recipient
          sent_messages: messages(
            where: { sender_id: { _eq: $user_id } }
            distinct_on: recipient_id
            order_by: { recipient_id: asc, created_at: desc }
            limit: $limit
            offset: $offset
          ) {
            conversation_id
            recipient_id
            content
            created_at
          }
          received_messages: messages(
            where: { recipient_id: { _eq: $user_id } }
            distinct_on: sender_id
            order_by: { sender_id: asc, created_at: desc }
            limit: $limit
            offset: $offset
          ) {
            conversation_id
            sender_id
            content
            created_at
          }
        }
      `,
      variables: {
        user_id: userId,
        limit: limit || 50,
        offset: offset || 0,
      },
    });

    // Combine and deduplicate conversations
    const conversations = new Map<string, ConversationSummary>();

    // Process sent messages
    for (const msg of data?.sent_messages || []) {
      const otherUserId = msg.recipient_id;
      const conversationId = msg.conversation_id;

      if (!conversations.has(conversationId)) {
        const unreadCount = await this.getConversationUnreadCount(conversationId, userId);
        conversations.set(conversationId, {
          conversationId,
          otherUserId,
          lastMessage: msg.content,
          lastMessageAt: new Date(msg.created_at),
          unreadCount,
        });
      }
    }

    // Process received messages
    for (const msg of data?.received_messages || []) {
      const otherUserId = msg.sender_id;
      const conversationId = msg.conversation_id;

      if (!conversations.has(conversationId)) {
        const unreadCount = await this.getConversationUnreadCount(conversationId, userId);
        conversations.set(conversationId, {
          conversationId,
          otherUserId,
          lastMessage: msg.content,
          lastMessageAt: new Date(msg.created_at),
          unreadCount,
        });
      }
    }

    return Array.from(conversations.values()).sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );
  }

  private async getConversationUnreadCount(conversationId: string, userId: string): Promise<number> {
    const { data } = await this.client.query({
      query: gql`
        query GetConversationUnreadCount($conversation_id: String!, $user_id: uuid!) {
          messages_aggregate(
            where: {
              conversation_id: { _eq: $conversation_id }
              recipient_id: { _eq: $user_id }
              is_read: { _eq: false }
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `,
      variables: { conversation_id: conversationId, user_id: userId },
    });

    return data?.messages_aggregate?.aggregate?.count || 0;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { data } = await this.client.query({
      query: gql`
        query GetUnreadMessageCount($user_id: uuid!) {
          messages_aggregate(
            where: {
              recipient_id: { _eq: $user_id }
              is_read: { _eq: false }
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `,
      variables: { user_id: userId },
    });

    return data?.messages_aggregate?.aggregate?.count || 0;
  }

  async getUnreadMessages(userId: string, limit?: number): Promise<Message[]> {
    const { data } = await this.client.query({
      query: gql`
        query GetUnreadMessages($user_id: uuid!, $limit: Int!) {
          messages(
            where: {
              recipient_id: { _eq: $user_id }
              is_read: { _eq: false }
            }
            order_by: { created_at: desc }
            limit: $limit
          ) {
            id
            conversation_id
            sender_id
            recipient_id
            content
            message_type
            metadata
            is_read
            read_at
            created_at
            updated_at
          }
        }
      `,
      variables: { user_id: userId, limit: limit || 50 },
    });

    return (data?.messages || []).map((msg: any) => this.mapToEntity(msg));
  }

  async search(criteria: MessageSearchCriteria): Promise<Message[]> {
    const where: any = {};

    if (criteria.userId) {
      where._or = [
        { sender_id: { _eq: criteria.userId } },
        { recipient_id: { _eq: criteria.userId } },
      ];
    }
    if (criteria.conversationId) {
      where.conversation_id = { _eq: criteria.conversationId };
    }
    if (criteria.isRead !== undefined) {
      where.is_read = { _eq: criteria.isRead };
    }
    if (criteria.searchTerm) {
      where.content = { _ilike: `%${criteria.searchTerm}%` };
    }

    const { data } = await this.client.query({
      query: gql`
        query SearchMessages($where: messages_bool_exp!, $limit: Int!, $offset: Int!) {
          messages(where: $where, limit: $limit, offset: $offset, order_by: { created_at: desc }) {
            id
            conversation_id
            sender_id
            recipient_id
            content
            message_type
            metadata
            is_read
            read_at
            created_at
            updated_at
          }
        }
      `,
      variables: {
        where,
        limit: criteria.limit || 50,
        offset: criteria.offset || 0,
      },
    });

    return (data?.messages || []).map((msg: any) => this.mapToEntity(msg));
  }

  async save(message: Message): Promise<void> {
    const input = {
      id: message.id,
      conversation_id: message.conversationId,
      sender_id: message.senderId,
      recipient_id: message.recipientId,
      content: message.content,
      message_type: message.messageType,
      metadata: message.metadata,
      is_read: message.isRead,
      read_at: message.readAt,
      updated_at: new Date(),
    };

    await this.client.mutate({
      mutation: gql`
        mutation UpsertMessage($input: messages_insert_input!) {
          insert_messages_one(
            object: $input
            on_conflict: { constraint: messages_pkey, update_columns: [
              conversation_id, sender_id, recipient_id, content, message_type,
              metadata, is_read, read_at, updated_at
            ]}
          ) {
            id
          }
        }
      `,
      variables: { input },
    });
  }

  async delete(id: string): Promise<void> {
    await this.client.mutate({
      mutation: gql`
        mutation DeleteMessage($id: uuid!) {
          delete_messages_by_pk(id: $id) {
            id
          }
        }
      `,
      variables: { id },
    });
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    await this.client.mutate({
      mutation: gql`
        mutation MarkConversationAsRead($conversation_id: String!, $user_id: uuid!) {
          update_messages(
            where: {
              conversation_id: { _eq: $conversation_id }
              recipient_id: { _eq: $user_id }
              is_read: { _eq: false }
            }
            _set: {
              is_read: true
              read_at: "now()"
            }
          ) {
            affected_rows
          }
        }
      `,
      variables: { conversation_id: conversationId, user_id: userId },
    });
  }

  private mapToEntity(data: any): Message {
    return new Message({
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      recipientId: data.recipient_id,
      content: data.content,
      messageType: data.message_type,
      metadata: data.metadata || {},
      isRead: data.is_read,
      readAt: data.read_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }
}
