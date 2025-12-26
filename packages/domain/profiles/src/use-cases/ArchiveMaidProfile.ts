/**
 * ArchiveMaidProfile Use Case
 *
 * Archives a maid profile, removing it from active listings.
 *
 * Business Rules:
 * - Profile must exist
 * - Profile must not already be archived
 * - Archived profiles can be unarchived later
 * - Archive reason is optional but recommended
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { MaidProfile } from '../entities/MaidProfile.js';
import { MaidProfileRepository } from '../repositories/MaidProfileRepository.js';
import { ArchiveMaidProfileDTO } from '../dtos/MaidProfileDTOs.js';

export class ArchiveMaidProfileUseCase implements UseCase<ArchiveMaidProfileDTO, MaidProfile> {
  constructor(private readonly maidProfileRepository: MaidProfileRepository) {}

  async execute(request: ArchiveMaidProfileDTO): Promise<Result<MaidProfile>> {
    try {
      // Load profile
      const profile = await this.maidProfileRepository.findById(request.profileId);
      if (!profile) {
        return Result.fail(`Maid profile '${request.profileId}' not found`);
      }

      // Archive profile (entity enforces business rules)
      try {
        profile.archive(request.reason || 'Archived by user');
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return Result.fail(msg);
      }

      // Save changes
      await this.maidProfileRepository.save(profile);

      return Result.ok(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to archive maid profile: ${message}`);
    }
  }
}
