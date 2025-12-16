/**
 * Job Application Application Service
 * Wires all Job Application use cases to GraphQL repository
 */

import { ApolloClient } from '@apollo/client';
import { GraphQLJobApplicationRepository } from '@ethio/infra-web-jobs';
import {
  SubmitJobApplicationUseCase,
  WithdrawJobApplicationUseCase,
  ReviewJobApplicationUseCase,
  ShortlistJobApplicationUseCase,
  RejectJobApplicationUseCase,
  AcceptJobApplicationUseCase,
  GetJobApplicationUseCase,
  GetJobApplicationsUseCase,
  GetMaidApplicationsUseCase,
  GetSponsorApplicationsUseCase,
  GetShortlistedApplicationsUseCase,
  GetAcceptedApplicationsUseCase,
  CheckHasAppliedUseCase,
  SubmitJobApplicationDTO,
  WithdrawJobApplicationDTO,
  ReviewJobApplicationDTO,
  ShortlistJobApplicationDTO,
  RejectJobApplicationDTO,
  AcceptJobApplicationDTO,
  JobApplication,
} from '@ethio/domain-jobs';

export class JobApplicationService {
  private repository: GraphQLJobApplicationRepository;
  private submitUseCase: SubmitJobApplicationUseCase;
  private withdrawUseCase: WithdrawJobApplicationUseCase;
  private reviewUseCase: ReviewJobApplicationUseCase;
  private shortlistUseCase: ShortlistJobApplicationUseCase;
  private rejectUseCase: RejectJobApplicationUseCase;
  private acceptUseCase: AcceptJobApplicationUseCase;
  private getUseCase: GetJobApplicationUseCase;
  private getJobApplicationsUseCase: GetJobApplicationsUseCase;
  private getMaidApplicationsUseCase: GetMaidApplicationsUseCase;
  private getSponsorApplicationsUseCase: GetSponsorApplicationsUseCase;
  private getShortlistedUseCase: GetShortlistedApplicationsUseCase;
  private getAcceptedUseCase: GetAcceptedApplicationsUseCase;
  private checkHasAppliedUseCase: CheckHasAppliedUseCase;

  constructor(apolloClient: ApolloClient<any>) {
    this.repository = new GraphQLJobApplicationRepository(apolloClient);

    // Initialize all use cases
    this.submitUseCase = new SubmitJobApplicationUseCase(this.repository);
    this.withdrawUseCase = new WithdrawJobApplicationUseCase(this.repository);
    this.reviewUseCase = new ReviewJobApplicationUseCase(this.repository);
    this.shortlistUseCase = new ShortlistJobApplicationUseCase(this.repository);
    this.rejectUseCase = new RejectJobApplicationUseCase(this.repository);
    this.acceptUseCase = new AcceptJobApplicationUseCase(this.repository);
    this.getUseCase = new GetJobApplicationUseCase(this.repository);
    this.getJobApplicationsUseCase = new GetJobApplicationsUseCase(this.repository);
    this.getMaidApplicationsUseCase = new GetMaidApplicationsUseCase(this.repository);
    this.getSponsorApplicationsUseCase = new GetSponsorApplicationsUseCase(this.repository);
    this.getShortlistedUseCase = new GetShortlistedApplicationsUseCase(this.repository);
    this.getAcceptedUseCase = new GetAcceptedApplicationsUseCase(this.repository);
    this.checkHasAppliedUseCase = new CheckHasAppliedUseCase(this.repository);
  }

  async submitApplication(dto: SubmitJobApplicationDTO): Promise<JobApplication> {
    const result = await this.submitUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async withdrawApplication(dto: WithdrawJobApplicationDTO): Promise<JobApplication> {
    const result = await this.withdrawUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async reviewApplication(dto: ReviewJobApplicationDTO): Promise<JobApplication> {
    const result = await this.reviewUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async shortlistApplication(dto: ShortlistJobApplicationDTO): Promise<JobApplication> {
    const result = await this.shortlistUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async rejectApplication(dto: RejectJobApplicationDTO): Promise<JobApplication> {
    const result = await this.rejectUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async acceptApplication(dto: AcceptJobApplicationDTO): Promise<JobApplication> {
    const result = await this.acceptUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getApplication(id: string): Promise<JobApplication | null> {
    const result = await this.getUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getJobApplications(jobId: string, status?: string, limit?: number): Promise<JobApplication[]> {
    const result = await this.getJobApplicationsUseCase.execute({ jobId, status, limit });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getMaidApplications(maidId: string, status?: string, limit?: number): Promise<JobApplication[]> {
    const result = await this.getMaidApplicationsUseCase.execute({ maidId, status, limit });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getSponsorApplications(sponsorId: string, status?: string, limit?: number): Promise<JobApplication[]> {
    const result = await this.getSponsorApplicationsUseCase.execute({ sponsorId, status, limit });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getShortlistedApplications(jobId: string): Promise<JobApplication[]> {
    const result = await this.getShortlistedUseCase.execute({ jobId });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getAcceptedApplications(jobId: string): Promise<JobApplication[]> {
    const result = await this.getAcceptedUseCase.execute({ jobId });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async checkHasApplied(jobId: string, maidId: string): Promise<boolean> {
    const result = await this.checkHasAppliedUseCase.execute({ jobId, maidId });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }
}
