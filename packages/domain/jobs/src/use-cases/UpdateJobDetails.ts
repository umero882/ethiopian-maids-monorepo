/**
 * UpdateJobDetails Use Case
 *
 * Updates job posting details (title, description, requirements, etc.).
 *
 * Business Rules:
 * - Job must exist
 * - Job must be in draft or published status (not closed or expired)
 * - At least one field must be updated
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobPosting } from '../entities/JobPosting.js';
import { JobPostingRepository } from '../repositories/JobPostingRepository.js';
import { UpdateJobDetailsDTO } from '../dtos/JobPostingDTOs.js';

export class UpdateJobDetailsUseCase implements UseCase<UpdateJobDetailsDTO, JobPosting> {
  constructor(private readonly jobPostingRepository: JobPostingRepository) {}

  async execute(request: UpdateJobDetailsDTO): Promise<Result<JobPosting>> {
    try {
      // Validate at least one field is being updated
      const hasUpdate =
        request.title !== undefined ||
        request.description !== undefined ||
        request.requiredSkills !== undefined ||
        request.requiredLanguages !== undefined ||
        request.experienceYears !== undefined ||
        request.preferredNationality !== undefined ||
        request.workingHours !== undefined ||
        request.daysOff !== undefined ||
        request.accommodationType !== undefined;

      if (!hasUpdate) {
        return Result.fail('At least one field must be updated');
      }

      // Load job posting
      const jobPosting = await this.jobPostingRepository.findById(request.jobId);
      if (!jobPosting) {
        return Result.fail(`Job posting '${request.jobId}' not found`);
      }

      // Check if job can be updated
      if (jobPosting.status.isClosed() || jobPosting.isExpired()) {
        return Result.fail('Cannot update closed or expired job posting');
      }

      // Update details using entity method
      jobPosting.updateDetails({
        title: request.title,
        description: request.description,
        requiredSkills: request.requiredSkills,
        requiredLanguages: request.requiredLanguages,
        experienceYears: request.experienceYears,
      });

      // Update additional fields
      if (request.preferredNationality !== undefined) {
        jobPosting.preferredNationality = request.preferredNationality;
      }
      if (request.workingHours !== undefined) {
        jobPosting.workingHours = request.workingHours;
      }
      if (request.daysOff !== undefined) {
        jobPosting.daysOff = request.daysOff;
      }
      if (request.accommodationType !== undefined) {
        jobPosting.accommodationType = request.accommodationType;
      }

      jobPosting.updatedAt = new Date();

      // Save changes
      await this.jobPostingRepository.save(jobPosting);

      return Result.ok(jobPosting);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to update job details: ${message}`);
    }
  }
}
