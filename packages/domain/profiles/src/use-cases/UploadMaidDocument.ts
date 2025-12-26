/**
 * UploadMaidDocument Use Case
 *
 * Uploads a document for a maid profile (passport, medical certificate, etc.).
 *
 * Business Rules:
 * - Profile must exist
 * - Profile must not be archived
 * - Document type and URL are required
 * - Updates completion percentage automatically
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { MaidProfile } from '../entities/MaidProfile.js';
import { MaidProfileRepository } from '../repositories/MaidProfileRepository.js';
import { UploadMaidDocumentDTO } from '../dtos/MaidProfileDTOs.js';

export class UploadMaidDocumentUseCase implements UseCase<UploadMaidDocumentDTO, MaidProfile> {
  constructor(private readonly maidProfileRepository: MaidProfileRepository) {}

  async execute(request: UploadMaidDocumentDTO): Promise<Result<MaidProfile>> {
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
        return Result.fail('Cannot upload documents to archived profile');
      }

      // Upload document using entity method
      try {
        profile.uploadDocument(request.documentType as 'passport' | 'medicalCertificate' | 'policeClearance', request.documentUrl);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return Result.fail(msg);
      }

      // Save changes
      await this.maidProfileRepository.save(profile);

      return Result.ok(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to upload document: ${message}`);
    }
  }

  private validate(request: UploadMaidDocumentDTO): Result<void> {
    const errors: Record<string, string[]> = {};

    if (!request.profileId || request.profileId.trim() === '') {
      errors.profileId = ['Profile ID is required'];
    }
    if (!request.documentType || request.documentType.trim() === '') {
      errors.documentType = ['Document type is required'];
    }
    if (!request.documentUrl || request.documentUrl.trim() === '') {
      errors.documentUrl = ['Document URL is required'];
    }

    if (Object.keys(errors).length > 0) {
      return Result.fail(JSON.stringify(errors));
    }
    return Result.ok();
  }
}
