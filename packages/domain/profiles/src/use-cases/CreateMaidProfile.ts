/**
 * CreateMaidProfile Use Case
 *
 * Creates a new maid profile in the system.
 *
 * Business Rules:
 * - User ID must be valid
 * - Full name is required
 * - Nationality is required
 * - Phone number must be valid format (if provided)
 * - User can only have one maid profile
 */

import { UseCase, Result, ValidationError, ConflictError } from '@ethio/domain-shared';
import { MaidProfile, MaidProfileProps } from '../entities/MaidProfile.js';
import { MaidProfileRepository } from '../repositories/MaidProfileRepository.js';
import { CreateMaidProfileDTO } from '../dtos/MaidProfileDTOs.js';

export class CreateMaidProfileUseCase implements UseCase<CreateMaidProfileDTO, MaidProfile> {
  constructor(private readonly maidProfileRepository: MaidProfileRepository) {}

  async execute(request: CreateMaidProfileDTO): Promise<Result<MaidProfile>> {
    try {
      // Validate input
      const validationResult = this.validate(request);
      if (validationResult.isFailure) {
        return validationResult;
      }

      // Check if user already has a profile
      const existingProfile = await this.maidProfileRepository.findByUserId(request.userId);
      if (existingProfile) {
        return Result.fail('User already has a maid profile');
      }

      // Create profile entity
      const profileProps: MaidProfileProps = {
        id: crypto.randomUUID(), // Generate ID
        userId: request.userId,
        fullName: request.fullName,
        dateOfBirth: request.dateOfBirth || null,
        nationality: request.nationality,
        phone: request.phone || null,
        profilePhoto: request.profilePhoto || null,
        agencyId: request.agencyId || null,
        status: 'draft',
        completionPercentage: 0,
        isVerified: false,
        verifiedAt: null,
        agencyApproved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const profile = new MaidProfile(profileProps);

      // Save to repository
      await this.maidProfileRepository.save(profile);

      return Result.ok(profile);
    } catch (error) {
      return Result.fail(`Failed to create maid profile: ${error.message}`);
    }
  }

  private validate(request: CreateMaidProfileDTO): Result<void> {
    const errors: Record<string, string[]> = {};

    if (!request.userId || request.userId.trim() === '') {
      errors.userId = ['User ID is required'];
    }

    if (!request.fullName || request.fullName.trim() === '') {
      errors.fullName = ['Full name is required'];
    }

    if (!request.nationality || request.nationality.trim() === '') {
      errors.nationality = ['Nationality is required'];
    }

    if (request.phone && !this.isValidPhoneNumber(request.phone)) {
      errors.phone = ['Invalid phone number format'];
    }

    if (Object.keys(errors).length > 0) {
      return Result.fail(JSON.stringify(errors));
    }

    return Result.ok();
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Basic validation - can be enhanced
    return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s-]/g, ''));
  }
}
