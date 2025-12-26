/**
 * SubmitJobApplication Use Case
 *
 * Submits a job application from a maid to a job posting.
 *
 * Business Rules:
 * - Job must exist and be published
 * - Maid must not have already applied to this job
 * - Job must not have reached max applications
 * - Job must not be expired
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobApplication, JobApplicationProps } from '../entities/JobApplication.js';
import { JobApplicationRepository } from '../repositories/JobApplicationRepository.js';
import { JobPostingRepository } from '../repositories/JobPostingRepository.js';
import { SubmitJobApplicationDTO } from '../dtos/JobApplicationDTOs.js';
import type { SalaryProps } from '../value-objects/Salary.js';

export class SubmitJobApplicationUseCase
  implements UseCase<SubmitJobApplicationDTO, JobApplication>
{
  constructor(
    private readonly jobApplicationRepository: JobApplicationRepository,
    private readonly jobPostingRepository: JobPostingRepository
  ) {}

  async execute(request: SubmitJobApplicationDTO): Promise<Result<JobApplication>> {
    try {
      // Validate input
      const validationResult = this.validate(request);
      if (validationResult.isFailure) {
        return Result.fail<JobApplication>(validationResult.error!);
      }

      // Load job posting
      const jobPosting = await this.jobPostingRepository.findById(request.jobId);
      if (!jobPosting) {
        return Result.fail(`Job posting '${request.jobId}' not found`);
      }

      // Check if job is published (open)
      if (!jobPosting.status.isOpen()) {
        return Result.fail('Cannot apply to unpublished job');
      }

      // Check if job is expired
      if (jobPosting.isExpired()) {
        return Result.fail('Cannot apply to expired job');
      }

      // Check if job has reached max applications
      if (jobPosting.applicationCount >= jobPosting.maxApplications) {
        return Result.fail('Job has reached maximum applications');
      }

      // Check if maid has already applied
      const hasApplied = await this.jobApplicationRepository.hasApplied(
        request.jobId,
        request.maidId
      );
      if (hasApplied) {
        return Result.fail('You have already applied to this job');
      }

      // Create proposed salary if provided (convert currency string to CurrencyType)
      let proposedSalary: SalaryProps | null = null;
      if (request.expectedSalary) {
        proposedSalary = {
          amount: request.expectedSalary.amount,
          currency: request.expectedSalary.currency as 'AED' | 'SAR' | 'USD' | 'EUR' | 'GBP' | 'KWD' | 'QAR' | 'BHD' | 'OMR',
          period: request.expectedSalary.period,
        };
      }

      // Create application entity
      const applicationProps: JobApplicationProps = {
        id: crypto.randomUUID(),
        jobId: request.jobId,
        maidId: request.maidId,
        sponsorId: jobPosting.sponsorId,
        status: 'pending',
        coverLetter: request.coverLetter,
        proposedSalary,
        availableFrom: request.availableFrom,
        appliedAt: new Date(),
        updatedAt: new Date(),
      };

      const application = new JobApplication(applicationProps);

      // Increment application count on job
      jobPosting.recordApplication();

      // Save both
      await this.jobApplicationRepository.save(application);
      await this.jobPostingRepository.save(jobPosting);

      return Result.ok(application);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to submit application: ${message}`);
    }
  }

  private validate(request: SubmitJobApplicationDTO): Result<void> {
    const errors: Record<string, string[]> = {};

    if (!request.jobId || request.jobId.trim() === '') {
      errors.jobId = ['Job ID is required'];
    }
    if (!request.maidId || request.maidId.trim() === '') {
      errors.maidId = ['Maid ID is required'];
    }

    if (Object.keys(errors).length > 0) {
      return Result.fail(JSON.stringify(errors));
    }
    return Result.ok();
  }
}
