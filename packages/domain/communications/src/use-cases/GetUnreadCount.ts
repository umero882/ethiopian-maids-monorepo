/**
 * GetUnreadCount Use Case
 *
 * Gets the count of unread notifications for a user.
 *
 * Business Rules:
 * - Returns count of unread notifications
 * - Used for badge display in UI
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { GetUnreadCountDTO } from '../dtos/NotificationDTOs.js';

export class GetUnreadCountUseCase implements UseCase<GetUnreadCountDTO, number> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(request: GetUnreadCountDTO): Promise<Result<number>> {
    try {
      // Validate input
      if (!request.userId || request.userId.trim() === '') {
        return Result.fail('User ID is required');
      }

      // Get unread count
      const count = await this.notificationRepository.getUnreadCount(request.userId);

      return Result.ok(count);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to get unread count: ${message}`);
    }
  }
}
