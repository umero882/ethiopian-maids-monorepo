/**
 * GetAgencyStatistics Use Case
 *
 * Retrieves statistics for an agency (total maids, active maids, etc.).
 *
 * Business Rules:
 * - Agency profile must exist
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { AgencyProfileRepository } from '../repositories/AgencyProfileRepository.js';
import { GetAgencyStatisticsRequest, AgencyStatistics } from '../dtos/AgencyProfileDTOs.js';

export class GetAgencyStatisticsUseCase
  implements UseCase<GetAgencyStatisticsRequest, AgencyStatistics>
{
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(request: GetAgencyStatisticsRequest): Promise<Result<AgencyStatistics>> {
    try {
      // Validate input
      if (!request.agencyId || request.agencyId.trim() === '') {
        return Result.fail('Agency ID is required');
      }

      // Check if agency exists
      const agency = await this.agencyProfileRepository.findById(request.agencyId);
      if (!agency) {
        return Result.fail(`Agency profile '${request.agencyId}' not found`);
      }

      // Get statistics from repository
      const statistics = await this.agencyProfileRepository.getStatistics(request.agencyId);

      return Result.ok(statistics);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to get agency statistics: ${message}`);
    }
  }
}
