/**
 * DeleteMessage Use Case
 *
 * Deletes a message (soft delete - only for the requesting user).
 *
 * Business Rules:
 * - Message must exist
 * - Only sender or recipient can delete
 * - Actual implementation may vary (hard vs soft delete)
 */

import { VoidUseCase, Result } from '@ethio/domain-shared';
import { MessageRepository } from '../repositories/MessageRepository.js';
import { DeleteMessageDTO } from '../dtos/MessageDTOs.js';

export class DeleteMessageUseCase implements VoidUseCase<DeleteMessageDTO> {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(request: DeleteMessageDTO): Promise<Result<void>> {
    try {
      // Validate input
      if (!request.messageId || request.messageId.trim() === '') {
        return Result.fail('Message ID is required');
      }
      if (!request.userId || request.userId.trim() === '') {
        return Result.fail('User ID is required');
      }

      // Load message
      const message = await this.messageRepository.findById(request.messageId);
      if (!message) {
        return Result.fail(`Message '${request.messageId}' not found`);
      }

      // Check if user can delete this message
      const canDelete = message.isFromUser(request.userId) || message.isForUser(request.userId);
      if (!canDelete) {
        return Result.fail('You can only delete your own messages');
      }

      // Delete message
      await this.messageRepository.delete(request.messageId);

      return Result.ok();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to delete message: ${message}`);
    }
  }
}
