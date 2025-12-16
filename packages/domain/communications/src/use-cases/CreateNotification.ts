/**
 * CreateNotification Use Case
 *
 * Creates a new notification for a user.
 *
 * Business Rules:
 * - User ID is required
 * - Title and message are required
 * - Notification is created as unread by default
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { Notification } from '../entities/Notification.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { CreateNotificationDTO } from '../dtos/NotificationDTOs.js';

export class CreateNotificationUseCase implements UseCase<CreateNotificationDTO, Notification> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(request: CreateNotificationDTO): Promise<Result<Notification>> {
    try {
      // Validate input
      const validationResult = this.validate(request);
      if (validationResult.isFailure) {
        return validationResult;
      }

      // Create notification
      const notification = Notification.create({
        userId: request.userId,
        type: request.type,
        title: request.title,
        message: request.message,
        relatedEntityType: request.relatedEntityType,
        relatedEntityId: request.relatedEntityId,
        actionUrl: request.actionUrl,
        metadata: request.metadata || {},
        priority: request.priority || 'normal',
        expiresAt: request.expiresAt ? new Date(request.expiresAt) : null,
        isRead: false,
      });

      // Save notification
      await this.notificationRepository.save(notification);

      return Result.ok(notification);
    } catch (error) {
      return Result.fail(`Failed to create notification: ${error.message}`);
    }
  }

  private validate(request: CreateNotificationDTO): Result<void> {
    const errors: Record<string, string[]> = {};

    if (!request.userId || request.userId.trim() === '') {
      errors.userId = ['User ID is required'];
    }
    if (!request.title || request.title.trim() === '') {
      errors.title = ['Title is required'];
    }
    if (!request.message || request.message.trim() === '') {
      errors.message = ['Message is required'];
    }

    if (Object.keys(errors).length > 0) {
      return Result.fail(JSON.stringify(errors));
    }
    return Result.ok();
  }
}
