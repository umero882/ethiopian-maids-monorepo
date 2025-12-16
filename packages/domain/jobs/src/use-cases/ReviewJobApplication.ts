/**
 * ReviewJobApplication Use Case
 *
 * Marks an application as reviewed by the sponsor.
 *
 * Business Rules:
 * - Application must exist
 * - Application must be in pending status
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobApplication } from '../entities/JobApplication.js';
import { JobApplicationRepository } from '../repositories/JobApplicationRepository.js';
import { ReviewJobApplicationDTO } from '../dtos/JobApplicationDTOs.js';

export class ReviewJobApplicationUseCase
  implements UseCase<ReviewJobApplicationDTO, JobApplication>
{
  constructor(private readonly jobApplicationRepository: JobApplicationRepository) {}

  async execute(request: ReviewJobApplicationDTO): Promise<Result<JobApplication>> {
    try {
      // Load application
      const application = await this.jobApplicationRepository.findById(request.applicationId);
      if (!application) {
        return Result.fail(`Job application '${request.applicationId}' not found`);
      }

      // Review application (entity enforces business rules)
      try {
        application.review(request.reviewNotes);
      } catch (error) {
        return Result.fail(error.message);
      }

      // Save changes
      await this.jobApplicationRepository.save(application);

      return Result.ok(application);
    } catch (error) {
      return Result.fail(`Failed to review application: ${error.message}`);
    }
  }
}
