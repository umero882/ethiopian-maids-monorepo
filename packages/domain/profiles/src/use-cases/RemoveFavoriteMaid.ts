/**
 * RemoveFavoriteMaid Use Case
 *
 * Removes a maid from a sponsor's favorites list.
 *
 * Business Rules:
 * - Sponsor profile must exist
 * - Maid must be in favorites to remove
 */

import { VoidUseCase, Result } from '@ethio/domain-shared';
import { SponsorProfileRepository } from '../repositories/SponsorProfileRepository.js';
import { RemoveFavoriteMaidDTO } from '../dtos/SponsorProfileDTOs.js';

export class RemoveFavoriteMaidUseCase implements VoidUseCase<RemoveFavoriteMaidDTO> {
  constructor(private readonly sponsorProfileRepository: SponsorProfileRepository) {}

  async execute(request: RemoveFavoriteMaidDTO): Promise<Result<void>> {
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

      // Check if maid is in favorites
      const favorites = await this.sponsorProfileRepository.getFavoriteMaidIds(request.sponsorId);
      if (!favorites.includes(request.maidId)) {
        return Result.fail('Maid is not in favorites');
      }

      // Remove from favorites
      await this.sponsorProfileRepository.removeFavorite(request.sponsorId, request.maidId);

      return Result.ok();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to remove favorite maid: ${message}`);
    }
  }
}
