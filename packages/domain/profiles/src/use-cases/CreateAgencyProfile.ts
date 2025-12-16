/**
 * CreateAgencyProfile Use Case
 *
 * Creates a new agency profile.
 *
 * Business Rules:
 * - User ID must be valid
 * - Agency name is required
 * - Country is required
 * - User can only have one agency profile
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { AgencyProfile, AgencyProfileProps } from '../entities/AgencyProfile.js';
import { AgencyProfileRepository } from '../repositories/AgencyProfileRepository.js';
import { CreateAgencyProfileDTO } from '../dtos/AgencyProfileDTOs.js';

export class CreateAgencyProfileUseCase
  implements UseCase<CreateAgencyProfileDTO, AgencyProfile>
{
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(request: CreateAgencyProfileDTO): Promise<Result<AgencyProfile>> {
    try {
      // Validate input
      const validationResult = this.validate(request);
      if (validationResult.isFailure) {
        return validationResult;
      }

      // Check if user already has a profile
      const existingProfile = await this.agencyProfileRepository.findByUserId(request.userId);
      if (existingProfile) {
        return Result.fail('User already has an agency profile');
      }

      // Create profile entity
      const profileProps: AgencyProfileProps = {
        id: crypto.randomUUID(),
        userId: request.userId,
        fullName: request.fullName,
        licenseNumber: request.licenseNumber || null,
        country: request.country,
        city: request.city || null,
        address: request.address || null,
        phone: request.phone || null,
        email: request.email || null,
        website: request.website || null,
        description: request.description || null,
        isVerified: false,
        verifiedAt: null,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const profile = new AgencyProfile(profileProps);

      // Save to repository
      await this.agencyProfileRepository.save(profile);

      return Result.ok(profile);
    } catch (error) {
      return Result.fail(`Failed to create agency profile: ${error.message}`);
    }
  }

  private validate(request: CreateAgencyProfileDTO): Result<void> {
    const errors: Record<string, string[]> = {};

    if (!request.userId || request.userId.trim() === '') {
      errors.userId = ['User ID is required'];
    }
    if (!request.fullName || request.fullName.trim() === '') {
      errors.fullName = ['Agency name is required'];
    }
    if (!request.country || request.country.trim() === '') {
      errors.country = ['Country is required'];
    }

    if (Object.keys(errors).length > 0) {
      return Result.fail(JSON.stringify(errors));
    }
    return Result.ok();
  }
}
