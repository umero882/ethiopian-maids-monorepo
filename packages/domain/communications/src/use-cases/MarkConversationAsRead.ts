/**
 * MarkConversationAsRead Use Case
 *
 * Marks all messages in a conversation as read for a user.
 *
 * Business Rules:
 * - Marks all unread messages in conversation
 * - Only marks messages where user is recipient
 */

import { VoidUseCase, Result } from '@ethio/domain-shared';
import { MessageRepository } from '../repositories/MessageRepository.js';
import { MarkConversationAsReadDTO } from '../dtos/MessageDTOs.js';

export class MarkConversationAsReadUseCase implements VoidUseCase<MarkConversationAsReadDTO> {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(request: MarkConversationAsReadDTO): Promise<Result<void>> {
    try {
      // Validate input
      if (!request.conversationId || request.conversationId.trim() === '') {
        return Result.fail('Conversation ID is required');
      }
      if (!request.userId || request.userId.trim() === '') {
        return Result.fail('User ID is required');
      }

      // Mark conversation as read
      await this.messageRepository.markConversationAsRead(request.conversationId, request.userId);

      return Result.ok();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to mark conversation as read: ${message}`);
    }
  }
}
