/**
 * SubmitMaidProfileForReview Use Case
 *
 * Submits a maid profile for verification review.
 *
 * Business Rules:
 * - Profile must be complete (100%)
 * - Profile must be in draft status
 * - All required documents must be uploaded
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { MaidProfile } from '../entities/MaidProfile.js';
import { MaidProfileRepository } from '../repositories/MaidProfileRepository.js';
import { SubmitMaidProfileForReviewDTO } from '../dtos/MaidProfileDTOs.js';

export class SubmitMaidProfileForReviewUseCase
  implements UseCase<SubmitMaidProfileForReviewDTO, MaidProfile>
{
  constructor(private readonly maidProfileRepository: MaidProfileRepository) {}

  async execute(request: SubmitMaidProfileForReviewDTO): Promise<Result<MaidProfile>> {
    try {
      // Load profile
      const profile = await this.maidProfileRepository.findById(request.profileId);
      if (!profile) {
        return Result.fail(`Maid profile '${request.profileId}' not found`);
      }

      // Submit for review (entity enforces business rules)
      try {
        profile.submitForReview();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return Result.fail(msg);
      }

      // Save changes
      await this.maidProfileRepository.save(profile);

      return Result.ok(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to submit profile for review: ${message}`);
    }
  }
}
