/**
 * SendMessage Use Case
 *
 * Sends a message from one user to another.
 *
 * Business Rules:
 * - Sender and recipient must be different
 * - Content is required
 * - Creates conversation if it doesn't exist
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { Message } from '../entities/Message.js';
import { MessageRepository } from '../repositories/MessageRepository.js';
import { SendMessageDTO } from '../dtos/MessageDTOs.js';

export class SendMessageUseCase implements UseCase<SendMessageDTO, Message> {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(request: SendMessageDTO): Promise<Result<Message>> {
    try {
      // Validate input
      const validationResult = this.validate(request);
      if (validationResult.isFailure) {
        return validationResult;
      }

      // Ensure sender and recipient are different
      if (request.senderId === request.recipientId) {
        return Result.fail('Cannot send message to yourself');
      }

      // Get or create conversation ID
      const conversationId = await this.messageRepository.getOrCreateConversationId(
        request.senderId,
        request.recipientId
      );

      // Create message
      const message = Message.create({
        conversationId,
        senderId: request.senderId,
        recipientId: request.recipientId,
        content: request.content,
        messageType: request.messageType || 'text',
        metadata: request.metadata || {},
        isRead: false,
      });

      // Save message
      await this.messageRepository.save(message);

      return Result.ok(message);
    } catch (error) {
      return Result.fail(`Failed to send message: ${error.message}`);
    }
  }

  private validate(request: SendMessageDTO): Result<void> {
    const errors: Record<string, string[]> = {};

    if (!request.senderId || request.senderId.trim() === '') {
      errors.senderId = ['Sender ID is required'];
    }
    if (!request.recipientId || request.recipientId.trim() === '') {
      errors.recipientId = ['Recipient ID is required'];
    }
    if (!request.content || request.content.trim() === '') {
      errors.content = ['Message content is required'];
    }

    if (Object.keys(errors).length > 0) {
      return Result.fail(JSON.stringify(errors));
    }
    return Result.ok();
  }
}
