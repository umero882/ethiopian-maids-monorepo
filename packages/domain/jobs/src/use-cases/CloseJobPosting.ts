/**
 * CloseJobPosting Use Case
 *
 * Closes a job posting, stopping new applications.
 *
 * Business Rules:
 * - Job must exist
 * - Job must be in published status
 * - Cannot close draft or already closed jobs
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobPosting } from '../entities/JobPosting.js';
import { JobPostingRepository } from '../repositories/JobPostingRepository.js';
import { CloseJobPostingDTO } from '../dtos/JobPostingDTOs.js';

export class CloseJobPostingUseCase implements UseCase<CloseJobPostingDTO, JobPosting> {
  constructor(private readonly jobPostingRepository: JobPostingRepository) {}

  async execute(request: CloseJobPostingDTO): Promise<Result<JobPosting>> {
    try {
      // Load job posting
      const jobPosting = await this.jobPostingRepository.findById(request.jobId);
      if (!jobPosting) {
        return Result.fail(`Job posting '${request.jobId}' not found`);
      }

      // Close job (entity enforces business rules)
      try {
        jobPosting.close(request.reason);
      } catch (error) {
        return Result.fail(error.message);
      }

      // Save changes
      await this.jobPostingRepository.save(jobPosting);

      return Result.ok(jobPosting);
    } catch (error) {
      return Result.fail(`Failed to close job posting: ${error.message}`);
    }
  }
}
