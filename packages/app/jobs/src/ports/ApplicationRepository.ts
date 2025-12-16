/**
 * ApplicationRepository Port (Interface)
 *
 * Defines the contract for job application data access.
 */

import type { JobApplication } from '@ethio/domain-jobs';

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export abstract class ApplicationRepository {
  abstract findById(id: string): Promise<JobApplication | null>;

  abstract findByJobId(
    jobId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<JobApplication>>;

  abstract findByMaidId(
    maidId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<JobApplication>>;

  abstract findBySponsorId(
    sponsorId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResult<JobApplication>>;

  abstract save(application: JobApplication): Promise<void>;

  abstract delete(id: string): Promise<void>;

  abstract countActiveApplicationsByMaid(maidId: string): Promise<number>;

  abstract existsForMaidAndJob(maidId: string, jobId: string): Promise<boolean>;
}
