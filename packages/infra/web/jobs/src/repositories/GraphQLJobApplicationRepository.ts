/**
 * GraphQL Implementation of JobApplicationRepository
 */

import { gql } from '@apollo/client';
import {
  JobApplication,
  JobApplicationRepository,
  JobApplicationSearchCriteria,
} from '@ethio/domain-jobs';

export class GraphQLJobApplicationRepository implements JobApplicationRepository {
  // Using 'any' type for Apollo Client 4 compatibility - proper typing requires generated types
  constructor(private readonly client: any) {}

  async findById(id: string): Promise<JobApplication | null> {
    const { data } = await this.client.query({
      query: gql`
        query GetJobApplication($id: uuid!) {
          job_applications_by_pk(id: $id) {
            id
            job_id
            maid_id
            sponsor_id
            status
            cover_letter
            expected_salary_amount
            expected_salary_currency
            expected_salary_period
            available_from
            applied_at
            reviewed_at
            shortlisted_at
            accepted_at
            rejected_at
            rejection_reason
            created_at
            updated_at
          }
        }
      `,
      variables: { id },
    });

    return data?.job_applications_by_pk ? this.mapToEntity(data.job_applications_by_pk) : null;
  }

  async search(criteria: JobApplicationSearchCriteria): Promise<JobApplication[]> {
    const where: any = {};

    if (criteria.jobId) {
      where.job_id = { _eq: criteria.jobId };
    }
    if (criteria.maidId) {
      where.maid_id = { _eq: criteria.maidId };
    }
    if (criteria.sponsorId) {
      where.sponsor_id = { _eq: criteria.sponsorId };
    }
    if (criteria.status) {
      where.status = { _eq: criteria.status };
    }

    const { data } = await this.client.query({
      query: gql`
        query SearchJobApplications($where: job_applications_bool_exp!, $limit: Int!, $offset: Int!) {
          job_applications(where: $where, limit: $limit, offset: $offset, order_by: { applied_at: desc }) {
            id
            job_id
            maid_id
            sponsor_id
            status
            cover_letter
            expected_salary_amount
            expected_salary_currency
            expected_salary_period
            available_from
            applied_at
            reviewed_at
            shortlisted_at
            accepted_at
            rejected_at
            rejection_reason
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

    return (data?.job_applications || []).map((app: any) => this.mapToEntity(app));
  }

  async findByJobId(jobId: string, status?: string): Promise<JobApplication[]> {
    const criteria: JobApplicationSearchCriteria = { jobId };
    if (status) criteria.status = status;
    return this.search(criteria);
  }

  async findByMaidId(maidId: string, status?: string): Promise<JobApplication[]> {
    const criteria: JobApplicationSearchCriteria = { maidId };
    if (status) criteria.status = status;
    return this.search(criteria);
  }

  async findBySponsorId(sponsorId: string, status?: string): Promise<JobApplication[]> {
    const criteria: JobApplicationSearchCriteria = { sponsorId };
    if (status) criteria.status = status;
    return this.search(criteria);
  }

  async hasApplied(jobId: string, maidId: string): Promise<boolean> {
    const { data } = await this.client.query({
      query: gql`
        query CheckHasApplied($job_id: uuid!, $maid_id: uuid!) {
          job_applications_aggregate(
            where: {
              job_id: { _eq: $job_id }
              maid_id: { _eq: $maid_id }
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `,
      variables: { job_id: jobId, maid_id: maidId },
    });

    return (data?.job_applications_aggregate?.aggregate?.count || 0) > 0;
  }

  async save(application: JobApplication): Promise<void> {
    const input = {
      id: application.id,
      job_id: application.jobId,
      maid_id: application.maidId,
      sponsor_id: application.sponsorId,
      status: application.status.toString(),
      cover_letter: application.coverLetter,
      expected_salary_amount: application.proposedSalary?.amount,
      expected_salary_currency: application.proposedSalary?.currency,
      expected_salary_period: application.proposedSalary?.period,
      available_from: application.availableFrom,
      applied_at: application.appliedAt,
      rejection_reason: application.rejectionReason,
      updated_at: new Date(),
    };

    await this.client.mutate({
      mutation: gql`
        mutation UpsertJobApplication($input: job_applications_insert_input!) {
          insert_job_applications_one(
            object: $input
            on_conflict: { constraint: job_applications_pkey, update_columns: [
              job_id, maid_id, sponsor_id, status, cover_letter,
              expected_salary_amount, expected_salary_currency, expected_salary_period,
              available_from, applied_at, reviewed_at, shortlisted_at,
              accepted_at, rejected_at, rejection_reason, updated_at
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
        mutation DeleteJobApplication($id: uuid!) {
          delete_job_applications_by_pk(id: $id) {
            id
          }
        }
      `,
      variables: { id },
    });
  }

  async count(criteria?: JobApplicationSearchCriteria): Promise<number> {
    const where = this.buildWhereClause(criteria || {});
    const { data } = await this.client.query({
      query: gql`
        query CountJobApplications($where: job_applications_bool_exp!) {
          job_applications_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `,
      variables: { where },
    });

    return data?.job_applications_aggregate?.aggregate?.count || 0;
  }

  async findShortlistedByJobId(jobId: string): Promise<JobApplication[]> {
    return this.findByJobId(jobId, 'shortlisted');
  }

  async findAcceptedByMaidId(maidId: string): Promise<JobApplication[]> {
    return this.findByMaidId(maidId, 'accepted');
  }

  private buildWhereClause(criteria: JobApplicationSearchCriteria): any {
    const where: any = {};
    if (criteria.jobId) where.job_id = { _eq: criteria.jobId };
    if (criteria.maidId) where.maid_id = { _eq: criteria.maidId };
    if (criteria.sponsorId) where.sponsor_id = { _eq: criteria.sponsorId };
    if (criteria.status) where.status = { _eq: criteria.status };
    return where;
  }

  private mapToEntity(data: any): JobApplication {
    return new JobApplication({
      id: data.id,
      jobId: data.job_id,
      maidId: data.maid_id,
      sponsorId: data.sponsor_id,
      coverLetter: data.cover_letter,
      proposedSalary: data.expected_salary_amount ? {
        amount: data.expected_salary_amount,
        currency: data.expected_salary_currency,
        period: data.expected_salary_period,
      } : undefined,
      availableFrom: data.available_from,
      rejectionReason: data.rejection_reason,
      status: data.status,
    });
  }
}
