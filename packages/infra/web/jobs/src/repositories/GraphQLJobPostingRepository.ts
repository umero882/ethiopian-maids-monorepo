/**
 * GraphQL Implementation of JobPostingRepository
 */

import { ApolloClient, gql } from '@apollo/client';
import {
  JobPosting,
  JobPostingRepository,
  JobPostingSearchCriteria,
} from '@ethio/domain-jobs';

export class GraphQLJobPostingRepository implements JobPostingRepository {
  constructor(private readonly client: ApolloClient<any>) {}

  async findById(id: string): Promise<JobPosting | null> {
    const { data } = await this.client.query({
      query: gql`
        query GetJobPosting($id: uuid!) {
          job_postings_by_pk(id: $id) {
            id
            sponsor_id
            title
            description
            required_skills
            required_languages
            experience_years
            preferred_nationality
            location_country
            location_city
            contract_duration
            start_date
            salary_amount
            salary_currency
            salary_period
            benefits
            working_hours
            days_off
            accommodation_type
            status
            application_count
            max_applications
            view_count
            posted_at
            expires_at
            created_at
            updated_at
          }
        }
      `,
      variables: { id },
    });

    return data?.job_postings_by_pk ? this.mapToEntity(data.job_postings_by_pk) : null;
  }

  async search(criteria: JobPostingSearchCriteria): Promise<JobPosting[]> {
    const where: any = {};

    if (criteria.sponsorId) {
      where.sponsor_id = { _eq: criteria.sponsorId };
    }
    if (criteria.location?.country) {
      where.location_country = { _eq: criteria.location.country };
    }
    if (criteria.location?.city) {
      where.location_city = { _eq: criteria.location.city };
    }
    if (criteria.status) {
      where.status = { _eq: criteria.status };
    }
    if (criteria.preferredNationality) {
      where.preferred_nationality = { _eq: criteria.preferredNationality };
    }
    if (criteria.minSalary || criteria.maxSalary) {
      where.salary_amount = {};
      if (criteria.minSalary) where.salary_amount._gte = criteria.minSalary;
      if (criteria.maxSalary) where.salary_amount._lte = criteria.maxSalary;
    }

    const { data } = await this.client.query({
      query: gql`
        query SearchJobPostings($where: job_postings_bool_exp!, $limit: Int!, $offset: Int!) {
          job_postings(where: $where, limit: $limit, offset: $offset, order_by: { created_at: desc }) {
            id
            sponsor_id
            title
            description
            required_skills
            required_languages
            experience_years
            preferred_nationality
            location_country
            location_city
            contract_duration
            start_date
            salary_amount
            salary_currency
            salary_period
            benefits
            working_hours
            days_off
            accommodation_type
            status
            application_count
            max_applications
            view_count
            posted_at
            expires_at
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

    return (data?.job_postings || []).map((job: any) => this.mapToEntity(job));
  }

  async findBySponsorId(sponsorId: string): Promise<JobPosting[]> {
    return this.search({ sponsorId });
  }

  async findActive(): Promise<JobPosting[]> {
    return this.search({ status: 'published' });
  }

  async findExpired(): Promise<JobPosting[]> {
    const { data } = await this.client.query({
      query: gql`
        query FindExpiredJobs {
          job_postings(where: { expires_at: { _lt: "now()" }, status: { _eq: "published" } }) {
            id
            sponsor_id
            title
            description
            required_skills
            required_languages
            experience_years
            preferred_nationality
            location_country
            location_city
            contract_duration
            start_date
            salary_amount
            salary_currency
            salary_period
            benefits
            working_hours
            days_off
            accommodation_type
            status
            application_count
            max_applications
            view_count
            posted_at
            expires_at
            created_at
            updated_at
          }
        }
      `,
    });

    return (data?.job_postings || []).map((job: any) => this.mapToEntity(job));
  }

  async save(jobPosting: JobPosting): Promise<void> {
    const input = {
      id: jobPosting.id,
      sponsor_id: jobPosting.sponsorId,
      title: jobPosting.title,
      description: jobPosting.description,
      required_skills: jobPosting.requiredSkills,
      required_languages: jobPosting.requiredLanguages,
      experience_years: jobPosting.experienceYears,
      preferred_nationality: jobPosting.preferredNationality,
      location_country: jobPosting.location.country,
      location_city: jobPosting.location.city,
      contract_duration: jobPosting.contractDuration,
      start_date: jobPosting.startDate,
      salary_amount: jobPosting.salary.amount,
      salary_currency: jobPosting.salary.currency,
      salary_period: jobPosting.salary.period,
      benefits: jobPosting.benefits,
      working_hours: jobPosting.workingHours,
      days_off: jobPosting.daysOff,
      accommodation_type: jobPosting.accommodationType,
      status: jobPosting.status.value,
      application_count: jobPosting.applicationCount,
      max_applications: jobPosting.maxApplications,
      view_count: jobPosting.viewCount,
      posted_at: jobPosting.postedAt,
      expires_at: jobPosting.expiresAt,
      updated_at: new Date(),
    };

    await this.client.mutate({
      mutation: gql`
        mutation UpsertJobPosting($input: job_postings_insert_input!) {
          insert_job_postings_one(
            object: $input
            on_conflict: { constraint: job_postings_pkey, update_columns: [
              sponsor_id, title, description, required_skills, required_languages,
              experience_years, preferred_nationality, location_country, location_city,
              contract_duration, start_date, salary_amount, salary_currency, salary_period,
              benefits, working_hours, days_off, accommodation_type, status,
              application_count, max_applications, view_count, posted_at, expires_at, updated_at
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
        mutation DeleteJobPosting($id: uuid!) {
          delete_job_postings_by_pk(id: $id) {
            id
          }
        }
      `,
      variables: { id },
    });
  }

  async count(criteria?: JobPostingSearchCriteria): Promise<number> {
    const where = this.buildWhereClause(criteria || {});
    const { data } = await this.client.query({
      query: gql`
        query CountJobPostings($where: job_postings_bool_exp!) {
          job_postings_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `,
      variables: { where },
    });

    return data?.job_postings_aggregate?.aggregate?.count || 0;
  }

  async findMatchingJobs(
    maidSkills: string[],
    maidLanguages: string[],
    maidNationality: string,
    limit?: number
  ): Promise<JobPosting[]> {
    const { data } = await this.client.query({
      query: gql`
        query FindMatchingJobs($skills: [String!]!, $languages: [String!]!, $nationality: String!, $limit: Int!) {
          job_postings(
            where: {
              status: { _eq: "published" }
              _or: [
                { required_skills: { _contains: $skills } }
                { required_languages: { _contains: $languages } }
                { preferred_nationality: { _eq: $nationality } }
              ]
            }
            limit: $limit
            order_by: { created_at: desc }
          ) {
            id
            sponsor_id
            title
            description
            required_skills
            required_languages
            experience_years
            preferred_nationality
            location_country
            location_city
            contract_duration
            start_date
            salary_amount
            salary_currency
            salary_period
            benefits
            working_hours
            days_off
            accommodation_type
            status
            application_count
            max_applications
            view_count
            posted_at
            expires_at
            created_at
            updated_at
          }
        }
      `,
      variables: {
        skills: maidSkills,
        languages: maidLanguages,
        nationality: maidNationality,
        limit: limit || 20,
      },
    });

    return (data?.job_postings || []).map((job: any) => this.mapToEntity(job));
  }

  private buildWhereClause(criteria: JobPostingSearchCriteria): any {
    const where: any = {};
    if (criteria.sponsorId) where.sponsor_id = { _eq: criteria.sponsorId };
    if (criteria.location?.country) where.location_country = { _eq: criteria.location.country };
    if (criteria.location?.city) where.location_city = { _eq: criteria.location.city };
    if (criteria.status) where.status = { _eq: criteria.status };
    return where;
  }

  private mapToEntity(data: any): JobPosting {
    return new JobPosting({
      id: data.id,
      sponsorId: data.sponsor_id,
      title: data.title,
      description: data.description,
      requiredSkills: data.required_skills || [],
      requiredLanguages: data.required_languages || [],
      experienceYears: data.experience_years,
      preferredNationality: data.preferred_nationality,
      location: {
        country: data.location_country,
        city: data.location_city,
      },
      contractDuration: data.contract_duration,
      startDate: data.start_date,
      salary: {
        amount: data.salary_amount,
        currency: data.salary_currency,
        period: data.salary_period,
      },
      benefits: data.benefits || [],
      workingHours: data.working_hours,
      daysOff: data.days_off,
      accommodationType: data.accommodation_type,
      status: data.status,
      applicationCount: data.application_count,
      maxApplications: data.max_applications,
      viewCount: data.view_count,
      postedAt: data.posted_at,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }
}
