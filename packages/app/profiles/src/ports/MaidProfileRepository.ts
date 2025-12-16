/**
 * MaidProfileRepository Port (Interface)
 *
 * Defines the contract for maid profile data access.
 * Implementations will be in the infrastructure layer.
 */

import type { MaidProfile } from '@ethio/domain-profiles';

export interface SearchFilters {
  status?: string;
  nationality?: string;
  skills?: string[];
  languages?: string[];
  countries?: string[];
  minAge?: number;
  maxAge?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  profiles: MaidProfile[];
  total: number;
}

export abstract class MaidProfileRepository {
  /**
   * Find profile by ID
   */
  abstract findById(id: string): Promise<MaidProfile | null>;

  /**
   * Find profile by user ID
   */
  abstract findByUserId(userId: string): Promise<MaidProfile | null>;

  /**
   * Search profiles with filters
   */
  abstract search(filters: SearchFilters, pagination: Pagination): Promise<SearchResult>;

  /**
   * Save (create or update) profile
   */
  abstract save(profile: MaidProfile): Promise<boolean>;

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
  abstract findByStatus(status: string, pagination: Pagination): Promise<SearchResult>;

  /**
   * Get profiles by agency
   */
  abstract findByAgency(agencyId: string, pagination: Pagination): Promise<SearchResult>;
}
