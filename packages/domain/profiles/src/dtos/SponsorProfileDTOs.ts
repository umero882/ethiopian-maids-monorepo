/**
 * Sponsor Profile DTOs (Data Transfer Objects)
 *
 * These objects define the shape of data going in and out of sponsor use cases.
 * They are plain objects without business logic.
 */

export interface CreateSponsorProfileDTO {
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  country: string;
  city?: string;
  preferredNationality?: string;
  preferredLanguages?: string[];
}

export interface UpdateSponsorProfileDTO {
  profileId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  preferredNationality?: string;
  preferredLanguages?: string[];
}

export interface SearchSponsorProfilesDTO {
  country?: string;
  city?: string;
  preferredNationality?: string;
  limit?: number;
  offset?: number;
}

export interface AddFavoriteMaidDTO {
  sponsorId: string;
  maidId: string;
}

export interface RemoveFavoriteMaidDTO {
  sponsorId: string;
  maidId: string;
}
