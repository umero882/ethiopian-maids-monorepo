/**
 * Analytics Service
 *
 * This module exports the GraphQL implementation of analytics services.
 * Supabase fallback has been removed as part of the GraphQL migration.
 */

import { graphqlAnalyticsService } from './analyticsService.graphql';
import { createLogger } from '@/utils/logger';

const log = createLogger('AnalyticsService');

/**
 * Analytics Service - GraphQL implementation
 */
export const analyticsService = {
  // ============================================================================
  // PAGE VIEW TRACKING
  // ============================================================================

  async trackPageView(pageViewData) {
    log.debug('Tracking page view via GraphQL');
    return graphqlAnalyticsService.trackPageView(pageViewData);
  },

  async getPageViews(options = {}) {
    log.debug('Getting page views via GraphQL');
    return graphqlAnalyticsService.getPageViews(options);
  },

  async getPopularPages(daysBack = 7, limit = 10) {
    log.debug('Getting popular pages via GraphQL', { daysBack, limit });
    return graphqlAnalyticsService.getPopularPages(daysBack, limit);
  },

  // ============================================================================
  // EVENT TRACKING
  // ============================================================================

  async trackEvent(eventData) {
    log.debug('Tracking event via GraphQL');
    return graphqlAnalyticsService.trackEvent(eventData);
  },

  async getUserEvents(options = {}) {
    log.debug('Getting user events via GraphQL');
    return graphqlAnalyticsService.getUserEvents(options);
  },

  async getTopEvents(daysBack = 7, limit = 10) {
    log.debug('Getting top events via GraphQL', { daysBack, limit });
    return graphqlAnalyticsService.getTopEvents(daysBack, limit);
  },

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async createSession(sessionData) {
    log.debug('Creating session via GraphQL');
    return graphqlAnalyticsService.createSession(sessionData);
  },

  async updateSession(sessionId, updates) {
    log.debug('Updating session via GraphQL', { sessionId });
    return graphqlAnalyticsService.updateSession(sessionId, updates);
  },

  async getUserSessions(userId, options = {}) {
    log.debug('Getting user sessions via GraphQL', { userId });
    return graphqlAnalyticsService.getUserSessions(userId, options);
  },

  async getActiveSessions() {
    log.debug('Getting active sessions via GraphQL');
    return graphqlAnalyticsService.getActiveSessions();
  },

  // ============================================================================
  // CONVERSION TRACKING
  // ============================================================================

  async trackConversion(conversionData) {
    log.debug('Tracking conversion via GraphQL');
    return graphqlAnalyticsService.trackConversion(conversionData);
  },

  async getConversions(options = {}) {
    log.debug('Getting conversions via GraphQL');
    return graphqlAnalyticsService.getConversions(options);
  },

  async getConversionMetrics(options = {}) {
    log.debug('Getting conversion metrics via GraphQL');
    return graphqlAnalyticsService.getConversionMetrics(options);
  },

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getActiveSource() {
    return 'GraphQL';
  },
};

export default analyticsService;
