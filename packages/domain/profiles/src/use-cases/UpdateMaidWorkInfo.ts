/**
 * UpdateMaidWorkInfo Use Case
 *
 * Updates work-related information for a maid profile.
 *
 * Business Rules:
 * - Profile must exist
 * - Profile must not be archived
 * - At least one field must be updated
 * - Updates completion percentage automatically
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { MaidProfile } from '../entities/MaidProfile.js';
import { MaidProfileRepository } from '../repositories/MaidProfileRepository.js';
import { UpdateMaidWorkInfoDTO } from '../dtos/MaidProfileDTOs.js';

export class UpdateMaidWorkInfoUseCase implements UseCase<UpdateMaidWorkInfoDTO, MaidProfile> {
  constructor(private readonly maidProfileRepository: MaidProfileRepository) {}

  async execute(request: UpdateMaidWorkInfoDTO): Promise<Result<MaidProfile>> {
    try {
      // Validate at least one field is being updated
      const hasUpdate =
        request.skills !== undefined ||
        request.languages !== undefined ||
        request.experienceYears !== undefined ||
        request.education !== undefined ||
        request.religion !== undefined ||
        request.maritalStatus !== undefined ||
        request.availability !== undefined;

      if (!hasUpdate) {
        return Result.fail('At least one field must be updated');
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

      // Update work info using entity methods
      if (request.skills !== undefined) {
        profile.updateSkills(request.skills);
      }
      if (request.languages !== undefined) {
        profile.updateLanguages(request.languages);
      }
      // Note: experienceYears, education, religion, maritalStatus, availability
      // are not supported by the entity yet - they would need entity updates

      // Save changes
      await this.maidProfileRepository.save(profile);

      return Result.ok(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to update maid work info: ${message}`);
    }
  }
}
