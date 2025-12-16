/**
 * GraphQL Implementation of AgencyProfileRepository
 */

import { ApolloClient, gql } from '@apollo/client';
import {
  AgencyProfile,
  AgencyProfileRepository,
} from '@ethio/domain-profiles';
import { AgencyStatistics } from '@ethio/domain-profiles';

export class GraphQLAgencyProfileRepository implements AgencyProfileRepository {
  constructor(private readonly client: ApolloClient<any>) {}

  async findById(id: string): Promise<AgencyProfile | null> {
    // agency_profiles uses String! for id (Firebase UID)
    const { data } = await this.client.query({
      query: gql`
        query GetAgencyProfile($id: String!) {
          agency_profiles_by_pk(id: $id) {
            id
            full_name
            license_number
            country
            city
            address
            phone
            email
            website_url
            agency_description
            verified
            verified_at
            average_rating
            total_reviews
            created_at
            updated_at
          }
        }
      `,
      variables: { id },
    });

    return data?.agency_profiles_by_pk ? this.mapToEntity(data.agency_profiles_by_pk) : null;
  }

  async findByUserId(userId: string): Promise<AgencyProfile | null> {
    // agency_profiles uses id as primary key (Firebase UID), not user_id
    const { data } = await this.client.query({
      query: gql`
        query GetAgencyProfileByUserId($id: String!) {
          agency_profiles_by_pk(id: $id) {
            id
            full_name
            license_number
            country
            city
            address
            phone
            email
            website_url
            agency_description
            verified
            verified_at
            average_rating
            total_reviews
            created_at
            updated_at
          }
        }
      `,
      variables: { id: userId },
    });

    return data?.agency_profiles_by_pk ? this.mapToEntity(data.agency_profiles_by_pk) : null;
  }

  async save(profile: AgencyProfile): Promise<void> {
    // Use correct field names for agency_profiles table
    const input = {
      id: profile.id,
      full_name: profile.fullName,
      license_number: profile.licenseNumber,
      country: profile.country,
      city: profile.city,
      address: profile.address,
      phone: profile.phone,
      email: profile.email,
      website_url: profile.website,
      agency_description: profile.description,
      verified: profile.isVerified,
      verified_at: profile.verifiedAt,
      average_rating: profile.rating,
      total_reviews: profile.totalReviews,
      updated_at: new Date(),
    };

    await this.client.mutate({
      mutation: gql`
        mutation UpsertAgencyProfile($input: agency_profiles_insert_input!) {
          insert_agency_profiles_one(
            object: $input
            on_conflict: { constraint: agency_profiles_pkey, update_columns: [
              full_name, license_number, country, city, address,
              phone, email, website_url, agency_description, verified, verified_at,
              average_rating, total_reviews, updated_at
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
        mutation DeleteAgencyProfile($id: String!) {
          delete_agency_profiles_by_pk(id: $id) {
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
        query CountAgencyProfiles($where: agency_profiles_bool_exp!) {
          agency_profiles_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `,
      variables: { where },
    });

    return data?.agency_profiles_aggregate?.aggregate?.count || 0;
  }

  async getStatistics(agencyId: string): Promise<AgencyStatistics> {
    // maid_profiles.agency_id is String type
    const { data } = await this.client.query({
      query: gql`
        query GetAgencyStatistics($agency_id: String!) {
          total_maids: maid_profiles_aggregate(where: { agency_id: { _eq: $agency_id } }) {
            aggregate {
              count
            }
          }
          active_maids: maid_profiles_aggregate(
            where: {
              agency_id: { _eq: $agency_id }
              availability_status: { _eq: "available" }
            }
          ) {
            aggregate {
              count
            }
          }
          placed_maids: maid_profiles_aggregate(
            where: {
              agency_id: { _eq: $agency_id }
              availability_status: { _eq: "placed" }
            }
          ) {
            aggregate {
              count
            }
          }
          pending_applications: applications_aggregate(
            where: {
              maid_profile: { agency_id: { _eq: $agency_id } }
              status: { _eq: "pending" }
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `,
      variables: { agency_id: agencyId },
    });

    return {
      totalMaids: data?.total_maids?.aggregate?.count || 0,
      activeMaids: data?.active_maids?.aggregate?.count || 0,
      placedMaids: data?.placed_maids?.aggregate?.count || 0,
      pendingApplications: data?.pending_applications?.aggregate?.count || 0,
      completedJobs: 0, // TODO: Calculate from job_applications where status = accepted
    };
  }

  private mapToEntity(data: any): AgencyProfile {
    return new AgencyProfile({
      id: data.id,
      userId: data.id, // agency_profiles uses id as the user identifier (Firebase UID)
      fullName: data.full_name,
      licenseNumber: data.license_number,
      country: data.country,
      city: data.city,
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website_url || data.website,
      description: data.agency_description || data.description,
      isVerified: data.verified ?? data.is_verified,
      verifiedAt: data.verified_at,
      rating: data.average_rating ?? data.rating,
      totalReviews: data.total_reviews,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }
}
