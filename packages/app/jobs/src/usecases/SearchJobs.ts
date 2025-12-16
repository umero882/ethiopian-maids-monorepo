/**
 * SearchJobs Use Case (Query)
 *
 * Search and filter job postings.
 */

import type { JobRepository, JobSearchFilters } from '../ports/JobRepository.js';
import type { PaginationParams } from '../ports/ApplicationRepository.js';

export interface SearchJobsQuery {
  skills?: string[];
  languages?: string[];
  countries?: string[];
  cities?: string[];
  accommodationType?: string;
  minSalary?: string | number;
  maxSalary?: string | number;
  currency?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchJobsResult {
  jobs: Array<ReturnType<import('@ethio/domain-jobs').JobPosting['toJSON']>>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchJobsDependencies {
  jobRepository: JobRepository;
}

export class SearchJobs {
  private jobRepository: JobRepository;

  constructor({ jobRepository }: SearchJobsDependencies) {
    this.jobRepository = jobRepository;
  }

  async execute(query: SearchJobsQuery): Promise<SearchJobsResult> {
    // 1. Build filters
    const filters: JobSearchFilters = {
      skills: query.skills || [],
      languages: query.languages || [],
      countries: query.countries || [],
      cities: query.cities || [],
      accommodationType: query.accommodationType,
      minSalary: query.minSalary ? parseFloat(String(query.minSalary)) : null,
      maxSalary: query.maxSalary ? parseFloat(String(query.maxSalary)) : null,
      currency: query.currency || 'AED',
      status: query.status || 'open', // Default to open jobs
    };

    // 2. Build pagination
    const pagination: PaginationParams = {
      page: Math.max(1, query.page || 1),
      limit: Math.min(100, Math.max(1, query.limit || 20)),
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // 3. Execute search
    const result = await this.jobRepository.search(filters, pagination);

    // 4. Return results
    return {
      jobs: result.jobs.map(job => job.toJSON()),
      total: result.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(result.total / pagination.limit),
    };
  }
}
