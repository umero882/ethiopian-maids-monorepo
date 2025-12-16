/**
 * MarkMessageAsRead Use Case
 *
 * Marks a message as read by the recipient.
 *
 * Business Rules:
 * - Message must exist
 * - Only recipient can mark as read
 * - Cannot mark already read message
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { Message } from '../entities/Message.js';
import { MessageRepository } from '../repositories/MessageRepository.js';
import { MarkMessageAsReadDTO } from '../dtos/MessageDTOs.js';

export class MarkMessageAsReadUseCase implements UseCase<MarkMessageAsReadDTO, Message> {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(request: MarkMessageAsReadDTO): Promise<Result<Message>> {
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

      // Check if user is the recipient
      if (!message.isForUser(request.userId)) {
        return Result.fail('Only the recipient can mark this message as read');
      }

      // Mark as read (entity enforces business rules)
      try {
        message.markAsRead();
      } catch (error) {
        return Result.fail(error.message);
      }

      // Save changes
      await this.messageRepository.save(message);

      return Result.ok(message);
    } catch (error) {
      return Result.fail(`Failed to mark message as read: ${error.message}`);
    }
  }
}
