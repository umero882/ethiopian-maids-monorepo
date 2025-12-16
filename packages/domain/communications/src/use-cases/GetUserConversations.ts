/**
 * GetUserConversations Use Case
 *
 * Retrieves all conversations for a user with summary information.
 *
 * Business Rules:
 * - Returns conversation list with last message and unread count
 * - Sorted by most recent activity
 * - Supports pagination
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { MessageRepository } from '../repositories/MessageRepository.js';
import { GetUserConversationsDTO, ConversationSummary } from '../dtos/MessageDTOs.js';

export class GetUserConversationsUseCase
  implements UseCase<GetUserConversationsDTO, ConversationSummary[]>
{
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(request: GetUserConversationsDTO): Promise<Result<ConversationSummary[]>> {
    try {
      // Validate input
      if (!request.userId || request.userId.trim() === '') {
        return Result.fail('User ID is required');
      }

      // Get user conversations
      const conversations = await this.messageRepository.getUserConversations(
        request.userId,
        request.limit || 50,
        request.offset || 0
      );

      return Result.ok(conversations);
    } catch (error) {
      return Result.fail(`Failed to get user conversations: ${error.message}`);
    }
  }
}
