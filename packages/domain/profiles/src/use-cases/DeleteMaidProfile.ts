/**
 * DeleteMaidProfile Use Case
 *
 * Permanently deletes a maid profile.
 *
 * Business Rules:
 * - Profile must exist
 * - Profile must be in 'draft' or 'archived' status
 * - Cannot delete active or verified profiles (must archive first)
 * - Deletion is permanent and cannot be undone
 *
 * NOTE: Consider soft-delete pattern for production use.
 */

import { VoidUseCase, Result } from '@ethio/domain-shared';
import { MaidProfileRepository } from '../repositories/MaidProfileRepository.js';

export interface DeleteMaidProfileRequest {
  profileId: string;
}

export class DeleteMaidProfileUseCase implements VoidUseCase<DeleteMaidProfileRequest> {
  constructor(private readonly maidProfileRepository: MaidProfileRepository) {}

  async execute(request: DeleteMaidProfileRequest): Promise<Result<void>> {
    try {
      // Validate input
      if (!request.profileId || request.profileId.trim() === '') {
        return Result.fail('Profile ID is required');
      }

      // Load profile
      const profile = await this.maidProfileRepository.findById(request.profileId);
      if (!profile) {
        return Result.fail(`Maid profile '${request.profileId}' not found`);
      }

      // Check if profile can be deleted
      const canDelete = profile.status.isDraft() || profile.status.isArchived();
      if (!canDelete) {
        return Result.fail(
          'Cannot delete active or verified profile. Please archive the profile first.'
        );
      }

      // Delete profile
      await this.maidProfileRepository.delete(request.profileId);

      return Result.ok();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to delete maid profile: ${message}`);
    }
  }
}
