/**
 * CreateSponsorProfile Use Case
 *
 * Creates a new sponsor profile.
 *
 * Business Rules:
 * - User ID must be valid
 * - Full name is required
 * - Country is required
 * - User can only have one sponsor profile
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { SponsorProfile, SponsorProfileProps } from '../entities/SponsorProfile.js';
import { SponsorProfileRepository } from '../repositories/SponsorProfileRepository.js';
import { CreateSponsorProfileDTO } from '../dtos/SponsorProfileDTOs.js';

export class CreateSponsorProfileUseCase
  implements UseCase<CreateSponsorProfileDTO, SponsorProfile>
{
  constructor(private readonly sponsorProfileRepository: SponsorProfileRepository) {}

  async execute(request: CreateSponsorProfileDTO): Promise<Result<SponsorProfile>> {
    try {
      // Validate input
      const validationResult = this.validate(request);
      if (validationResult.isFailure) {
        return Result.fail<SponsorProfile>(validationResult.error!);
      }

      // Check if user already has a profile
      const existingProfile = await this.sponsorProfileRepository.findByUserId(request.userId);
      if (existingProfile) {
        return Result.fail('User already has a sponsor profile');
      }

      // Create profile entity
      const profileProps: SponsorProfileProps = {
        id: crypto.randomUUID(),
        userId: request.userId,
        fullName: request.fullName,
        phone: request.phone || null,
        country: request.country,
        city: request.city || null,
        preferredLanguages: request.preferredLanguages || [],
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const profile = new SponsorProfile(profileProps);

      // Save to repository
      await this.sponsorProfileRepository.save(profile);

      return Result.ok(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to create sponsor profile: ${message}`);
    }
  }

  private validate(request: CreateSponsorProfileDTO): Result<void> {
    const errors: Record<string, string[]> = {};

    if (!request.userId || request.userId.trim() === '') {
      errors.userId = ['User ID is required'];
    }
    if (!request.fullName || request.fullName.trim() === '') {
      errors.fullName = ['Full name is required'];
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
