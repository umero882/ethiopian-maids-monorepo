/**
 * UpdateSponsorProfile Use Case
 *
 * Updates sponsor profile information.
 *
 * Business Rules:
 * - Profile must exist
 * - At least one field must be updated
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { SponsorProfile } from '../entities/SponsorProfile.js';
import { SponsorProfileRepository } from '../repositories/SponsorProfileRepository.js';
import { UpdateSponsorProfileDTO } from '../dtos/SponsorProfileDTOs.js';

export class UpdateSponsorProfileUseCase
  implements UseCase<UpdateSponsorProfileDTO, SponsorProfile>
{
  constructor(private readonly sponsorProfileRepository: SponsorProfileRepository) {}

  async execute(request: UpdateSponsorProfileDTO): Promise<Result<SponsorProfile>> {
    try {
      // Validate at least one field is being updated
      const hasUpdate =
        request.fullName !== undefined ||
        request.email !== undefined ||
        request.phone !== undefined ||
        request.country !== undefined ||
        request.city !== undefined ||
        request.preferredNationality !== undefined ||
        request.preferredLanguages !== undefined;

      if (!hasUpdate) {
        return Result.fail('At least one field must be updated');
      }

      // Load profile
      const profile = await this.sponsorProfileRepository.findById(request.profileId);
      if (!profile) {
        return Result.fail(`Sponsor profile '${request.profileId}' not found`);
      }

      // Update profile using entity methods
      profile.updateBasicInfo({
        fullName: request.fullName,
        phone: request.phone,
        country: request.country,
        city: request.city,
      });

      if (request.preferredLanguages !== undefined) {
        profile.updatePreferences({
          preferredLanguages: request.preferredLanguages,
        });
      }
      // Note: email and preferredNationality are not supported by the entity

      // Save changes
      await this.sponsorProfileRepository.save(profile);

      return Result.ok(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to update sponsor profile: ${message}`);
    }
  }
}
