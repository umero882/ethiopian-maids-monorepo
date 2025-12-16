/**
 * Job Posting DTOs (Data Transfer Objects)
 *
 * These objects define the shape of data going in and out of job posting use cases.
 * They are plain objects without business logic.
 */

export interface CreateJobPostingDTO {
  sponsorId: string;
  title: string;
  description?: string;
  requiredSkills?: string[];
  requiredLanguages?: string[];
  experienceYears?: number;
  preferredNationality?: string;
  location: {
    country: string;
    city: string;
  };
  contractDuration?: number;
  startDate?: Date | string;
  salary: {
    amount: number;
    currency: string;
    period: 'monthly' | 'yearly';
  };
  benefits?: string[];
  workingHours?: string;
  daysOff?: string;
  accommodationType?: string;
  maxApplications?: number;
  expiresAt?: Date | string;
}

export interface UpdateJobDetailsDTO {
  jobId: string;
  title?: string;
  description?: string;
  requiredSkills?: string[];
  requiredLanguages?: string[];
  experienceYears?: number;
  preferredNationality?: string;
  workingHours?: string;
  daysOff?: string;
  accommodationType?: string;
}

export interface UpdateJobCompensationDTO {
  jobId: string;
  salary?: {
    amount: number;
    currency: string;
    period: 'monthly' | 'yearly';
  };
  benefits?: string[];
}

export interface SearchJobPostingsDTO {
  sponsorId?: string;
  location?: {
    country?: string;
    city?: string;
  };
  requiredSkills?: string[];
  requiredLanguages?: string[];
  minSalary?: number;
  maxSalary?: number;
  status?: string;
  preferredNationality?: string;
  limit?: number;
  offset?: number;
}

export interface PublishJobPostingDTO {
  jobId: string;
}

export interface CloseJobPostingDTO {
  jobId: string;
  reason?: string;
}

export interface ArchiveJobPostingDTO {
  jobId: string;
}

export interface DeleteJobPostingDTO {
  jobId: string;
}

export interface MatchMaidsToJobDTO {
  jobId: string;
  minMatchScore?: number;
  limit?: number;
}
