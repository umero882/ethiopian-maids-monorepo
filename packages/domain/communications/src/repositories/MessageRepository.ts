/**
 * Message Repository Interface
 *
 * Defines the contract for persisting and retrieving messages.
 * Infrastructure layer will implement this interface using GraphQL, REST, etc.
 */

import { Message } from '../entities/Message.js';
import { ConversationSummary } from '../dtos/MessageDTOs.js';

export interface MessageSearchCriteria {
  userId?: string;
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
  isRead?: boolean;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export interface MessageRepository {
  /**
   * Find a message by its ID
   */
  findById(id: string): Promise<Message | null>;

  /**
   * Get all messages in a conversation between two users
   */
  getConversation(userId1: string, userId2: string, limit?: number, offset?: number): Promise<Message[]>;

  /**
   * Get conversation ID for two users (or create if doesn't exist)
   */
  getOrCreateConversationId(userId1: string, userId2: string): Promise<string>;

  /**
   * Get all conversations for a user with summary info
   */
  getUserConversations(userId: string, limit?: number, offset?: number): Promise<ConversationSummary[]>;

  /**
   * Get unread message count for a user
   */
  getUnreadCount(userId: string): Promise<number>;

  /**
   * Get unread messages for a user
   */
  getUnreadMessages(userId: string, limit?: number): Promise<Message[]>;

  /**
   * Search messages with filters
   */
  search(criteria: MessageSearchCriteria): Promise<Message[]>;

  /**
   * Save or update a message
   */
  save(message: Message): Promise<void>;

  /**
   * Delete a message
   */
  delete(id: string): Promise<void>;

  /**
   * Mark all messages in a conversation as read for a user
   */
  markConversationAsRead(conversationId: string, userId: string): Promise<void>;
}
