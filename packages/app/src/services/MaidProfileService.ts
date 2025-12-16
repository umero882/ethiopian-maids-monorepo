/**
 * Maid Profile Application Service
 * Wires all Maid Profile use cases to GraphQL repository
 */

import { ApolloClient } from '@apollo/client';
import { GraphQLMaidProfileRepository } from '@ethio/infra-web-profiles';
import {
  CreateMaidProfileUseCase,
  UpdateMaidProfileUseCase,
  GetMaidProfileUseCase,
  DeleteMaidProfileUseCase,
  SearchMaidProfilesUseCase,
  GetAgencyMaidsUseCase,
  VerifyMaidProfileUseCase,
  ApproveMaidProfileUseCase,
  UpdateProfileCompletionUseCase,
  CheckPassportUniqueUseCase,
  GetPendingVerificationMaidsUseCase,
  CreateMaidProfileDTO,
  UpdateMaidProfileDTO,
  SearchMaidProfilesDTO,
  MaidProfile,
} from '@ethio/domain-profiles';

export class MaidProfileService {
  private repository: GraphQLMaidProfileRepository;
  private createUseCase: CreateMaidProfileUseCase;
  private updateUseCase: UpdateMaidProfileUseCase;
  private getUseCase: GetMaidProfileUseCase;
  private deleteUseCase: DeleteMaidProfileUseCase;
  private searchUseCase: SearchMaidProfilesUseCase;
  private getAgencyMaidsUseCase: GetAgencyMaidsUseCase;
  private verifyUseCase: VerifyMaidProfileUseCase;
  private approveUseCase: ApproveMaidProfileUseCase;
  private updateCompletionUseCase: UpdateProfileCompletionUseCase;
  private checkPassportUseCase: CheckPassportUniqueUseCase;
  private getPendingVerificationUseCase: GetPendingVerificationMaidsUseCase;

  constructor(apolloClient: ApolloClient<any>) {
    this.repository = new GraphQLMaidProfileRepository(apolloClient);

    // Initialize all use cases
    this.createUseCase = new CreateMaidProfileUseCase(this.repository);
    this.updateUseCase = new UpdateMaidProfileUseCase(this.repository);
    this.getUseCase = new GetMaidProfileUseCase(this.repository);
    this.deleteUseCase = new DeleteMaidProfileUseCase(this.repository);
    this.searchUseCase = new SearchMaidProfilesUseCase(this.repository);
    this.getAgencyMaidsUseCase = new GetAgencyMaidsUseCase(this.repository);
    this.verifyUseCase = new VerifyMaidProfileUseCase(this.repository);
    this.approveUseCase = new ApproveMaidProfileUseCase(this.repository);
    this.updateCompletionUseCase = new UpdateProfileCompletionUseCase(this.repository);
    this.checkPassportUseCase = new CheckPassportUniqueUseCase(this.repository);
    this.getPendingVerificationUseCase = new GetPendingVerificationMaidsUseCase(this.repository);
  }

  async createProfile(dto: CreateMaidProfileDTO): Promise<MaidProfile> {
    const result = await this.createUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async updateProfile(id: string, dto: UpdateMaidProfileDTO): Promise<MaidProfile> {
    const result = await this.updateUseCase.execute({ id, ...dto });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getProfile(id: string): Promise<MaidProfile | null> {
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

  async searchProfiles(dto: SearchMaidProfilesDTO): Promise<MaidProfile[]> {
    const result = await this.searchUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getAgencyMaids(agencyId: string, limit?: number, offset?: number): Promise<MaidProfile[]> {
    const result = await this.getAgencyMaidsUseCase.execute({ agencyId, limit, offset });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async verifyProfile(id: string): Promise<MaidProfile> {
    const result = await this.verifyUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async approveProfile(id: string): Promise<MaidProfile> {
    const result = await this.approveUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async updateProfileCompletion(id: string): Promise<MaidProfile> {
    const result = await this.updateCompletionUseCase.execute({ id });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async checkPassportUnique(passportNumber: string, excludeProfileId?: string): Promise<boolean> {
    const result = await this.checkPassportUseCase.execute({ passportNumber, excludeProfileId });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getPendingVerificationMaids(limit?: number): Promise<MaidProfile[]> {
    const result = await this.getPendingVerificationUseCase.execute({ limit });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }
}
