/**
 * ShortlistJobApplication Use Case
 *
 * Adds an application to the shortlist.
 *
 * Business Rules:
 * - Application must exist
 * - Application must be in pending or reviewed status
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobApplication } from '../entities/JobApplication.js';
import { JobApplicationRepository } from '../repositories/JobApplicationRepository.js';
import { ShortlistJobApplicationDTO } from '../dtos/JobApplicationDTOs.js';

export class ShortlistJobApplicationUseCase
  implements UseCase<ShortlistJobApplicationDTO, JobApplication>
{
  constructor(private readonly jobApplicationRepository: JobApplicationRepository) {}

  async execute(request: ShortlistJobApplicationDTO): Promise<Result<JobApplication>> {
    try {
      // Load application
      const application = await this.jobApplicationRepository.findById(request.applicationId);
      if (!application) {
        return Result.fail(`Job application '${request.applicationId}' not found`);
      }

      // Shortlist application (entity enforces business rules)
      try {
        application.shortlist(application.sponsorId, request.notes || null);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return Result.fail(msg);
      }

      // Save changes
      await this.jobApplicationRepository.save(application);

      return Result.ok(application);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to shortlist application: ${message}`);
    }
  }
}
