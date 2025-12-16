/**
 * JobApplication Repository Interface
 *
 * Defines the contract for persisting and retrieving job applications.
 * Infrastructure layer will implement this interface using GraphQL, REST, etc.
 */

import { JobApplication } from '../entities/JobApplication.js';

export interface JobApplicationSearchCriteria {
  jobId?: string;
  maidId?: string;
  sponsorId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface JobApplicationRepository {
  /**
   * Find an application by its ID
   */
  findById(id: string): Promise<JobApplication | null>;

  /**
   * Search applications with optional filters
   */
  search(criteria: JobApplicationSearchCriteria): Promise<JobApplication[]>;

  /**
   * Get all applications for a specific job
   */
  findByJobId(jobId: string, status?: string): Promise<JobApplication[]>;

  /**
   * Get all applications submitted by a specific maid
   */
  findByMaidId(maidId: string, status?: string): Promise<JobApplication[]>;

  /**
   * Get all applications for jobs posted by a specific sponsor
   */
  findBySponsorId(sponsorId: string, status?: string): Promise<JobApplication[]>;

  /**
   * Check if a maid has already applied to a job
   */
  hasApplied(jobId: string, maidId: string): Promise<boolean>;

  /**
   * Save or update an application
   */
  save(application: JobApplication): Promise<void>;

  /**
   * Delete an application
   */
  delete(id: string): Promise<void>;

  /**
   * Count applications matching criteria
   */
  count(criteria?: JobApplicationSearchCriteria): Promise<number>;

  /**
   * Get shortlisted applications for a job
   */
  findShortlistedByJobId(jobId: string): Promise<JobApplication[]>;

  /**
   * Get accepted applications for a maid
   */
  findAcceptedByMaidId(maidId: string): Promise<JobApplication[]>;
}
