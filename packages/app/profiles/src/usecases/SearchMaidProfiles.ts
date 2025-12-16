/**
 * SearchMaidProfiles Use Case (Query)
 *
 * Search and filter maid profiles.
 */

import type { MaidProfileRepository, SearchFilters, Pagination } from '../ports/MaidProfileRepository.js';

export interface SearchMaidProfilesQuery {
  skills?: string[];
  languages?: string[];
  countries?: string[];
  nationality?: string;
  minAge?: number;
  maxAge?: number;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchMaidProfilesResult {
  profiles: Record<string, any>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchMaidProfilesDependencies {
  maidProfileRepository: MaidProfileRepository;
}

export class SearchMaidProfiles {
  private maidProfileRepository: MaidProfileRepository;

  constructor({ maidProfileRepository }: SearchMaidProfilesDependencies) {
    this.maidProfileRepository = maidProfileRepository;
  }

  /**
   * Execute the use case
   */
  async execute(query: SearchMaidProfilesQuery): Promise<SearchMaidProfilesResult> {
    // 1. Build filters
    const filters: SearchFilters = {
      skills: query.skills || [],
      languages: query.languages || [],
      countries: query.countries || [],
      nationality: query.nationality || undefined,
      minAge: query.minAge || undefined,
      maxAge: query.maxAge || undefined,
      status: query.status || 'active', // Default to active profiles
    };

    // 2. Build pagination
    const pagination: Pagination = {
      page: Math.max(1, query.page || 1),
      limit: Math.min(100, Math.max(1, query.limit || 20)), // Max 100 per page
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // 3. Execute search
    const result = await this.maidProfileRepository.search(filters, pagination);

    // 4. Remove sensitive data from results
    const sanitizedProfiles = result.profiles.map(profile => {
      const data = profile.toJSON();
      delete data.passport;
      delete data.medicalCertificate;
      delete data.policeClearance;
      return data;
    });

    // 5. Return results
    return {
      profiles: sanitizedProfiles,
      total: result.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(result.total / pagination.limit),
    };
  }
}
