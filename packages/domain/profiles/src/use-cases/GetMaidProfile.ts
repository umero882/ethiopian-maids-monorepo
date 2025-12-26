/**
 * GetMaidProfile Use Case
 *
 * Retrieves a maid profile by ID.
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { MaidProfile } from '../entities/MaidProfile.js';
import { MaidProfileRepository } from '../repositories/MaidProfileRepository.js';

export interface GetMaidProfileRequest {
  profileId: string;
}

export class GetMaidProfileUseCase implements UseCase<GetMaidProfileRequest, MaidProfile> {
  constructor(private readonly maidProfileRepository: MaidProfileRepository) {}

  async execute(request: GetMaidProfileRequest): Promise<Result<MaidProfile>> {
    try {
      if (!request.profileId || request.profileId.trim() === '') {
        return Result.fail('Profile ID is required');
      }

      const profile = await this.maidProfileRepository.findById(request.profileId);

      if (!profile) {
        return Result.fail(`Maid profile '${request.profileId}' not found`);
      }

      return Result.ok(profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to get maid profile: ${message}`);
    }
  }
}
