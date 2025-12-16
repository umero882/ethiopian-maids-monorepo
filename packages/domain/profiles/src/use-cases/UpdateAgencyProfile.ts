/**
 * UpdateAgencyProfile Use Case
 *
 * Updates agency profile information.
 *
 * Business Rules:
 * - Profile must exist
 * - At least one field must be updated
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { AgencyProfile } from '../entities/AgencyProfile.js';
import { AgencyProfileRepository } from '../repositories/AgencyProfileRepository.js';
import { UpdateAgencyProfileDTO } from '../dtos/AgencyProfileDTOs.js';

export class UpdateAgencyProfileUseCase
  implements UseCase<UpdateAgencyProfileDTO, AgencyProfile>
{
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(request: UpdateAgencyProfileDTO): Promise<Result<AgencyProfile>> {
    try {
      // Validate at least one field is being updated
      const hasUpdate =
        request.fullName !== undefined ||
        request.licenseNumber !== undefined ||
        request.country !== undefined ||
        request.city !== undefined ||
        request.address !== undefined ||
        request.phone !== undefined ||
        request.email !== undefined ||
        request.website !== undefined ||
        request.description !== undefined;

      if (!hasUpdate) {
        return Result.fail('At least one field must be updated');
      }

      // Load profile
      const profile = await this.agencyProfileRepository.findById(request.profileId);
      if (!profile) {
        return Result.fail(`Agency profile '${request.profileId}' not found`);
      }

      // Update profile using entity method
      profile.update({
        fullName: request.fullName,
        licenseNumber: request.licenseNumber,
        country: request.country,
        city: request.city,
        address: request.address,
        phone: request.phone,
        email: request.email,
        website: request.website,
        description: request.description,
      });

      // Save changes
      await this.agencyProfileRepository.save(profile);

      return Result.ok(profile);
    } catch (error) {
      return Result.fail(`Failed to update agency profile: ${error.message}`);
    }
  }
}
