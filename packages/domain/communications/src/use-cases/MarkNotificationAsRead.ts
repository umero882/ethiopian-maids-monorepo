/**
 * MarkNotificationAsRead Use Case
 *
 * Marks a notification as read.
 *
 * Business Rules:
 * - Notification must exist
 * - Only the notification owner can mark it as read
 * - Cannot mark already read notification
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { Notification } from '../entities/Notification.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { MarkNotificationAsReadDTO } from '../dtos/NotificationDTOs.js';

export class MarkNotificationAsReadUseCase
  implements UseCase<MarkNotificationAsReadDTO, Notification>
{
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(request: MarkNotificationAsReadDTO): Promise<Result<Notification>> {
    try {
      // Validate input
      if (!request.notificationId || request.notificationId.trim() === '') {
        return Result.fail('Notification ID is required');
      }
      if (!request.userId || request.userId.trim() === '') {
        return Result.fail('User ID is required');
      }

      // Load notification
      const notification = await this.notificationRepository.findById(request.notificationId);
      if (!notification) {
        return Result.fail(`Notification '${request.notificationId}' not found`);
      }

      // Check if user is the owner
      if (notification.userId !== request.userId) {
        return Result.fail('You can only mark your own notifications as read');
      }

      // Mark as read (entity enforces business rules)
      try {
        notification.markAsRead();
      } catch (error) {
        return Result.fail(error.message);
      }

      // Save changes
      await this.notificationRepository.save(notification);

      return Result.ok(notification);
    } catch (error) {
      return Result.fail(`Failed to mark notification as read: ${error.message}`);
    }
  }
}
