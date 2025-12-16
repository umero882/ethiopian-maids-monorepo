/**
 * GetJobPosting Use Case
 *
 * Retrieves a job posting by ID and increments view count.
 *
 * Business Rules:
 * - Job must exist
 * - View count is incremented on each retrieval
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobPosting } from '../entities/JobPosting.js';
import { JobPostingRepository } from '../repositories/JobPostingRepository.js';

export interface GetJobPostingRequest {
  jobId: string;
  incrementViewCount?: boolean;
}

export class GetJobPostingUseCase implements UseCase<GetJobPostingRequest, JobPosting> {
  constructor(private readonly jobPostingRepository: JobPostingRepository) {}

  async execute(request: GetJobPostingRequest): Promise<Result<JobPosting>> {
    try {
      // Validate input
      if (!request.jobId || request.jobId.trim() === '') {
        return Result.fail('Job ID is required');
      }

      // Load job posting
      const jobPosting = await this.jobPostingRepository.findById(request.jobId);
      if (!jobPosting) {
        return Result.fail(`Job posting '${request.jobId}' not found`);
      }

      // Increment view count if requested (default: true)
      if (request.incrementViewCount !== false) {
        jobPosting.incrementViewCount();
        await this.jobPostingRepository.save(jobPosting);
      }

      return Result.ok(jobPosting);
    } catch (error) {
      return Result.fail(`Failed to get job posting: ${error.message}`);
    }
  }
}
