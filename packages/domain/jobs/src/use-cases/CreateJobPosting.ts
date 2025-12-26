/**
 * CreateJobPosting Use Case
 *
 * Creates a new job posting.
 *
 * Business Rules:
 * - Sponsor ID must be valid
 * - Title is required
 * - Location (country and city) is required
 * - Salary information is required
 */

import { UseCase, Result } from '@ethio/domain-shared';
import { JobPosting, JobPostingProps } from '../entities/JobPosting.js';
import { JobPostingRepository } from '../repositories/JobPostingRepository.js';
import { CreateJobPostingDTO } from '../dtos/JobPostingDTOs.js';
import { Salary } from '../value-objects/Salary.js';

export class CreateJobPostingUseCase implements UseCase<CreateJobPostingDTO, JobPosting> {
  constructor(private readonly jobPostingRepository: JobPostingRepository) {}

  async execute(request: CreateJobPostingDTO): Promise<Result<JobPosting>> {
    try {
      // Validate input
      const validationResult = this.validate(request);
      if (validationResult.isFailure) {
        return Result.fail<JobPosting>(validationResult.error!);
      }

      // Create salary value object (cast currency string to CurrencyType)
      const salary = new Salary({
        amount: request.salary.amount,
        currency: request.salary.currency as 'AED' | 'SAR' | 'USD' | 'EUR' | 'GBP' | 'KWD' | 'QAR' | 'BHD' | 'OMR',
        period: request.salary.period,
      });

      // Convert expiresAt to Date if string
      const expiresAt = request.expiresAt
        ? (typeof request.expiresAt === 'string' ? new Date(request.expiresAt) : request.expiresAt)
        : null;

      // Create job posting entity
      const jobProps: JobPostingProps = {
        id: crypto.randomUUID(),
        sponsorId: request.sponsorId,
        title: request.title,
        description: request.description || '',
        requiredSkills: request.requiredSkills || [],
        requiredLanguages: request.requiredLanguages || [],
        experienceYears: request.experienceYears || 0,
        preferredNationality: request.preferredNationality || null,
        location: request.location,
        contractDuration: request.contractDuration || null,
        startDate: request.startDate || null,
        salary,
        benefits: request.benefits || [],
        workingHours: request.workingHours || null,
        daysOff: request.daysOff || null,
        accommodationType: request.accommodationType || null,
        status: 'draft',
        applicationCount: 0,
        maxApplications: request.maxApplications || 100,
        viewCount: 0,
        postedAt: null,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const jobPosting = new JobPosting(jobProps);

      // Save to repository
      await this.jobPostingRepository.save(jobPosting);

      return Result.ok(jobPosting);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.fail(`Failed to create job posting: ${message}`);
    }
  }

  private validate(request: CreateJobPostingDTO): Result<void> {
    const errors: Record<string, string[]> = {};

    if (!request.sponsorId || request.sponsorId.trim() === '') {
      errors.sponsorId = ['Sponsor ID is required'];
    }
    if (!request.title || request.title.trim() === '') {
      errors.title = ['Title is required'];
    }
    if (!request.location || !request.location.country || !request.location.city) {
      errors.location = ['Location (country and city) is required'];
    }
    if (!request.salary || !request.salary.amount || !request.salary.currency) {
      errors.salary = ['Salary information is required'];
    }

    if (Object.keys(errors).length > 0) {
      return Result.fail(JSON.stringify(errors));
    }
    return Result.ok();
  }
}
