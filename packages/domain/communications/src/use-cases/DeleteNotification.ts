/**
 * DeleteNotification Use Case
 *
 * Deletes a notification.
 *
 * Business Rules:
 * - Notification must exist
 * - Only the notification owner can delete it
 */

import { VoidUseCase, Result } from '@ethio/domain-shared';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { DeleteNotificationDTO } from '../dtos/NotificationDTOs.js';

export class DeleteNotificationUseCase implements VoidUseCase<DeleteNotificationDTO> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(request: DeleteNotificationDTO): Promise<Result<void>> {
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
        return Result.fail('You can only delete your own notifications');
      }

      // Delete notification
      await this.notificationRepository.delete(request.notificationId);

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete notification: ${error.message}`);
    }
  }
}
