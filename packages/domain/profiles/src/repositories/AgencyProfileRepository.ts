/**
 * AgencyProfileRepository Interface
 *
 * Defines the contract for agency profile data access.
 */

import { AgencyProfile } from '../entities/AgencyProfile.js';

export interface AgencyProfileSearchCriteria {
  country?: string;
  verifiedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface AgencyProfileRepository {
  /**
   * Find an agency profile by ID
   */
  findById(id: string): Promise<AgencyProfile | null>;

  /**
   * Find an agency profile by user ID
   */
  findByUserId(userId: string): Promise<AgencyProfile | null>;

  /**
   * Search agency profiles
   */
  search(criteria: AgencyProfileSearchCriteria): Promise<AgencyProfile[]>;

  /**
   * Save (create or update) an agency profile
   */
  save(profile: AgencyProfile): Promise<void>;

  /**
   * Delete an agency profile
   */
  delete(id: string): Promise<void>;

  /**
   * Get agency statistics
   */
  getStatistics(agencyId: string): Promise<{
    totalMaids: number;
    activeMaids: number;
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    successfulPlacements: number;
  }>;

  /**
   * Count total profiles
   */
  count(criteria?: AgencyProfileSearchCriteria): Promise<number>;
}
