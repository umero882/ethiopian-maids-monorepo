/**
 * Sponsor Profile Application Service
 * Wires all Sponsor Profile use cases to GraphQL repository
 */

import { ApolloClient } from '@apollo/client';
import { GraphQLSponsorProfileRepository } from '@ethio/infra-web-profiles';
import {
  CreateSponsorProfileUseCase,
  UpdateSponsorProfileUseCase,
  GetSponsorProfileUseCase,
  DeleteSponsorProfileUseCase,
  SearchSponsorProfilesUseCase,
  GetFavoriteMaidsUseCase,
  AddFavoriteMaidUseCase,
  RemoveFavoriteMaidUseCase,
  CreateSponsorProfileDTO,
  UpdateSponsorProfileDTO,
  SearchSponsorProfilesDTO,
  SponsorProfile,
} from '@ethio/domain-profiles';

export class SponsorProfileService {
  private repository: GraphQLSponsorProfileRepository;
  private createUseCase: CreateSponsorProfileUseCase;
  private updateUseCase: UpdateSponsorProfileUseCase;
  private getUseCase: GetSponsorProfileUseCase;
  private deleteUseCase: DeleteSponsorProfileUseCase;
  private searchUseCase: SearchSponsorProfilesUseCase;
  private getFavoritesUseCase: GetFavoriteMaidsUseCase;
  private addFavoriteUseCase: AddFavoriteMaidUseCase;
  private removeFavoriteUseCase: RemoveFavoriteMaidUseCase;

  constructor(apolloClient: ApolloClient<any>) {
    this.repository = new GraphQLSponsorProfileRepository(apolloClient);

    // Initialize all use cases
    this.createUseCase = new CreateSponsorProfileUseCase(this.repository);
    this.updateUseCase = new UpdateSponsorProfileUseCase(this.repository);
    this.getUseCase = new GetSponsorProfileUseCase(this.repository);
    this.deleteUseCase = new DeleteSponsorProfileUseCase(this.repository);
    this.searchUseCase = new SearchSponsorProfilesUseCase(this.repository);
    this.getFavoritesUseCase = new GetFavoriteMaidsUseCase(this.repository);
    this.addFavoriteUseCase = new AddFavoriteMaidUseCase(this.repository);
    this.removeFavoriteUseCase = new RemoveFavoriteMaidUseCase(this.repository);
  }

  async createProfile(dto: CreateSponsorProfileDTO): Promise<SponsorProfile> {
    const result = await this.createUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async updateProfile(id: string, dto: UpdateSponsorProfileDTO): Promise<SponsorProfile> {
    const result = await this.updateUseCase.execute({ id, ...dto });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getProfile(id: string): Promise<SponsorProfile | null> {
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

  async searchProfiles(dto: SearchSponsorProfilesDTO): Promise<SponsorProfile[]> {
    const result = await this.searchUseCase.execute(dto);
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async getFavoriteMaids(sponsorId: string): Promise<string[]> {
    const result = await this.getFavoritesUseCase.execute({ sponsorId });
    if (result.isFailure) {
      throw new Error(result.error);
    }
    return result.value;
  }

  async addFavoriteMaid(sponsorId: string, maidId: string): Promise<void> {
    const result = await this.addFavoriteUseCase.execute({ sponsorId, maidId });
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }

  async removeFavoriteMaid(sponsorId: string, maidId: string): Promise<void> {
    const result = await this.removeFavoriteUseCase.execute({ sponsorId, maidId });
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }
}
