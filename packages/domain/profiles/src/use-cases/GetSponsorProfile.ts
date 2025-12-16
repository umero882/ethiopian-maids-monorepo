/**
 * GetSponsorProfile Use Case
 *
 * Retrieves a sponsor profile by ID.
 *
 * Business Rules:
 * - Profile must exist
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { SponsorProfile } from '../entities/SponsorProfile.js';
import { SponsorProfileRepository } from '../repositories/SponsorProfileRepository.js';

export interface GetSponsorProfileRequest {
  profileId: string;
}

export class GetSponsorProfileUseCase
  implements UseCase<GetSponsorProfileRequest, SponsorProfile>
{
  constructor(private readonly sponsorProfileRepository: SponsorProfileRepository) {}

  async execute(request: GetSponsorProfileRequest): Promise<Result<SponsorProfile>> {
    try {
      // Validate input
      if (!request.profileId || request.profileId.trim() === '') {
        return Result.fail('Profile ID is required');
      }

      // Load profile
      const profile = await this.sponsorProfileRepository.findById(request.profileId);
      if (!profile) {
        return Result.fail(`Sponsor profile '${request.profileId}' not found`);
      }

      return Result.ok(profile);
    } catch (error) {
      return Result.fail(`Failed to get sponsor profile: ${error.message}`);
    }
  }
}
