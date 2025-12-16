/**
 * SponsorProfileRepository Interface
 *
 * Defines the contract for sponsor profile data access.
 */

import { SponsorProfile } from '../entities/SponsorProfile.js';

export interface SponsorProfileSearchCriteria {
  country?: string;
  verifiedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface SponsorProfileRepository {
  /**
   * Find a sponsor profile by ID
   */
  findById(id: string): Promise<SponsorProfile | null>;

  /**
   * Find a sponsor profile by user ID
   */
  findByUserId(userId: string): Promise<SponsorProfile | null>;

  /**
   * Search sponsor profiles
   */
  search(criteria: SponsorProfileSearchCriteria): Promise<SponsorProfile[]>;

  /**
   * Save (create or update) a sponsor profile
   */
  save(profile: SponsorProfile): Promise<void>;

  /**
   * Delete a sponsor profile
   */
  delete(id: string): Promise<void>;

  /**
   * Get sponsor's favorite maids
   */
  getFavoriteMaidIds(sponsorId: string): Promise<string[]>;

  /**
   * Add maid to favorites
   */
  addFavorite(sponsorId: string, maidId: string): Promise<void>;

  /**
   * Remove maid from favorites
   */
  removeFavorite(sponsorId: string, maidId: string): Promise<void>;

  /**
   * Count total profiles
   */
  count(criteria?: SponsorProfileSearchCriteria): Promise<number>;
}
