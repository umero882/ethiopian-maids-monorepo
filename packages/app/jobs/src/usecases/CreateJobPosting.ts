/**
 * CreateJobPosting Use Case (Command)
 *
 * Creates a new job posting by a sponsor.
 */

import { JobPosting, JobPostingPolicies, type SalaryProps, type Location } from '@ethio/domain-jobs';
import type { JobRepository } from '../ports/JobRepository.js';

export interface CreateJobPostingCommand {
  sponsorId: string;
  title: string;
  description?: string;
  requiredSkills?: string[];
  requiredLanguages?: string[];
  experienceYears?: number;
  preferredNationality?: string;
  location: Location;
  contractDuration?: number;
  startDate?: Date | string;
  salary: SalaryProps;
  benefits?: string[];
  workingHours?: string;
  daysOff?: string;
  accommodationType?: string;
}

export interface CreateJobPostingResult {
  jobId: string;
  job: ReturnType<JobPosting['toJSON']>;
}

export interface EventBus {
  publish(event: unknown): Promise<void>;
}

export interface AuditLogger {
  logSecurityEvent(event: {
    action: string;
    userId: string;
    jobId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}

export interface CreateJobPostingDependencies {
  jobRepository: JobRepository;
  eventBus: EventBus;
  auditLogger: AuditLogger;
}

export class CreateJobPosting {
  private jobRepository: JobRepository;
  private eventBus: EventBus;
  private auditLogger: AuditLogger;

  constructor({ jobRepository, eventBus, auditLogger }: CreateJobPostingDependencies) {
    this.jobRepository = jobRepository;
    this.eventBus = eventBus;
    this.auditLogger = auditLogger;
  }

  async execute(command: CreateJobPostingCommand): Promise<CreateJobPostingResult> {
    // 1. Validate command
    this._validate(command);

    // 2. Validate business rules
    if (command.salary) {
      const salaryValidation = JobPostingPolicies.validateSalary(
        command.salary as any, // Will be converted to Salary in JobPosting constructor
        command.location?.country
      );
      if (!salaryValidation.valid) {
        throw new Error(salaryValidation.error);
      }
    }

    // 3. Create job entity
    const job = new JobPosting({
      id: this._generateId(),
      sponsorId: command.sponsorId,
      title: command.title,
      description: command.description,
      requiredSkills: command.requiredSkills || [],
      requiredLanguages: command.requiredLanguages || [],
      experienceYears: command.experienceYears || 0,
      preferredNationality: command.preferredNationality,
      location: command.location,
      contractDuration: command.contractDuration,
      startDate: command.startDate,
      salary: command.salary,
      benefits: command.benefits || [],
      workingHours: command.workingHours,
      daysOff: command.daysOff,
      accommodationType: command.accommodationType,
      status: 'draft',
    });

    // 4. Persist job
    await this.jobRepository.save(job);

    // 5. Publish domain events
    const events = job.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // 6. Log audit event
    await this.auditLogger.logSecurityEvent({
      action: 'JOB_POSTING_CREATED',
      userId: command.sponsorId,
      jobId: job.id,
      metadata: { title: job.title },
    });

    // 7. Return result
    return {
      jobId: job.id,
      job: job.toJSON(),
    };
  }

  private _validate(command: CreateJobPostingCommand): void {
    if (!command.sponsorId) throw new Error('sponsorId is required');
    if (!command.title) throw new Error('title is required');
  }

  private _generateId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
