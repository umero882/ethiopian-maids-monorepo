/**
 * Job Application DTOs (Data Transfer Objects)
 *
 * These objects define the shape of data going in and out of job application use cases.
 * They are plain objects without business logic.
 */

export interface SubmitJobApplicationDTO {
  jobId: string;
  maidId: string;
  coverLetter?: string;
  expectedSalary?: {
    amount: number;
    currency: string;
    period: 'monthly' | 'yearly';
  };
  availableFrom?: Date | string;
}

export interface WithdrawJobApplicationDTO {
  applicationId: string;
  reason?: string;
}

export interface ReviewJobApplicationDTO {
  applicationId: string;
  reviewNotes?: string;
}

export interface ShortlistJobApplicationDTO {
  applicationId: string;
  notes?: string;
}

export interface RejectJobApplicationDTO {
  applicationId: string;
  reason: string;
}

export interface AcceptJobApplicationDTO {
  applicationId: string;
  notes?: string;
}

export interface SearchJobApplicationsDTO {
  jobId?: string;
  maidId?: string;
  sponsorId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface GetApplicationsByJobDTO {
  jobId: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface GetApplicationsByMaidDTO {
  maidId: string;
  status?: string;
  limit?: number;
  offset?: number;
}
