/**
 * ApproveMaidProfile Use Case
 *
 * Approves a maid profile after verification review.
 *
 * Business Rules:
 * - Profile must exist
 * - Profile must be in 'pending_verification' status
 * - Only authorized users can approve profiles
 * - Sets verified status and timestamp
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { MaidProfile } from '../entities/MaidProfile.js';
import { MaidProfileRepository } from '../repositories/MaidProfileRepository.js';
import { ApproveMaidProfileDTO } from '../dtos/MaidProfileDTOs.js';

export class ApproveMaidProfileUseCase implements UseCase<ApproveMaidProfileDTO, MaidProfile> {
  constructor(private readonly maidProfileRepository: MaidProfileRepository) {}

  async execute(request: ApproveMaidProfileDTO): Promise<Result<MaidProfile>> {
    try {
      // Load profile
      const profile = await this.maidProfileRepository.findById(request.profileId);
      if (!profile) {
        return Result.fail(`Maid profile '${request.profileId}' not found`);
      }

      // Approve profile (entity enforces business rules)
      try {
        profile.approve();
      } catch (error) {
        return Result.fail(error.message);
      }

      // Save changes
      await this.maidProfileRepository.save(profile);

      return Result.ok(profile);
    } catch (error) {
      return Result.fail(`Failed to approve maid profile: ${error.message}`);
    }
  }
}
