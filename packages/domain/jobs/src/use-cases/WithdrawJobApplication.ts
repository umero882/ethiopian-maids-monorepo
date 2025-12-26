/**
 * WithdrawJobApplication Use Case
 *
 * Withdraws a job application.
 *
 * Business Rules:
 * - Application must exist
 * - Application must be in pending or reviewed status
 * - Cannot withdraw accepted, rejected, or already withdrawn applications
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobApplication } from '../entities/JobApplication.js';
import { JobApplicationRepository } from '../repositories/JobApplicationRepository.js';
import { WithdrawJobApplicationDTO } from '../dtos/JobApplicationDTOs.js';

export class WithdrawJobApplicationUseCase
  implements UseCase<WithdrawJobApplicationDTO, JobApplication>
{
  constructor(private readonly jobApplicationRepository: JobApplicationRepository) {}

  async execute(request: WithdrawJobApplicationDTO): Promise<Result<JobApplication>> {
    try {
      // Load application
      const application = await this.jobApplicationRepository.findById(request.applicationId);
      if (!application) {
        return Result.fail(`Job application '${request.applicationId}' not found`);
      }

      // Withdraw application (entity enforces business rules)
      try {
        application.withdraw(application.maidId, request.reason || 'Withdrawn by applicant');
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return Result.fail(msg);
      }

      // Save changes
      await this.jobApplicationRepository.save(application);

      return Result.ok(application);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to withdraw application: ${message}`);
    }
  }
}
