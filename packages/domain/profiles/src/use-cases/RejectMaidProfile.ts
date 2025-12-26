/**
 * RejectMaidProfile Use Case
 *
 * Rejects a maid profile with a reason.
 *
 * Business Rules:
 * - Profile must exist
 * - Profile must be in 'pending_verification' status
 * - Rejection reason is required
 * - Profile returns to 'draft' status for corrections
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { MaidProfile } from '../entities/MaidProfile.js';
import { MaidProfileRepository } from '../repositories/MaidProfileRepository.js';
import { RejectMaidProfileDTO } from '../dtos/MaidProfileDTOs.js';

export class RejectMaidProfileUseCase implements UseCase<RejectMaidProfileDTO, MaidProfile> {
  constructor(private readonly maidProfileRepository: MaidProfileRepository) {}

  async execute(request: RejectMaidProfileDTO): Promise<Result<MaidProfile>> {
    try {
      // Validate rejection reason
      if (!request.reason || request.reason.trim() === '') {
        return Result.fail('Rejection reason is required');
      }

      // Load profile
      const profile = await this.maidProfileRepository.findById(request.profileId);
      if (!profile) {
        return Result.fail(`Maid profile '${request.profileId}' not found`);
      }

      // Reject profile (entity enforces business rules)
      try {
        profile.reject(request.reason, 'admin');
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return Result.fail(msg);
      }

      // Save changes
      await this.maidProfileRepository.save(profile);

      return Result.ok(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to reject maid profile: ${message}`);
    }
  }
}
