/**
 * GraphQL Implementation of SponsorProfileRepository
 */

import { gql } from '@apollo/client';
import {
  SponsorProfile,
  SponsorProfileRepository,
  SponsorProfileSearchCriteria,
} from '@ethio/domain-profiles';

export class GraphQLSponsorProfileRepository implements SponsorProfileRepository {
  // Using 'any' type for Apollo Client 4 compatibility - proper typing requires generated types
  constructor(private readonly client: any) {}

  async findById(id: string): Promise<SponsorProfile | null> {
    const { data } = await this.client.query({
      query: gql`
        query GetSponsorProfile($id: uuid!) {
          sponsor_profiles_by_pk(id: $id) {
            id
            user_id
            full_name
            email
            phone
            country
            city
            preferred_nationality
            preferred_languages
            is_verified
            created_at
            updated_at
          }
        }
      `,
      variables: { id },
    });

    return data?.sponsor_profiles_by_pk ? this.mapToEntity(data.sponsor_profiles_by_pk) : null;
  }

  async findByUserId(userId: string): Promise<SponsorProfile | null> {
    const { data } = await this.client.query({
      query: gql`
        query GetSponsorProfileByUserId($user_id: uuid!) {
          sponsor_profiles(where: { user_id: { _eq: $user_id } }, limit: 1) {
            id
            user_id
            full_name
            email
            phone
            country
            city
            preferred_nationality
            preferred_languages
            is_verified
            created_at
            updated_at
          }
        }
      `,
      variables: { user_id: userId },
    });

    return data?.sponsor_profiles?.[0] ? this.mapToEntity(data.sponsor_profiles[0]) : null;
  }

  async search(criteria: SponsorProfileSearchCriteria): Promise<SponsorProfile[]> {
    const where: any = {};

    if (criteria.country) {
      where.country = { _eq: criteria.country };
    }
    if (criteria.verifiedOnly) {
      where.is_verified = { _eq: true };
    }

    const { data } = await this.client.query({
      query: gql`
        query SearchSponsorProfiles($where: sponsor_profiles_bool_exp!, $limit: Int!, $offset: Int!) {
          sponsor_profiles(where: $where, limit: $limit, offset: $offset, order_by: { created_at: desc }) {
            id
            user_id
            full_name
            phone
            country
            city
            preferred_languages
            is_verified
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

    return (data?.sponsor_profiles || []).map((profile: any) => this.mapToEntity(profile));
  }

  async save(profile: SponsorProfile): Promise<void> {
    const input = {
      id: profile.id,
      user_id: profile.userId,
      full_name: profile.fullName,
      phone: profile.phone,
      country: profile.country,
      city: profile.city,
      preferred_languages: profile.preferredLanguages,
      is_verified: profile.isVerified,
      updated_at: new Date(),
    };

    await this.client.mutate({
      mutation: gql`
        mutation UpsertSponsorProfile($input: sponsor_profiles_insert_input!) {
          insert_sponsor_profiles_one(
            object: $input
            on_conflict: { constraint: sponsor_profiles_pkey, update_columns: [
              user_id, full_name, email, phone, country, city,
              preferred_nationality, preferred_languages, is_verified, updated_at
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
        mutation DeleteSponsorProfile($id: uuid!) {
          delete_sponsor_profiles_by_pk(id: $id) {
            id
          }
        }
      `,
      variables: { id },
    });
  }

  async count(criteria?: any): Promise<number> {
    const where = criteria || {};
    const { data } = await this.client.query({
      query: gql`
        query CountSponsorProfiles($where: sponsor_profiles_bool_exp!) {
          sponsor_profiles_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `,
      variables: { where },
    });

    return data?.sponsor_profiles_aggregate?.aggregate?.count || 0;
  }

  async getFavoriteMaidIds(sponsorId: string): Promise<string[]> {
    const { data } = await this.client.query({
      query: gql`
        query GetFavoriteMaids($sponsor_id: uuid!) {
          sponsor_favorites(where: { sponsor_id: { _eq: $sponsor_id } }) {
            maid_id
          }
        }
      `,
      variables: { sponsor_id: sponsorId },
    });

    return (data?.sponsor_favorites || []).map((fav: any) => fav.maid_id);
  }

  async addFavorite(sponsorId: string, maidId: string): Promise<void> {
    await this.client.mutate({
      mutation: gql`
        mutation AddFavoriteMaid($input: sponsor_favorites_insert_input!) {
          insert_sponsor_favorites_one(object: $input) {
            sponsor_id
            maid_id
          }
        }
      `,
      variables: {
        input: {
          sponsor_id: sponsorId,
          maid_id: maidId,
        },
      },
    });
  }

  async removeFavorite(sponsorId: string, maidId: string): Promise<void> {
    await this.client.mutate({
      mutation: gql`
        mutation RemoveFavoriteMaid($sponsor_id: uuid!, $maid_id: uuid!) {
          delete_sponsor_favorites(
            where: {
              sponsor_id: { _eq: $sponsor_id }
              maid_id: { _eq: $maid_id }
            }
          ) {
            affected_rows
          }
        }
      `,
      variables: { sponsor_id: sponsorId, maid_id: maidId },
    });
  }

  private mapToEntity(data: any): SponsorProfile {
    return new SponsorProfile({
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      phone: data.phone,
      country: data.country,
      city: data.city,
      preferredLanguages: data.preferred_languages || [],
      isVerified: data.is_verified,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }
}
