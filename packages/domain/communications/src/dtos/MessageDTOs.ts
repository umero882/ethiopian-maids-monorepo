/**
 * Message DTOs (Data Transfer Objects)
 *
 * These objects define the shape of data going in and out of message use cases.
 */

export interface SendMessageDTO {
  senderId: string;
  recipientId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, any>;
}

export interface GetConversationDTO {
  userId1: string;
  userId2: string;
  limit?: number;
  offset?: number;
}

export interface GetUserConversationsDTO {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface MarkMessageAsReadDTO {
  messageId: string;
  userId: string;
}

export interface MarkConversationAsReadDTO {
  conversationId: string;
  userId: string;
}

export interface DeleteMessageDTO {
  messageId: string;
  userId: string;
}

export interface SearchMessagesDTO {
  userId: string;
  searchTerm?: string;
  conversationId?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export interface ConversationSummary {
  conversationId: string;
  otherUserId: string;
  otherUserName?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}
