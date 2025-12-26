/**
 * GraphQL Implementation of MaidProfileRepository
 *
 * Implements the repository interface using Apollo Client and Hasura GraphQL.
 */

import { gql } from '@apollo/client';
import {
  MaidProfile,
  MaidProfileRepository,
  MaidProfileSearchCriteria,
} from '@ethio/domain-profiles';

export class GraphQLMaidProfileRepository implements MaidProfileRepository {
  // Using 'any' type for Apollo Client 4 compatibility - proper typing requires generated types
  constructor(private readonly client: any) {}

  async findById(id: string): Promise<MaidProfile | null> {
    const { data } = await this.client.query({
      query: gql`
        query GetMaidProfile($id: uuid!) {
          maid_profiles_by_pk(id: $id) {
            id
            user_id
            full_name
            date_of_birth
            nationality
            phone
            profile_photo
            agency_id
            status
            completion_percentage
            is_verified
            verified_at
            agency_approved
            created_at
            updated_at
          }
        }
      `,
      variables: { id },
    });

    if (!data?.maid_profiles_by_pk) {
      return null;
    }

    return this.mapToEntity(data.maid_profiles_by_pk);
  }

  async findByUserId(userId: string): Promise<MaidProfile | null> {
    const { data } = await this.client.query({
      query: gql`
        query GetMaidProfileByUserId($user_id: uuid!) {
          maid_profiles(where: { user_id: { _eq: $user_id } }, limit: 1) {
            id
            user_id
            full_name
            date_of_birth
            nationality
            phone
            profile_photo
            agency_id
            status
            completion_percentage
            is_verified
            verified_at
            agency_approved
            created_at
            updated_at
          }
        }
      `,
      variables: { user_id: userId },
    });

    if (!data?.maid_profiles || data.maid_profiles.length === 0) {
      return null;
    }

    return this.mapToEntity(data.maid_profiles[0]);
  }

  async search(criteria: MaidProfileSearchCriteria): Promise<MaidProfile[]> {
    const where: any = {};

    if (criteria.nationality) {
      where.nationality = { _eq: criteria.nationality };
    }
    if (criteria.availabilityStatus) {
      where.status = { _eq: criteria.availabilityStatus };
    }
    if (criteria.agencyId) {
      where.agency_id = { _eq: criteria.agencyId };
    }

    const { data } = await this.client.query({
      query: gql`
        query SearchMaidProfiles($where: maid_profiles_bool_exp!, $limit: Int!, $offset: Int!) {
          maid_profiles(where: $where, limit: $limit, offset: $offset, order_by: { created_at: desc }) {
            id
            user_id
            full_name
            date_of_birth
            nationality
            phone
            profile_photo
            agency_id
            status
            completion_percentage
            is_verified
            verified_at
            agency_approved
            created_at
            updated_at
          }
        }
      `,
      variables: {
        where,
        limit: criteria.limit || 50,
        offset: criteria.offset || 0,
      },
    });

    return (data?.maid_profiles || []).map((profile: any) => this.mapToEntity(profile));
  }

  async findByAgencyId(agencyId: string): Promise<MaidProfile[]> {
    return this.search({ agencyId });
  }

  async save(profile: MaidProfile): Promise<void> {
    const input = {
      id: profile.id,
      user_id: profile.userId,
      full_name: profile.fullName,
      date_of_birth: profile.dateOfBirth,
      nationality: profile.nationality,
      phone: profile.phone,
      profile_photo: profile.profilePhoto,
      agency_id: profile.agencyId,
      status: profile.status.toString(),
      completion_percentage: profile.completionPercentage,
      is_verified: profile.isVerified,
      verified_at: profile.verifiedAt,
      agency_approved: profile.agencyApproved,
      updated_at: new Date(),
    };

    await this.client.mutate({
      mutation: gql`
        mutation UpsertMaidProfile($input: maid_profiles_insert_input!) {
          insert_maid_profiles_one(
            object: $input
            on_conflict: { constraint: maid_profiles_pkey, update_columns: [
              user_id, full_name, date_of_birth, nationality, phone, profile_photo,
              agency_id, status, completion_percentage, is_verified, verified_at,
              agency_approved, updated_at
            ]}
          ) {
            id
          }
        }
      `,
      variables: { input },
    });
  }

  async delete(id: string): Promise<void> {
    await this.client.mutate({
      mutation: gql`
        mutation DeleteMaidProfile($id: uuid!) {
          delete_maid_profiles_by_pk(id: $id) {
            id
          }
        }
      `,
      variables: { id },
    });
  }

  async isPassportUnique(passportNumber: string, excludeId?: string): Promise<boolean> {
    const where: any = { passport_number: { _eq: passportNumber } };
    if (excludeId) {
      where.id = { _neq: excludeId };
    }

    const { data } = await this.client.query({
      query: gql`
        query CheckPassportUnique($where: maid_profiles_bool_exp!) {
          maid_profiles_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `,
      variables: { where },
    });

    return (data?.maid_profiles_aggregate?.aggregate?.count || 0) === 0;
  }

  async findPendingVerification(): Promise<MaidProfile[]> {
    return this.search({ availabilityStatus: 'pending_verification' });
  }

  async count(criteria?: MaidProfileSearchCriteria): Promise<number> {
    const where: any = {};

    if (criteria?.nationality) {
      where.nationality = { _eq: criteria.nationality };
    }
    if (criteria?.availabilityStatus) {
      where.status = { _eq: criteria.availabilityStatus };
    }
    if (criteria?.agencyId) {
      where.agency_id = { _eq: criteria.agencyId };
    }

    const { data } = await this.client.query({
      query: gql`
        query CountMaidProfiles($where: maid_profiles_bool_exp!) {
          maid_profiles_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `,
      variables: { where },
    });

    return data?.maid_profiles_aggregate?.aggregate?.count || 0;
  }

  private mapToEntity(data: any): MaidProfile {
    return new MaidProfile({
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      dateOfBirth: data.date_of_birth,
      nationality: data.nationality,
      phone: data.phone,
      profilePhoto: data.profile_photo,
      agencyId: data.agency_id,
      status: data.status,
      completionPercentage: data.completion_percentage,
      isVerified: data.is_verified,
      verifiedAt: data.verified_at,
      agencyApproved: data.agency_approved,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }
}
