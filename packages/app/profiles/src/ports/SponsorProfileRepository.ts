/**
 * SponsorProfileRepository Port (Interface)
 *
 * Defines the contract for sponsor profile data access.
 * Implementations will be in the infrastructure layer.
 */

import type { SponsorProfile } from '@ethio/domain-profiles';

export interface Pagination {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SponsorSearchResult {
  profiles: SponsorProfile[];
  total: number;
}

export abstract class SponsorProfileRepository {
  /**
   * Find profile by ID
   */
  abstract findById(id: string): Promise<SponsorProfile | null>;

  /**
   * Find profile by user ID
   */
  abstract findByUserId(userId: string): Promise<SponsorProfile | null>;

  /**
   * Save (create or update) profile
   */
  abstract save(profile: SponsorProfile): Promise<boolean>;

  /**
   * Delete profile
   */
  abstract delete(id: string): Promise<boolean>;

  /**
   * Check if user already has a profile
   */
  abstract profileExists(userId: string): Promise<boolean>;

  /**
   * Get profiles by status
   */
  abstract findByStatus(status: string, pagination: Pagination): Promise<SponsorSearchResult>;

  /**
   * Get profiles by country
   */
  abstract findByCountry(country: string, pagination: Pagination): Promise<SponsorSearchResult>;
}
