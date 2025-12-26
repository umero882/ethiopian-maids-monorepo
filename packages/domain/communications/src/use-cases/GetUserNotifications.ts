/**
 * GetUserNotifications Use Case
 *
 * Retrieves all notifications for a user.
 *
 * Business Rules:
 * - Can filter by read status
 * - Can filter by notification type
 * - Returns notifications sorted by creation time (newest first)
 * - Supports pagination
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { Notification } from '../entities/Notification.js';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { GetUserNotificationsDTO } from '../dtos/NotificationDTOs.js';

export class GetUserNotificationsUseCase
  implements UseCase<GetUserNotificationsDTO, Notification[]>
{
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(request: GetUserNotificationsDTO): Promise<Result<Notification[]>> {
    try {
      // Validate input
      if (!request.userId || request.userId.trim() === '') {
        return Result.fail('User ID is required');
      }

      // Get notifications based on filters
      let notifications: Notification[];

      if (request.type) {
        // Get by type
        notifications = await this.notificationRepository.findByType(
          request.userId,
          request.type,
          request.limit || 50
        );
      } else {
        // Get by user (with optional read filter)
        notifications = await this.notificationRepository.findByUserId(
          request.userId,
          request.isRead,
          request.limit || 50,
          request.offset || 0
        );
      }

      return Result.ok(notifications);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to get user notifications: ${message}`);
    }
  }
}
