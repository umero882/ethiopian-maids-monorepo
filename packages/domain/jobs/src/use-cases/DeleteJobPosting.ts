/**
 * DeleteJobPosting Use Case
 *
 * Permanently deletes a job posting.
 *
 * Business Rules:
 * - Job must exist
 * - Job must be in draft status
 * - Cannot delete published or closed jobs (must close first)
 * - Deletion is permanent and cannot be undone
 */

import { VoidUseCase, Result } from '@ethio/domain-shared';
import { JobPostingRepository } from '../repositories/JobPostingRepository.js';
import { DeleteJobPostingDTO } from '../dtos/JobPostingDTOs.js';

export class DeleteJobPostingUseCase implements VoidUseCase<DeleteJobPostingDTO> {
  constructor(private readonly jobPostingRepository: JobPostingRepository) {}

  async execute(request: DeleteJobPostingDTO): Promise<Result<void>> {
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

      // Check if job can be deleted
      if (!jobPosting.status.isDraft()) {
        return Result.fail('Can only delete jobs in draft status. Close published jobs instead.');
      }

      // Delete job posting
      await this.jobPostingRepository.delete(request.jobId);

      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete job posting: ${error.message}`);
    }
  }
}
