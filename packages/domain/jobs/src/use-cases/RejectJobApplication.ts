/**
 * RejectJobApplication Use Case
 *
 * Rejects a job application.
 *
 * Business Rules:
 * - Application must exist
 * - Application must be in pending, reviewed, or shortlisted status
 * - Rejection reason is required
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobApplication } from '../entities/JobApplication.js';
import { JobApplicationRepository } from '../repositories/JobApplicationRepository.js';
import { RejectJobApplicationDTO } from '../dtos/JobApplicationDTOs.js';

export class RejectJobApplicationUseCase
  implements UseCase<RejectJobApplicationDTO, JobApplication>
{
  constructor(private readonly jobApplicationRepository: JobApplicationRepository) {}

  async execute(request: RejectJobApplicationDTO): Promise<Result<JobApplication>> {
    try {
      // Validate rejection reason
      if (!request.reason || request.reason.trim() === '') {
        return Result.fail('Rejection reason is required');
      }

      // Load application
      const application = await this.jobApplicationRepository.findById(request.applicationId);
      if (!application) {
        return Result.fail(`Job application '${request.applicationId}' not found`);
      }

      // Reject application (entity enforces business rules)
      try {
        application.reject(application.sponsorId, request.reason);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return Result.fail(msg);
      }

      // Save changes
      await this.jobApplicationRepository.save(application);

      return Result.ok(application);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to reject application: ${message}`);
    }
  }
}
