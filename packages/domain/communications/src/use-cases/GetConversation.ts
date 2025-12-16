/**
 * GetConversation Use Case
 *
 * Retrieves all messages in a conversation between two users.
 *
 * Business Rules:
 * - Both user IDs are required
 * - Returns messages sorted by creation time
 * - Supports pagination
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { Message } from '../entities/Message.js';
import { MessageRepository } from '../repositories/MessageRepository.js';
import { GetConversationDTO } from '../dtos/MessageDTOs.js';

export class GetConversationUseCase implements UseCase<GetConversationDTO, Message[]> {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(request: GetConversationDTO): Promise<Result<Message[]>> {
    try {
      // Validate input
      if (!request.userId1 || request.userId1.trim() === '') {
        return Result.fail('User 1 ID is required');
      }
      if (!request.userId2 || request.userId2.trim() === '') {
        return Result.fail('User 2 ID is required');
      }

      // Get conversation messages
      const messages = await this.messageRepository.getConversation(
        request.userId1,
        request.userId2,
        request.limit || 50,
        request.offset || 0
      );

      return Result.ok(messages);
    } catch (error) {
      return Result.fail(`Failed to get conversation: ${error.message}`);
    }
  }
}
