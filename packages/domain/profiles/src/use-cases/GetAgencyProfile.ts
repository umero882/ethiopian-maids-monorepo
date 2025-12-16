/**
 * GetAgencyProfile Use Case
 *
 * Retrieves an agency profile by ID.
 *
 * Business Rules:
 * - Profile must exist
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { AgencyProfile } from '../entities/AgencyProfile.js';
import { AgencyProfileRepository } from '../repositories/AgencyProfileRepository.js';

export interface GetAgencyProfileRequest {
  profileId: string;
}

export class GetAgencyProfileUseCase implements UseCase<GetAgencyProfileRequest, AgencyProfile> {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(request: GetAgencyProfileRequest): Promise<Result<AgencyProfile>> {
    try {
      // Validate input
      if (!request.profileId || request.profileId.trim() === '') {
        return Result.fail('Profile ID is required');
      }

      // Load profile
      const profile = await this.agencyProfileRepository.findById(request.profileId);
      if (!profile) {
        return Result.fail(`Agency profile '${request.profileId}' not found`);
      }

      return Result.ok(profile);
    } catch (error) {
      return Result.fail(`Failed to get agency profile: ${error.message}`);
    }
  }
}
