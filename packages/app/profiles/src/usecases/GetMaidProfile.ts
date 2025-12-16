/**
 * GetMaidProfile Use Case (Query)
 *
 * Retrieves a maid profile by ID or userId.
 */

import type { MaidProfileRepository } from '../ports/MaidProfileRepository.js';

export interface GetMaidProfileQuery {
  profileId?: string;
  userId?: string;
  requestorId: string;
  requestorRole?: 'admin' | 'agency' | 'maid' | 'sponsor';
}

export interface GetMaidProfileResult {
  profile: Record<string, any>;
}

export interface GetMaidProfileDependencies {
  maidProfileRepository: MaidProfileRepository;
}

export class GetMaidProfile {
  private maidProfileRepository: MaidProfileRepository;

  constructor({ maidProfileRepository }: GetMaidProfileDependencies) {
    this.maidProfileRepository = maidProfileRepository;
  }

  /**
   * Execute the use case
   */
  async execute(query: GetMaidProfileQuery): Promise<GetMaidProfileResult> {
    // 1. Validate query
    if (!query.profileId && !query.userId) {
      throw new Error('Either profileId or userId is required');
    }

    // 2. Load profile
    let profile;
    if (query.profileId) {
      profile = await this.maidProfileRepository.findById(query.profileId);
    } else if (query.userId) {
      profile = await this.maidProfileRepository.findByUserId(query.userId);
    }

    if (!profile) {
      throw new Error('Profile not found');
    }

    // 3. Check authorization
    const isOwner = profile.userId === query.requestorId;
    const isAdmin = query.requestorRole === 'admin';
    const isAgency = query.requestorRole === 'agency';
    const isPublic = profile.status.isActive();

    // Only allow access if:
    // - User is the owner
    // - User is an admin
    // - User is an agency and profile is approved
    // - Profile is public (active)
    if (!isOwner && !isAdmin && !(isAgency && profile.agencyApproved) && !isPublic) {
      throw new Error('Unauthorized to view this profile');
    }

    // 4. Filter sensitive data based on requestor role
    const profileData = profile.toJSON();

    // Hide sensitive fields from non-owners
    if (!isOwner && !isAdmin) {
      delete profileData.passport;
      delete profileData.medicalCertificate;
      delete profileData.policeClearance;
    }

    // 5. Return result
    return {
      profile: profileData,
    };
  }
}
