/**
 * GetApplicationsByMaid Use Case
 *
 * Retrieves all applications submitted by a specific maid.
 *
 * Business Rules:
 * - Can filter by status
 * - Supports pagination
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobApplication } from '../entities/JobApplication.js';
import { JobApplicationRepository } from '../repositories/JobApplicationRepository.js';
import { GetApplicationsByMaidDTO } from '../dtos/JobApplicationDTOs.js';

export class GetApplicationsByMaidUseCase implements UseCase<GetApplicationsByMaidDTO, JobApplication[]> {
  constructor(private readonly jobApplicationRepository: JobApplicationRepository) {}

  async execute(request: GetApplicationsByMaidDTO): Promise<Result<JobApplication[]>> {
    try {
      // Validate input
      if (!request.maidId || request.maidId.trim() === '') {
        return Result.fail('Maid ID is required');
      }

      // Get applications
      const applications = await this.jobApplicationRepository.findByMaidId(
        request.maidId,
        request.status
      );

      // Apply pagination if provided
      const limit = request.limit || applications.length;
      const offset = request.offset || 0;
      const paginatedApplications = applications.slice(offset, offset + limit);

      return Result.ok(paginatedApplications);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to get applications: ${message}`);
    }
  }
}
