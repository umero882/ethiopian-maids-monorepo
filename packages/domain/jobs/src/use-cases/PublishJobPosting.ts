/**
 * PublishJobPosting Use Case
 *
 * Publishes a job posting, making it visible to maids.
 *
 * Business Rules:
 * - Job must exist
 * - Job must be in draft status
 * - Job must have all required fields filled
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobPosting } from '../entities/JobPosting.js';
import { JobPostingRepository } from '../repositories/JobPostingRepository.js';
import { PublishJobPostingDTO } from '../dtos/JobPostingDTOs.js';

export class PublishJobPostingUseCase implements UseCase<PublishJobPostingDTO, JobPosting> {
  constructor(private readonly jobPostingRepository: JobPostingRepository) {}

  async execute(request: PublishJobPostingDTO): Promise<Result<JobPosting>> {
    try {
      // Load job posting
      const jobPosting = await this.jobPostingRepository.findById(request.jobId);
      if (!jobPosting) {
        return Result.fail(`Job posting '${request.jobId}' not found`);
      }

      // Publish job (entity enforces business rules)
      try {
        jobPosting.publish();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return Result.fail(msg);
      }

      // Save changes
      await this.jobPostingRepository.save(jobPosting);

      return Result.ok(jobPosting);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to publish job posting: ${message}`);
    }
  }
}
