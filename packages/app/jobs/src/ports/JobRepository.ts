/**
 * JobRepository Port (Interface)
 *
 * Defines the contract for job posting data access.
 */

import type { JobPosting } from '@ethio/domain-jobs';
import type { PaginationParams, PaginatedResult } from './ApplicationRepository.js';

export interface JobSearchFilters {
  skills?: string[];
  languages?: string[];
  countries?: string[];
  cities?: string[];
  accommodationType?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string;
  status?: string;
}

export interface JobSearchResult {
  jobs: JobPosting[];
  total: number;
}

export abstract class JobRepository {
  abstract findById(id: string): Promise<JobPosting | null>;

  abstract findBySponsorId(
    sponsorId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<JobPosting>>;

  abstract search(
    filters: JobSearchFilters,
    pagination: PaginationParams
  ): Promise<JobSearchResult>;

  abstract save(jobPosting: JobPosting): Promise<void>;

  abstract delete(id: string): Promise<void>;

  abstract findExpiredJobs(): Promise<JobPosting[]>;
}
