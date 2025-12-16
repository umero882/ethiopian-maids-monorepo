/**
 * Communication Service
 *
 * This module exports the GraphQL implementation of communication services.
 * Supabase fallback has been removed as part of the GraphQL migration.
 */

import { graphqlCommunicationService } from './communicationService.graphql';
import { createLogger } from '@/utils/logger';

const log = createLogger('CommunicationService');

/**
 * Communication Service - GraphQL implementation
 */
export const communicationService = {
  // ============================================================================
  // CONVERSATION METHODS
  // ============================================================================

  async getConversation(conversationId) {
    log.debug('Getting conversation via GraphQL', { conversationId });
    return graphqlCommunicationService.getConversation(conversationId);
  },

  async listUserConversations(userId, options = {}) {
    log.debug('Listing user conversations via GraphQL', { userId });
    return graphqlCommunicationService.listUserConversations(userId, options);
  },

  async findConversationBetweenUsers(user1Id, user2Id) {
    log.debug('Finding conversation between users via GraphQL', { user1Id, user2Id });
    return graphqlCommunicationService.findConversationBetweenUsers(user1Id, user2Id);
  },

  async getUnreadConversationsCount(userId) {
    log.debug('Getting unread conversations count via GraphQL', { userId });
    return graphqlCommunicationService.getUnreadConversationsCount(userId);
  },

  async createConversation(data) {
    log.debug('Creating conversation via GraphQL');
    return graphqlCommunicationService.createConversation(data);
  },

  async updateConversation(conversationId, updates) {
    log.debug('Updating conversation via GraphQL', { conversationId });
    return graphqlCommunicationService.updateConversation(conversationId, updates);
  },

  async archiveConversation(conversationId) {
    log.debug('Archiving conversation via GraphQL', { conversationId });
    return graphqlCommunicationService.archiveConversation(conversationId);
  },

  async deleteConversation(conversationId) {
    log.debug('Deleting conversation via GraphQL', { conversationId });
    return graphqlCommunicationService.deleteConversation(conversationId);
  },

  // ============================================================================
  // MESSAGE METHODS
  // ============================================================================

  async getMessage(messageId) {
    log.debug('Getting message via GraphQL', { messageId });
    return graphqlCommunicationService.getMessage(messageId);
  },

  async getConversationMessages(conversationId, options = {}) {
    log.debug('Getting conversation messages via GraphQL', { conversationId });
    return graphqlCommunicationService.getConversationMessages(conversationId, options);
  },

  async getUserMessages(userId, options = {}) {
    log.debug('Getting user messages via GraphQL', { userId });
    return graphqlCommunicationService.getUserMessages(userId, options);
  },

  async getUnreadCount(userId) {
    log.debug('Getting unread count via GraphQL', { userId });
    return graphqlCommunicationService.getUnreadCount(userId);
  },

  async sendMessage(senderId, recipientId, messageData) {
    log.debug('Sending message via GraphQL', { senderId, recipientId });
    return graphqlCommunicationService.sendMessage(senderId, recipientId, messageData);
  },

  async markAsRead(messageId) {
    log.debug('Marking message as read via GraphQL', { messageId });
    return graphqlCommunicationService.markAsRead(messageId);
  },

  async markMultipleAsRead(messageIds) {
    log.debug('Marking multiple messages as read via GraphQL', { count: messageIds.length });
    return graphqlCommunicationService.markMultipleAsRead(messageIds);
  },

  async archiveMessage(messageId) {
    log.debug('Archiving message via GraphQL', { messageId });
    return graphqlCommunicationService.archiveMessage(messageId);
  },

  async deleteMessage(messageId) {
    log.debug('Deleting message via GraphQL', { messageId });
    return graphqlCommunicationService.deleteMessage(messageId);
  },
};

export default communicationService;
