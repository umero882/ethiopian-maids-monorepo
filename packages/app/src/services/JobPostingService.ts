/**
 * Job Posting Application Service
 * Wires all Job Posting use cases to GraphQL repository
 */

import { ApolloClient } from '@apollo/client';
import { GraphQLJobPostingRepository } from '@ethio/infra-web-jobs';
import {
  CreateJobPostingUseCase,
  UpdateJobPostingUseCase,
  GetJobPostingUseCase,
  DeleteJobPostingUseCase,
  SearchJobPostingsUseCase,
  PublishJobPostingUseCase,
  CloseJobPostingUseCase,
  GetSponsorJobsUseCase,
  FindMatchingJobsUseCase,
  CreateJobPostingDTO,
  UpdateJobPostingDTO,
  SearchJobPostingsDTO,
  FindMatchingJobsDTO,
  JobPosting,
} from '@ethio/domain-jobs';

export class JobPostingService {
  private repository: GraphQLJobPostingRepository;
  private createUseCase: CreateJobPostingUseCase;
  private updateUseCase: UpdateJobPostingUseCase;
  private getUseCase: GetJobPostingUseCase;
  private deleteUseCase: DeleteJobPostingUseCase;
  private searchUseCase: SearchJobPostingsUseCase;
  private publishUseCase: PublishJobPostingUseCase;
  private closeUseCase: CloseJobPostingUseCase;
  private getSponsorJobsUseCase: GetSponsorJobsUseCase;
  private findMatchingUseCase: FindMatchingJobsUseCase;

  constructor(apolloClient: ApolloClient<any>) {
    this.repository = new GraphQLJobPostingRepository(apolloClient);

    // Initialize all use cases
    this.createUseCase = new CreateJobPostingUseCase(this.repository);
    this.updateUseCase = new UpdateJobPostingUseCase(this.repository);
    this.getUseCase = new GetJobPostingUseCase(this.repository);
    this.deleteUseCase = new DeleteJobPostingUseCase(this.repository);
    this.searchUseCase = new SearchJobPostingsUseCase(this.repository);
    this.publishUseCase = new PublishJobPostingUseCase(this.repository);
    this.closeUseCase = new CloseJobPostingUseCase(this.repository);
    this.getSponsorJobsUseCase = new GetSponsorJobsUseCase(this.repository);
    this.findMatchingUseCase = new FindMatchingJobsUseCase(this.repository);
  }

  async createJobPosting(dto: CreateJobPostingDTO): Promise<JobPosting> {
    const result = await this.createUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async updateJobPosting(id: string, dto: UpdateJobPostingDTO): Promise<JobPosting> {
    const result = await this.updateUseCase.execute({ id, ...dto });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getJobPosting(id: string): Promise<JobPosting | null> {
    const result = await this.getUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async deleteJobPosting(id: string): Promise<void> {
    const result = await this.deleteUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }

  async searchJobPostings(dto: SearchJobPostingsDTO): Promise<JobPosting[]> {
    const result = await this.searchUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async publishJobPosting(id: string): Promise<JobPosting> {
    const result = await this.publishUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async closeJobPosting(id: string): Promise<JobPosting> {
    const result = await this.closeUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getSponsorJobs(sponsorId: string, status?: string, limit?: number): Promise<JobPosting[]> {
    const result = await this.getSponsorJobsUseCase.execute({ sponsorId, status, limit });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async findMatchingJobs(dto: FindMatchingJobsDTO): Promise<JobPosting[]> {
    const result = await this.findMatchingUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }
}
