/**
 * MaidProfileRepository Interface
 *
 * Defines the contract for maid profile data access.
 * Implementations can use GraphQL, REST, or any other data source.
 *
 * This is a PORT in Hexagonal Architecture - the domain defines what it needs,
 * and infrastructure provides the implementation (ADAPTER).
 */

import { MaidProfile } from '../entities/MaidProfile.js';

export interface MaidProfileSearchCriteria {
  nationality?: string;
  skills?: string[];
  languages?: string[];
  experienceYears?: number;
  availabilityStatus?: string;
  agencyId?: string;
  limit?: number;
  offset?: number;
}

export interface MaidProfileRepository {
  /**
   * Find a maid profile by ID
   */
  findById(id: string): Promise<MaidProfile | null>;

  /**
   * Find a maid profile by user ID
   */
  findByUserId(userId: string): Promise<MaidProfile | null>;

  /**
   * Search maid profiles with criteria
   */
  search(criteria: MaidProfileSearchCriteria): Promise<MaidProfile[]>;

  /**
   * Get all profiles managed by an agency
   */
  findByAgencyId(agencyId: string): Promise<MaidProfile[]>;

  /**
   * Save (create or update) a maid profile
   */
  save(profile: MaidProfile): Promise<void>;

  /**
   * Delete a maid profile
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a passport number is already registered
   */
  isPassportUnique(passportNumber: string, excludeId?: string): Promise<boolean>;

  /**
   * Get profiles pending verification
   */
  findPendingVerification(): Promise<MaidProfile[]>;

  /**
   * Count total profiles (optionally filtered)
   */
  count(criteria?: MaidProfileSearchCriteria): Promise<number>;
}
