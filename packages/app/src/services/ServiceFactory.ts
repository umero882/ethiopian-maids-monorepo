/**
 * Service Factory
 * Centralized factory for creating and managing all application services
 * Implements Singleton pattern for service instances
 */

import { ApolloClient } from '@apollo/client';
import { MaidProfileService } from './MaidProfileService.js';
import { SponsorProfileService } from './SponsorProfileService.js';
import { AgencyProfileService } from './AgencyProfileService.js';
import { JobPostingService } from './JobPostingService.js';
import { JobApplicationService } from './JobApplicationService.js';
import { MessageService } from './MessageService.js';
import { NotificationService } from './NotificationService.js';

/**
 * ServiceFactory provides centralized access to all application services.
 *
 * Usage:
 * ```typescript
 * import { ServiceFactory } from '@ethio/app';
 *
 * // Initialize once at app startup
 * ServiceFactory.initialize(apolloClient);
 *
 * // Use services anywhere in the app
 * const maidService = ServiceFactory.getMaidProfileService();
 * const profile = await maidService.createProfile({...});
 * ```
 */
export class ServiceFactory {
  private static instance: ServiceFactory | null = null;

  private maidProfileService: MaidProfileService;
  private sponsorProfileService: SponsorProfileService;
  private agencyProfileService: AgencyProfileService;
  private jobPostingService: JobPostingService;
  private jobApplicationService: JobApplicationService;
  private messageService: MessageService;
  private notificationService: NotificationService;

  private constructor(apolloClient: ApolloClient<any>) {
    // Initialize all services with the Apollo Client
    this.maidProfileService = new MaidProfileService(apolloClient);
    this.sponsorProfileService = new SponsorProfileService(apolloClient);
    this.agencyProfileService = new AgencyProfileService(apolloClient);
    this.jobPostingService = new JobPostingService(apolloClient);
    this.jobApplicationService = new JobApplicationService(apolloClient);
    this.messageService = new MessageService(apolloClient);
    this.notificationService = new NotificationService(apolloClient);
  }

  /**
   * Initialize the ServiceFactory with an Apollo Client instance.
   * Must be called once at application startup before using any services.
   *
   * @param apolloClient - Configured Apollo Client instance
   * @throws Error if already initialized (call reset() first to reinitialize)
   */
  static initialize(apolloClient: ApolloClient<any>): void {
    if (ServiceFactory.instance !== null) {
      throw new Error(
        'ServiceFactory is already initialized. Call ServiceFactory.reset() before reinitializing.'
      );
    }
    ServiceFactory.instance = new ServiceFactory(apolloClient);
  }

  /**
   * Reset the ServiceFactory instance.
   * Useful for testing or when switching Apollo Client instances.
   */
  static reset(): void {
    ServiceFactory.instance = null;
  }

  /**
   * Check if ServiceFactory has been initialized.
   */
  static isInitialized(): boolean {
    return ServiceFactory.instance !== null;
  }

  /**
   * Get the ServiceFactory instance.
   * @throws Error if not initialized
   */
  private static getInstance(): ServiceFactory {
    if (ServiceFactory.instance === null) {
      throw new Error(
        'ServiceFactory is not initialized. Call ServiceFactory.initialize(apolloClient) first.'
      );
    }
    return ServiceFactory.instance;
  }

  // ========== Service Getters ==========

  /**
   * Get the MaidProfileService instance.
   * Handles all maid profile operations (CRUD, search, verification, etc.)
   */
  static getMaidProfileService(): MaidProfileService {
    return ServiceFactory.getInstance().maidProfileService;
  }

  /**
   * Get the SponsorProfileService instance.
   * Handles all sponsor profile operations (CRUD, search, favorites, etc.)
   */
  static getSponsorProfileService(): SponsorProfileService {
    return ServiceFactory.getInstance().sponsorProfileService;
  }

  /**
   * Get the AgencyProfileService instance.
   * Handles all agency profile operations (CRUD, search, statistics, etc.)
   */
  static getAgencyProfileService(): AgencyProfileService {
    return ServiceFactory.getInstance().agencyProfileService;
  }

  /**
   * Get the JobPostingService instance.
   * Handles all job posting operations (CRUD, search, publish, matching, etc.)
   */
  static getJobPostingService(): JobPostingService {
    return ServiceFactory.getInstance().jobPostingService;
  }

  /**
   * Get the JobApplicationService instance.
   * Handles all job application operations (submit, review, shortlist, accept, etc.)
   */
  static getJobApplicationService(): JobApplicationService {
    return ServiceFactory.getInstance().jobApplicationService;
  }

  /**
   * Get the MessageService instance.
   * Handles all messaging operations (send, conversations, read status, etc.)
   */
  static getMessageService(): MessageService {
    return ServiceFactory.getInstance().messageService;
  }

  /**
   * Get the NotificationService instance.
   * Handles all notification operations (create, read, delete, search, etc.)
   */
  static getNotificationService(): NotificationService {
    return ServiceFactory.getInstance().notificationService;
  }

  // ========== Utility Methods ==========

  /**
   * Get all services as an object.
   * Useful for debugging or testing.
   */
  static getAllServices(): {
    maidProfile: MaidProfileService;
    sponsorProfile: SponsorProfileService;
    agencyProfile: AgencyProfileService;
    jobPosting: JobPostingService;
    jobApplication: JobApplicationService;
    message: MessageService;
    notification: NotificationService;
  } {
    const instance = ServiceFactory.getInstance();
    return {
      maidProfile: instance.maidProfileService,
      sponsorProfile: instance.sponsorProfileService,
      agencyProfile: instance.agencyProfileService,
      jobPosting: instance.jobPostingService,
      jobApplication: instance.jobApplicationService,
      message: instance.messageService,
      notification: instance.notificationService,
    };
  }
}
