/**
 * UpdateMaidProfile Use Case
 *
 * Updates basic information of a maid profile.
 *
 * Business Rules:
 * - Profile must exist
 * - Profile must not be archived
 * - At least one field must be provided for update
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { MaidProfile } from '../entities/MaidProfile.js';
import { MaidProfileRepository } from '../repositories/MaidProfileRepository.js';
import { UpdateMaidBasicInfoDTO } from '../dtos/MaidProfileDTOs.js';

export class UpdateMaidProfileUseCase implements UseCase<UpdateMaidBasicInfoDTO, MaidProfile> {
  constructor(private readonly maidProfileRepository: MaidProfileRepository) {}

  async execute(request: UpdateMaidBasicInfoDTO): Promise<Result<MaidProfile>> {
    try {
      // Validate input
      const validationResult = this.validate(request);
      if (validationResult.isFailure) {
        return Result.fail<MaidProfile>(validationResult.error!);
      }

      // Load profile
      const profile = await this.maidProfileRepository.findById(request.profileId);
      if (!profile) {
        return Result.fail(`Maid profile '${request.profileId}' not found`);
      }

      // Check if profile is archived
      if (profile.status.isArchived()) {
        return Result.fail('Cannot update archived profile');
      }

      // Update profile using entity method
      profile.updateBasicInfo({
        fullName: request.fullName,
        dateOfBirth: request.dateOfBirth,
        nationality: request.nationality,
        phone: request.phone,
      });

      // Save changes
      await this.maidProfileRepository.save(profile);

      return Result.ok(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to update maid profile: ${message}`);
    }
  }

  private validate(request: UpdateMaidBasicInfoDTO): Result<void> {
    const errors: Record<string, string[]> = {};

    if (!request.profileId || request.profileId.trim() === '') {
      errors.profileId = ['Profile ID is required'];
    }

    // Check if at least one field is being updated
    const hasUpdate =
      request.fullName ||
      request.dateOfBirth ||
      request.nationality ||
      request.phone;

    if (!hasUpdate) {
      return Result.fail('At least one field must be provided for update');
    }

    if (Object.keys(errors).length > 0) {
      return Result.fail(JSON.stringify(errors));
    }

    return Result.ok();
  }
}
