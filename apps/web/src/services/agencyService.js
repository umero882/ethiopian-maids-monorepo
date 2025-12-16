/**
 * Agency Service
 *
 * This module exports the GraphQL implementation of agency services.
 * Supabase has been fully removed - all operations now use GraphQL/Hasura.
 */

import { graphqlAgencyService } from './agencyService.graphql';
import { auth } from '@/lib/firebaseClient';
import { updatePassword } from 'firebase/auth';
import { createLogger } from '@/utils/logger';

const log = createLogger('AgencyService');

// ============================================================================
// HELPER: Get user ID from Firebase auth
// ============================================================================

const getUserId = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
};

// ============================================================================
// AGENCY PROFILE OPERATIONS (GraphQL)
// ============================================================================

const getAgencyProfile = async (userId) => {
  log.debug('Getting agency profile via GraphQL', { userId });
  return graphqlAgencyService.getAgencyProfile(userId);
};

const getAgencySettings = async () => {
  log.debug('Getting agency settings via GraphQL');
  const userId = await getUserId();
  return graphqlAgencyService.getAgencySettings(userId);
};

const updateAgencySettings = async (settings) => {
  log.debug('Updating agency settings via GraphQL');
  const userId = await getUserId();
  return graphqlAgencyService.updateAgencyProfile(userId, settings.profile || {});
};

const updateAgencyProfile = async (profileData) => {
  log.debug('Updating agency profile via GraphQL');
  const userId = await getUserId();
  return graphqlAgencyService.updateAgencyProfile(userId, profileData);
};

// ============================================================================
// MAIDS MANAGEMENT (GraphQL)
// ============================================================================

const getAgencyMaids = async (filters = {}) => {
  log.debug('Getting agency maids via GraphQL', { filters });
  return graphqlAgencyService.getAgencyMaids(filters);
};

const createMaidProfile = async (maidData, explicitAgencyId = null) => {
  log.debug('Creating maid profile via GraphQL');
  return graphqlAgencyService.createMaidProfile(maidData, explicitAgencyId);
};

const bulkCreateMaidProfiles = async (rows, explicitAgencyId = null) => {
  log.debug('Bulk creating maid profiles via GraphQL', { count: rows.length });
  return graphqlAgencyService.bulkCreateMaidProfiles(rows, explicitAgencyId);
};

const addAgencyMaid = async (maidData) => {
  log.debug('Adding agency maid via GraphQL');
  return graphqlAgencyService.addAgencyMaid(maidData);
};

const updateAgencyMaid = async (id, maidData) => {
  log.debug('Updating agency maid via GraphQL', { id });
  return graphqlAgencyService.updateAgencyMaid(id, maidData);
};

const removeAgencyMaid = async (maidId) => {
  log.debug('Removing agency maid via GraphQL', { maidId });
  return graphqlAgencyService.removeAgencyMaid(maidId);
};

const getAgencyMaidById = async (id) => {
  log.debug('Getting agency maid by ID via GraphQL', { id });
  return graphqlAgencyService.getAgencyMaidById(id);
};

const checkPassportUniqueness = async (passportNumber) => {
  log.debug('Checking passport uniqueness via GraphQL', { passportNumber });
  return graphqlAgencyService.checkPassportUniqueness(passportNumber);
};

// ============================================================================
// AGENCY JOBS (GraphQL)
// ============================================================================

const getAgencyJobs = async (filters = {}) => {
  log.debug('Getting agency jobs via GraphQL', { filters });
  return graphqlAgencyService.getAgencyJobs(filters);
};

const getAgencyJobById = async (jobId) => {
  log.debug('Getting agency job by ID via GraphQL', { jobId });
  return graphqlAgencyService.getAgencyJobById(jobId);
};

const createAgencyJob = async (jobData) => {
  log.debug('Creating agency job via GraphQL');
  return graphqlAgencyService.createAgencyJob(jobData);
};

const updateAgencyJob = async (jobId, jobData) => {
  log.debug('Updating agency job via GraphQL', { jobId });
  return graphqlAgencyService.updateAgencyJob(jobId, jobData);
};

const deleteAgencyJob = async (jobId) => {
  log.debug('Deleting agency job via GraphQL', { jobId });
  return graphqlAgencyService.deleteAgencyJob(jobId);
};

const pauseAgencyJob = async (jobId) => {
  log.debug('Pausing agency job via GraphQL', { jobId });
  return graphqlAgencyService.pauseAgencyJob(jobId);
};

const resumeAgencyJob = async (jobId) => {
  log.debug('Resuming agency job via GraphQL', { jobId });
  return graphqlAgencyService.resumeAgencyJob(jobId);
};

const closeAgencyJob = async (jobId) => {
  log.debug('Closing agency job via GraphQL', { jobId });
  return graphqlAgencyService.closeAgencyJob(jobId);
};

const markJobAsFilled = async (jobId) => {
  log.debug('Marking job as filled via GraphQL', { jobId });
  return graphqlAgencyService.markJobAsFilled(jobId);
};

const cloneAgencyJob = async (jobId) => {
  log.debug('Cloning agency job via GraphQL', { jobId });
  return graphqlAgencyService.cloneAgencyJob(jobId);
};

const incrementJobViewCount = async (jobId) => {
  log.debug('Incrementing job view count via GraphQL', { jobId });
  return graphqlAgencyService.incrementJobViewCount(jobId);
};

// ============================================================================
// APPLICATIONS MANAGEMENT (GraphQL)
// ============================================================================

const getApplications = async (filters = {}) => {
  log.debug('Getting applications via GraphQL', { filters });
  return graphqlAgencyService.getApplications(filters);
};

const getApplicationById = async (applicationId) => {
  log.debug('Getting application by ID via GraphQL', { applicationId });
  return graphqlAgencyService.getApplicationById(applicationId);
};

const updateApplicationStatus = async (applicationId, status, metadata = {}) => {
  log.debug('Updating application status via GraphQL', { applicationId, status });
  return graphqlAgencyService.updateApplicationStatus(applicationId, status, metadata);
};

const shortlistApplication = async (applicationId) => {
  log.debug('Shortlisting application via GraphQL', { applicationId });
  return graphqlAgencyService.shortlistApplication(applicationId);
};

const scheduleInterview = async (applicationId, interviewData) => {
  log.debug('Scheduling interview via GraphQL', { applicationId });
  return graphqlAgencyService.scheduleInterview(applicationId, interviewData);
};

const sendOffer = async (applicationId, offerData) => {
  log.debug('Sending offer via GraphQL', { applicationId });
  return graphqlAgencyService.sendOffer(applicationId, offerData);
};

const rejectApplication = async (applicationId, reason = null) => {
  log.debug('Rejecting application via GraphQL', { applicationId });
  return graphqlAgencyService.rejectApplication(applicationId, reason);
};

const hireApplicant = async (applicationId) => {
  log.debug('Hiring applicant via GraphQL', { applicationId });
  return graphqlAgencyService.hireApplicant(applicationId);
};

const markApplicationAsViewed = async (applicationId) => {
  log.debug('Marking application as viewed via GraphQL', { applicationId });
  return graphqlAgencyService.markApplicationAsViewed(applicationId);
};

const addApplicationNotes = async (applicationId, notes) => {
  log.debug('Adding application notes via GraphQL', { applicationId });
  return graphqlAgencyService.addApplicationNotes(applicationId, notes);
};

const getApplicationStats = async () => {
  log.debug('Getting application stats via GraphQL');
  return graphqlAgencyService.getApplicationStats();
};

// ============================================================================
// SHORTLIST MANAGEMENT (GraphQL)
// ============================================================================

const getShortlists = async (filters = {}) => {
  log.debug('Getting shortlists via GraphQL', { filters });
  return graphqlAgencyService.getShortlists(filters);
};

const getShortlistById = async (shortlistId) => {
  log.debug('Getting shortlist by ID via GraphQL', { shortlistId });
  return graphqlAgencyService.getShortlistById(shortlistId);
};

const createShortlist = async (shortlistData) => {
  log.debug('Creating shortlist via GraphQL');
  return graphqlAgencyService.createShortlist(shortlistData);
};

const updateShortlist = async (shortlistId, updates) => {
  log.debug('Updating shortlist via GraphQL', { shortlistId });
  return graphqlAgencyService.updateShortlist(shortlistId, updates);
};

const deleteShortlist = async (shortlistId) => {
  log.debug('Deleting shortlist via GraphQL', { shortlistId });
  return graphqlAgencyService.deleteShortlist(shortlistId);
};

const addCandidateToShortlist = async (shortlistId, maidId, candidateData = {}) => {
  log.debug('Adding candidate to shortlist via GraphQL', { shortlistId, maidId });
  return graphqlAgencyService.addCandidateToShortlist(shortlistId, maidId, candidateData);
};

const removeCandidateFromShortlist = async (shortlistId, maidId) => {
  log.debug('Removing candidate from shortlist via GraphQL', { shortlistId, maidId });
  return graphqlAgencyService.removeCandidateFromShortlist(shortlistId, maidId);
};

const updateShortlistCandidateNotes = async (shortlistId, maidId, notes) => {
  log.debug('Updating shortlist candidate notes via GraphQL', { shortlistId, maidId });
  return graphqlAgencyService.updateShortlistCandidateNotes(shortlistId, maidId, notes);
};

const archiveShortlist = async (shortlistId) => {
  log.debug('Archiving shortlist via GraphQL', { shortlistId });
  return graphqlAgencyService.archiveShortlist(shortlistId);
};

const activateShortlist = async (shortlistId) => {
  log.debug('Activating shortlist via GraphQL', { shortlistId });
  return graphqlAgencyService.activateShortlist(shortlistId);
};

// ============================================================================
// PROFILE EDIT REQUESTS (Admin Approval Workflow)
// ============================================================================

const submitProfileEditRequest = async (requestData) => {
  log.debug('Submitting profile edit request via GraphQL');
  return graphqlAgencyService.submitProfileEditRequest(requestData);
};

const getPendingEditRequests = async (agencyId) => {
  log.debug('Getting pending edit requests via GraphQL', { agencyId });
  return graphqlAgencyService.getPendingEditRequests(agencyId);
};

// ============================================================================
// AUTH & TEAM MANAGEMENT (Firebase)
// ============================================================================

const changePassword = async (currentPassword, newPassword) => {
  log.debug('Changing password via Firebase');
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    log.error('Failed to change password:', error);
    throw error;
  }
};

const inviteTeamMember = async (email, role) => {
  log.debug('Inviting team member - not implemented (use Firebase Admin SDK)');
  // Team invitations should be handled via Firebase Cloud Functions
  throw new Error('Team invitations not yet implemented. Contact support.');
};

const cancelInvitation = async (invitationId) => {
  log.debug('Canceling invitation - not implemented');
  throw new Error('Invitation cancellation not yet implemented. Contact support.');
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS (Stub - use Apollo subscriptions or polling)
// ============================================================================

const subscribeMaidProfiles = (callback) => {
  log.debug('subscribeMaidProfiles: Use Apollo Client subscriptions or polling');
  // Return a no-op unsubscribe function
  return () => {};
};

const subscribeAgencyProfile = (callback) => {
  log.debug('subscribeAgencyProfile: Use Apollo Client subscriptions or polling');
  // Return a no-op unsubscribe function
  return () => {};
};

const unsubscribeAll = () => {
  log.debug('unsubscribeAll: No-op (Supabase subscriptions removed)');
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getLocalStorageUsage = () => {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage.getItem(key).length * 2; // UTF-16 chars = 2 bytes
      }
    }
    return {
      used: total,
      usedMB: (total / (1024 * 1024)).toFixed(2),
      quota: 5 * 1024 * 1024, // 5MB typical quota
      quotaMB: 5
    };
  } catch (error) {
    return { used: 0, usedMB: '0', quota: 5 * 1024 * 1024, quotaMB: 5 };
  }
};

const clearLocalStorageData = (prefix = 'agency_') => {
  const keysToRemove = [];
  for (const key in localStorage) {
    if (key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  return keysToRemove.length;
};

const getPrimaryImageUrl = (images) => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }
  // Find primary image or return first
  const primary = images.find(img => img.is_primary);
  return primary?.url || images[0]?.url || null;
};

// Export the service
export const agencyService = {
  // Profile operations
  getAgencyProfile,
  getAgencySettings,
  updateAgencySettings,
  updateAgencyProfile,

  // Maids management
  getAgencyMaids,
  createMaidProfile,
  bulkCreateMaidProfiles,
  removeAgencyMaid,
  getAgencyMaidById,
  addAgencyMaid,
  updateAgencyMaid,
  checkPassportUniqueness,

  // Jobs management
  getAgencyJobs,
  getAgencyJobById,
  createAgencyJob,
  updateAgencyJob,
  deleteAgencyJob,
  pauseAgencyJob,
  resumeAgencyJob,
  closeAgencyJob,
  markJobAsFilled,
  cloneAgencyJob,
  incrementJobViewCount,

  // Applications management
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  shortlistApplication,
  scheduleInterview,
  sendOffer,
  rejectApplication,
  hireApplicant,
  markApplicationAsViewed,
  addApplicationNotes,
  getApplicationStats,

  // Shortlist management
  getShortlists,
  getShortlistById,
  createShortlist,
  updateShortlist,
  deleteShortlist,
  addCandidateToShortlist,
  removeCandidateFromShortlist,
  updateShortlistCandidateNotes,
  archiveShortlist,
  activateShortlist,

  // Profile edit requests (admin approval workflow)
  submitProfileEditRequest,
  getPendingEditRequests,

  // Auth & team management (Firebase)
  changePassword,
  inviteTeamMember,
  cancelInvitation,

  // Real-time subscriptions (stubs)
  subscribeMaidProfiles,
  subscribeAgencyProfile,
  unsubscribeAll,
};

// Export utility functions
export { getLocalStorageUsage, clearLocalStorageData, getPrimaryImageUrl };

export default agencyService;
