/**
 * Maid Profile DTOs (Data Transfer Objects)
 *
 * These objects define the shape of data going in and out of use cases.
 * They are plain objects without business logic.
 */

export interface CreateMaidProfileDTO {
  userId: string;
  fullName: string;
  dateOfBirth?: Date | string;
  nationality: string;
  phone?: string;
  profilePhoto?: string;
  agencyId?: string;
}

export interface UpdateMaidBasicInfoDTO {
  profileId: string;
  fullName?: string;
  dateOfBirth?: Date | string;
  nationality?: string;
  phone?: string;
}

export interface UpdateMaidWorkInfoDTO {
  profileId: string;
  skills?: string[];
  languages?: string[];
  experienceYears?: number;
  education?: string;
  religion?: string;
  maritalStatus?: string;
  availability?: string;
}

export interface UploadMaidDocumentDTO {
  profileId: string;
  documentType: string;
  documentUrl: string;
  expiryDate?: Date | string;
}

export interface SearchMaidProfilesDTO {
  nationality?: string;
  skills?: string[];
  languages?: string[];
  experienceYears?: number;
  availabilityStatus?: string;
  agencyId?: string;
  limit?: number;
  offset?: number;
}

export interface SubmitMaidProfileForReviewDTO {
  profileId: string;
}

export interface ApproveMaidProfileDTO {
  profileId: string;
}

export interface RejectMaidProfileDTO {
  profileId: string;
  reason: string;
}

export interface ArchiveMaidProfileDTO {
  profileId: string;
  reason?: string;
}
