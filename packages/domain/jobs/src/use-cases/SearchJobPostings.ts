/**
 * SearchJobPostings Use Case
 *
 * Searches for job postings with optional filters.
 *
 * Business Rules:
 * - Returns empty array if no matches
 * - Supports pagination
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobPosting } from '../entities/JobPosting.js';
import { JobPostingRepository } from '../repositories/JobPostingRepository.js';
import { SearchJobPostingsDTO } from '../dtos/JobPostingDTOs.js';

export class SearchJobPostingsUseCase implements UseCase<SearchJobPostingsDTO, JobPosting[]> {
  constructor(private readonly jobPostingRepository: JobPostingRepository) {}

  async execute(request: SearchJobPostingsDTO): Promise<Result<JobPosting[]>> {
    try {
      // Search with criteria
      const jobPostings = await this.jobPostingRepository.search({
        sponsorId: request.sponsorId,
        location: request.location,
        requiredSkills: request.requiredSkills,
        requiredLanguages: request.requiredLanguages,
        minSalary: request.minSalary,
        maxSalary: request.maxSalary,
        status: request.status,
        preferredNationality: request.preferredNationality,
        limit: request.limit || 50,
        offset: request.offset || 0,
      });

      return Result.ok(jobPostings);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to search job postings: ${message}`);
    }
  }
}
