/**
 * SearchMaidProfiles Use Case
 *
 * Searches for maid profiles based on criteria.
 *
 * Business Rules:
 * - Returns empty array if no matches found
 * - Results are paginated
 * - Filters are optional
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { MaidProfile } from '../entities/MaidProfile.js';
import { MaidProfileRepository, MaidProfileSearchCriteria } from '../repositories/MaidProfileRepository.js';
import { SearchMaidProfilesDTO } from '../dtos/MaidProfileDTOs.js';

export class SearchMaidProfilesUseCase implements UseCase<SearchMaidProfilesDTO, MaidProfile[]> {
  constructor(private readonly maidProfileRepository: MaidProfileRepository) {}

  async execute(request: SearchMaidProfilesDTO): Promise<Result<MaidProfile[]>> {
    try {
      const criteria: MaidProfileSearchCriteria = {
        nationality: request.nationality,
        skills: request.skills,
        languages: request.languages,
        experienceYears: request.experienceYears,
        availabilityStatus: request.availabilityStatus,
        agencyId: request.agencyId,
        limit: request.limit || 20,
        offset: request.offset || 0,
      };

      const profiles = await this.maidProfileRepository.search(criteria);

      return Result.ok(profiles);
    } catch (error) {
      return Result.fail(`Failed to search maid profiles: ${error.message}`);
    }
  }
}
