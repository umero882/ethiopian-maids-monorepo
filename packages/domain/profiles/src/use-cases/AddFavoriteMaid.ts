/**
 * AddFavoriteMaid Use Case
 *
 * Adds a maid to a sponsor's favorites list.
 *
 * Business Rules:
 * - Sponsor profile must exist
 * - Maid profile must exist
 * - Cannot add duplicate favorites
 */

import { VoidUseCase, Result } from '@ethio/domain-shared';
import { SponsorProfileRepository } from '../repositories/SponsorProfileRepository.js';
import { MaidProfileRepository } from '../repositories/MaidProfileRepository.js';
import { AddFavoriteMaidDTO } from '../dtos/SponsorProfileDTOs.js';

export class AddFavoriteMaidUseCase implements VoidUseCase<AddFavoriteMaidDTO> {
  constructor(
    private readonly sponsorProfileRepository: SponsorProfileRepository,
    private readonly maidProfileRepository: MaidProfileRepository
  ) {}

  async execute(request: AddFavoriteMaidDTO): Promise<Result<void>> {
    try {
      // Validate input
      if (!request.sponsorId || request.sponsorId.trim() === '') {
        return Result.fail('Sponsor ID is required');
      }
      if (!request.maidId || request.maidId.trim() === '') {
        return Result.fail('Maid ID is required');
      }

      // Check if sponsor exists
      const sponsor = await this.sponsorProfileRepository.findById(request.sponsorId);
      if (!sponsor) {
        return Result.fail(`Sponsor profile '${request.sponsorId}' not found`);
      }

      // Check if maid exists
      const maid = await this.maidProfileRepository.findById(request.maidId);
      if (!maid) {
        return Result.fail(`Maid profile '${request.maidId}' not found`);
      }

      // Check if already favorited
      const favorites = await this.sponsorProfileRepository.getFavoriteMaidIds(request.sponsorId);
      if (favorites.includes(request.maidId)) {
        return Result.fail('Maid is already in favorites');
      }

      // Add to favorites
      await this.sponsorProfileRepository.addFavorite(request.sponsorId, request.maidId);

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to add favorite maid: ${error.message}`);
    }
  }
}
