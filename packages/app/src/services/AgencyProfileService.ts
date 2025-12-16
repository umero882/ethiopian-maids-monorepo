/**
 * Agency Profile Application Service
 * Wires all Agency Profile use cases to GraphQL repository
 */

import { ApolloClient } from '@apollo/client';
import { GraphQLAgencyProfileRepository } from '@ethio/infra-web-profiles';
import {
  CreateAgencyProfileUseCase,
  UpdateAgencyProfileUseCase,
  GetAgencyProfileUseCase,
  DeleteAgencyProfileUseCase,
  SearchAgencyProfilesUseCase,
  GetAgencyStatisticsUseCase,
  CreateAgencyProfileDTO,
  UpdateAgencyProfileDTO,
  SearchAgencyProfilesDTO,
  AgencyProfile,
  AgencyStatistics,
} from '@ethio/domain-profiles';

export class AgencyProfileService {
  private repository: GraphQLAgencyProfileRepository;
  private createUseCase: CreateAgencyProfileUseCase;
  private updateUseCase: UpdateAgencyProfileUseCase;
  private getUseCase: GetAgencyProfileUseCase;
  private deleteUseCase: DeleteAgencyProfileUseCase;
  private searchUseCase: SearchAgencyProfilesUseCase;
  private getStatisticsUseCase: GetAgencyStatisticsUseCase;

  constructor(apolloClient: ApolloClient<any>) {
    this.repository = new GraphQLAgencyProfileRepository(apolloClient);

    // Initialize all use cases
    this.createUseCase = new CreateAgencyProfileUseCase(this.repository);
    this.updateUseCase = new UpdateAgencyProfileUseCase(this.repository);
    this.getUseCase = new GetAgencyProfileUseCase(this.repository);
    this.deleteUseCase = new DeleteAgencyProfileUseCase(this.repository);
    this.searchUseCase = new SearchAgencyProfilesUseCase(this.repository);
    this.getStatisticsUseCase = new GetAgencyStatisticsUseCase(this.repository);
  }

  async createProfile(dto: CreateAgencyProfileDTO): Promise<AgencyProfile> {
    const result = await this.createUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async updateProfile(id: string, dto: UpdateAgencyProfileDTO): Promise<AgencyProfile> {
    const result = await this.updateUseCase.execute({ id, ...dto });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getProfile(id: string): Promise<AgencyProfile | null> {
    const result = await this.getUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async deleteProfile(id: string): Promise<void> {
    const result = await this.deleteUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }

  async searchProfiles(dto: SearchAgencyProfilesDTO): Promise<AgencyProfile[]> {
    const result = await this.searchUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getStatistics(agencyId: string): Promise<AgencyStatistics> {
    const result = await this.getStatisticsUseCase.execute({ agencyId });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }
}
