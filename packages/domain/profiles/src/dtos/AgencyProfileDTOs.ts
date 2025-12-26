/**
 * Agency Profile DTOs (Data Transfer Objects)
 *
 * These objects define the shape of data going in and out of agency use cases.
 * They are plain objects without business logic.
 */

export interface CreateAgencyProfileDTO {
  userId: string;
  fullName: string;
  licenseNumber?: string;
  country: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
}

export interface UpdateAgencyProfileDTO {
  profileId: string;
  fullName?: string;
  licenseNumber?: string;
  country?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
}

export interface SearchAgencyProfilesDTO {
  country?: string;
  city?: string;
  verified?: boolean;
  limit?: number;
  offset?: number;
}

export interface GetAgencyStatisticsRequest {
  agencyId: string;
}

export interface AgencyStatistics {
  totalMaids: number;
  activeMaids: number;
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  successfulPlacements: number;
}
