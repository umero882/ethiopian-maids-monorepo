/**
 * JobPosting Repository Interface
 *
 * Defines the contract for persisting and retrieving job postings.
 * Infrastructure layer will implement this interface using GraphQL, REST, etc.
 */

import { JobPosting } from '../entities/JobPosting.js';

export interface JobPostingSearchCriteria {
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

export interface JobPostingRepository {
  /**
   * Find a job posting by its ID
   */
  findById(id: string): Promise<JobPosting | null>;

  /**
   * Search job postings with optional filters
   */
  search(criteria: JobPostingSearchCriteria): Promise<JobPosting[]>;

  /**
   * Get all job postings for a specific sponsor
   */
  findBySponsorId(sponsorId: string): Promise<JobPosting[]>;

  /**
   * Get all active (published and not expired) job postings
   */
  findActive(): Promise<JobPosting[]>;

  /**
   * Get job postings that have expired
   */
  findExpired(): Promise<JobPosting[]>;

  /**
   * Save or update a job posting
   */
  save(jobPosting: JobPosting): Promise<void>;

  /**
   * Delete a job posting
   */
  delete(id: string): Promise<void>;

  /**
   * Count job postings matching criteria
   */
  count(criteria?: JobPostingSearchCriteria): Promise<number>;

  /**
   * Find job postings that match a maid's profile
   */
  findMatchingJobs(
    maidSkills: string[],
    maidLanguages: string[],
    maidNationality: string,
    limit?: number
  ): Promise<JobPosting[]>;
}
