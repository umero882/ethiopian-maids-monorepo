/**
 * MarkAllNotificationsAsRead Use Case
 *
 * Marks all unread notifications for a user as read.
 *
 * Business Rules:
 * - Marks all unread notifications
 * - Only affects user's own notifications
 */

import { VoidUseCase, Result } from '@ethio/domain-shared';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { MarkAllNotificationsAsReadDTO } from '../dtos/NotificationDTOs.js';

export class MarkAllNotificationsAsReadUseCase
  implements VoidUseCase<MarkAllNotificationsAsReadDTO>
{
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(request: MarkAllNotificationsAsReadDTO): Promise<Result<void>> {
    try {
      // Validate input
      if (!request.userId || request.userId.trim() === '') {
        return Result.fail('User ID is required');
      }

      // Mark all as read
      await this.notificationRepository.markAllAsRead(request.userId);

      return Result.ok();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to mark all notifications as read: ${message}`);
    }
  }
}
