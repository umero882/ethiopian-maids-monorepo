/**
 * AcceptJobApplication Use Case
 *
 * Accepts a job application, marking it as the chosen candidate.
 *
 * Business Rules:
 * - Application must exist
 * - Application must be shortlisted
 * - Cannot accept withdrawn or rejected applications
 * - Only one application can be accepted per job
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobApplication } from '../entities/JobApplication.js';
import { JobApplicationRepository } from '../repositories/JobApplicationRepository.js';
import { JobPostingRepository } from '../repositories/JobPostingRepository.js';
import { AcceptJobApplicationDTO } from '../dtos/JobApplicationDTOs.js';

export class AcceptJobApplicationUseCase implements UseCase<AcceptJobApplicationDTO, JobApplication> {
  constructor(
    private readonly jobApplicationRepository: JobApplicationRepository,
    private readonly jobPostingRepository: JobPostingRepository
  ) {}

  async execute(request: AcceptJobApplicationDTO): Promise<Result<JobApplication>> {
    try {
      // Load application
      const application = await this.jobApplicationRepository.findById(request.applicationId);
      if (!application) {
        return Result.fail(`Application '${request.applicationId}' not found`);
      }

      // Check if another application is already accepted for this job
      const existingAccepted = await this.jobApplicationRepository.findByJobId(
        application.jobId,
        'accepted'
      );
      if (existingAccepted.length > 0) {
        return Result.fail('Another application has already been accepted for this job');
      }

      // Accept application (entity enforces business rules)
      try {
        application.accept(request.notes);
      } catch (error) {
        return Result.fail(error.message);
      }

      // Save changes
      await this.jobApplicationRepository.save(application);

      // Close the job posting
      const jobPosting = await this.jobPostingRepository.findById(application.jobId);
      if (jobPosting) {
        try {
          jobPosting.close('Position filled');
          await this.jobPostingRepository.save(jobPosting);
        } catch (error) {
          // Log error but don't fail the operation
          console.warn('Failed to close job posting:', error.message);
        }
      }

      return Result.ok(application);
    } catch (error) {
      return Result.fail(`Failed to accept application: ${error.message}`);
    }
  }
}
