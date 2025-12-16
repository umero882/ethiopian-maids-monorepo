/**
 * GetApplicationsByJob Use Case
 *
 * Retrieves all applications for a specific job posting.
 *
 * Business Rules:
 * - Job must exist
 * - Can filter by status
 * - Supports pagination
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobApplication } from '../entities/JobApplication.js';
import { JobApplicationRepository } from '../repositories/JobApplicationRepository.js';
import { JobPostingRepository } from '../repositories/JobPostingRepository.js';
import { GetApplicationsByJobDTO } from '../dtos/JobApplicationDTOs.js';

export class GetApplicationsByJobUseCase implements UseCase<GetApplicationsByJobDTO, JobApplication[]> {
  constructor(
    private readonly jobApplicationRepository: JobApplicationRepository,
    private readonly jobPostingRepository: JobPostingRepository
  ) {}

  async execute(request: GetApplicationsByJobDTO): Promise<Result<JobApplication[]>> {
    try {
      // Validate input
      if (!request.jobId || request.jobId.trim() === '') {
        return Result.fail('Job ID is required');
      }

      // Check if job exists
      const jobPosting = await this.jobPostingRepository.findById(request.jobId);
      if (!jobPosting) {
        return Result.fail(`Job posting '${request.jobId}' not found`);
      }

      // Get applications
      const applications = await this.jobApplicationRepository.findByJobId(
        request.jobId,
        request.status
      );

      // Apply pagination if provided
      const limit = request.limit || applications.length;
      const offset = request.offset || 0;
      const paginatedApplications = applications.slice(offset, offset + limit);

      return Result.ok(paginatedApplications);
    } catch (error) {
      return Result.fail(`Failed to get applications: ${error.message}`);
    }
  }
}
