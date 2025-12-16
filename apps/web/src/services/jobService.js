/**
 * Job Service
 *
 * This module exports the GraphQL implementation of job services.
 * Supabase fallback has been removed as part of the GraphQL migration.
 */

import { graphqlJobService } from './jobService.graphql';
import { createLogger } from '@/utils/logger';

const log = createLogger('JobService');

// Re-export all GraphQL implementations
export async function getJobs(options = {}) {
  log.debug('Fetching jobs via GraphQL', options);
  return graphqlJobService.getJobs(options);
}

export async function getJobById(jobId) {
  log.debug('Fetching job by ID via GraphQL', { jobId });
  return graphqlJobService.getJobById(jobId);
}

export async function createJob(jobData) {
  log.debug('Creating job via GraphQL');
  return graphqlJobService.createJob(jobData);
}

export async function updateJob(jobId, jobData) {
  log.debug('Updating job via GraphQL', { jobId });
  return graphqlJobService.updateJob(jobId, jobData);
}

export async function deleteJob(jobId) {
  log.debug('Deleting job via GraphQL', { jobId });
  return graphqlJobService.deleteJob(jobId);
}

export async function changeJobStatus(jobId, status) {
  log.debug('Changing job status via GraphQL', { jobId, status });
  return graphqlJobService.changeJobStatus(jobId, status);
}

export async function toggleJobFeatured(jobId, featured, daysToFeature = 7) {
  log.debug('Toggling job featured via GraphQL', { jobId, featured });
  return graphqlJobService.toggleJobFeatured(jobId, featured, daysToFeature);
}

export async function getSponsorJobs(options = {}) {
  log.debug('Fetching sponsor jobs via GraphQL', options);
  return graphqlJobService.getSponsorJobs(options);
}

export async function getJobApplications(jobId) {
  log.debug('Fetching job applications via GraphQL', { jobId });
  return graphqlJobService.getJobApplications(jobId);
}

export async function getMaidApplications(options = {}) {
  log.debug('Fetching maid applications via GraphQL', options);
  return graphqlJobService.getMaidApplications(options);
}

export async function getApplicationById(applicationId) {
  log.debug('Fetching application by ID via GraphQL', { applicationId });
  return graphqlJobService.getApplicationById(applicationId);
}

export async function submitApplication(jobId, applicationData) {
  log.debug('Submitting application via GraphQL', { jobId });
  return graphqlJobService.submitApplication(jobId, applicationData);
}

export async function updateApplicationStatus(applicationId, status, updates = {}) {
  log.debug('Updating application status via GraphQL', { applicationId, status });
  return graphqlJobService.updateApplicationStatus(applicationId, status, updates);
}

export async function addApplicationNotes(applicationId, notes) {
  log.debug('Adding application notes via GraphQL', { applicationId });
  return graphqlJobService.addApplicationNotes(applicationId, notes);
}

export async function withdrawApplication(applicationId) {
  log.debug('Withdrawing application via GraphQL', { applicationId });
  return graphqlJobService.withdrawApplication(applicationId);
}

export async function getSponsorJobStats(sponsorId) {
  log.debug('Fetching sponsor job stats via GraphQL', { sponsorId });
  return graphqlJobService.getSponsorJobStats(sponsorId);
}

// Export as default object for backwards compatibility
export default {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  changeJobStatus,
  toggleJobFeatured,
  getSponsorJobs,
  getJobApplications,
  getMaidApplications,
  getApplicationById,
  submitApplication,
  updateApplicationStatus,
  addApplicationNotes,
  withdrawApplication,
  getSponsorJobStats,
};
