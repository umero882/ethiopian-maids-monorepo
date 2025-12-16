/**
 * Analytics Service - GraphQL Implementation
 * Uses inline gql documents to bypass codegen requirement
 *
 * This service handles all analytics tracking via GraphQL/Hasura
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('AnalyticsService.GraphQL');

// =====================================================
// INLINE GRAPHQL DOCUMENTS - PAGE VIEWS
// =====================================================

const TrackPageViewDocument = gql`
  mutation TrackPageView($data: page_views_insert_input!) {
    insert_page_views_one(object: $data) {
      id
      user_id
      session_id
      path
      page_title
      load_time
      duration
      viewed_at
    }
  }
`;

const GetPageViewsDocument = gql`
  query GetPageViews(
    $limit: Int = 50
    $offset: Int = 0
    $userId: uuid
    $startDate: timestamptz
  ) {
    page_views(
      where: {
        user_id: {_eq: $userId}
        viewed_at: {_gte: $startDate}
      }
      limit: $limit
      offset: $offset
      order_by: [{viewed_at: desc}]
    ) {
      id
      user_id
      session_id
      path
      page_title
      referrer
      device_type
      duration
      viewed_at
    }
    page_views_aggregate(
      where: {
        user_id: {_eq: $userId}
        viewed_at: {_gte: $startDate}
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GetPopularPagesDocument = gql`
  query GetPopularPages($startDate: timestamptz!, $limit: Int = 10) {
    page_views(
      where: {viewed_at: {_gte: $startDate}}
      limit: $limit
    ) {
      path
      page_title
    }
    page_views_aggregate(
      where: {viewed_at: {_gte: $startDate}}
    ) {
      aggregate {
        count
      }
      nodes {
        path
      }
    }
  }
`;

// =====================================================
// INLINE GRAPHQL DOCUMENTS - USER EVENTS
// =====================================================

const TrackEventDocument = gql`
  mutation TrackEvent($data: user_events_insert_input!) {
    insert_user_events_one(object: $data) {
      id
      user_id
      session_id
      event_name
      event_category
      event_action
      properties
      occurred_at
    }
  }
`;

const GetUserEventsDocument = gql`
  query GetUserEvents(
    $userId: uuid
    $sessionId: uuid
    $eventName: String
    $startDate: timestamptz
    $limit: Int = 50
    $offset: Int = 0
  ) {
    user_events(
      where: {
        user_id: {_eq: $userId}
        session_id: {_eq: $sessionId}
        event_name: {_eq: $eventName}
        occurred_at: {_gte: $startDate}
      }
      limit: $limit
      offset: $offset
      order_by: [{occurred_at: desc}]
    ) {
      id
      user_id
      session_id
      event_name
      event_category
      event_action
      event_label
      event_value
      page_path
      properties
      occurred_at
    }
    user_events_aggregate(
      where: {
        user_id: {_eq: $userId}
        session_id: {_eq: $sessionId}
        event_name: {_eq: $eventName}
        occurred_at: {_gte: $startDate}
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GetTopEventsDocument = gql`
  query GetTopEvents($startDate: timestamptz!, $limit: Int = 10) {
    user_events_aggregate(
      where: {occurred_at: {_gte: $startDate}}
    ) {
      aggregate {
        count
      }
      nodes {
        event_name
        event_category
      }
    }
  }
`;

// =====================================================
// INLINE GRAPHQL DOCUMENTS - USER SESSIONS
// =====================================================

const CreateSessionDocument = gql`
  mutation CreateSession($data: user_sessions_insert_input!) {
    insert_user_sessions_one(object: $data) {
      id
      user_id
      session_start
      entry_page
      device_type
      browser
      os
    }
  }
`;

// Note: user_sessions.id is a real UUID (not user ID), keep uuid type
const UpdateSessionDocument = gql`
  mutation UpdateSession($id: uuid!, $updates: user_sessions_set_input!) {
    update_user_sessions_by_pk(pk_columns: {id: $id}, _set: $updates) {
      id
      session_end
      duration
      exit_page
      page_views_count
      events_count
      is_active
    }
  }
`;

// Note: userId uses String type (Firebase UID)
const GetUserSessionsDocument = gql`
  query GetUserSessions(
    $userId: String!
    $limit: Int = 20
    $offset: Int = 0
  ) {
    user_sessions(
      where: {user_id: {_eq: $userId}}
      limit: $limit
      offset: $offset
      order_by: [{session_start: desc}]
    ) {
      id
      user_id
      session_start
      session_end
      duration
      entry_page
      exit_page
      page_views_count
      events_count
      device_type
      browser
      is_active
    }
    user_sessions_aggregate(where: {user_id: {_eq: $userId}}) {
      aggregate {
        count
        avg {
          duration
        }
      }
    }
  }
`;

// =====================================================
// INLINE GRAPHQL DOCUMENTS - CONVERSIONS
// =====================================================

const TrackConversionDocument = gql`
  mutation TrackConversion($data: conversion_events_insert_input!) {
    insert_conversion_events_one(object: $data) {
      id
      user_id
      session_id
      conversion_type
      conversion_value
      currency
      related_id
      related_type
      converted_at
    }
  }
`;

const GetConversionsDocument = gql`
  query GetConversions(
    $userId: uuid
    $conversionType: String
    $startDate: timestamptz
    $limit: Int = 50
    $offset: Int = 0
  ) {
    conversion_events(
      where: {
        user_id: {_eq: $userId}
        conversion_type: {_eq: $conversionType}
        converted_at: {_gte: $startDate}
      }
      limit: $limit
      offset: $offset
      order_by: [{converted_at: desc}]
    ) {
      id
      user_id
      session_id
      conversion_type
      conversion_value
      currency
      related_id
      related_type
      properties
      converted_at
    }
    conversion_events_aggregate(
      where: {
        user_id: {_eq: $userId}
        conversion_type: {_eq: $conversionType}
        converted_at: {_gte: $startDate}
      }
    ) {
      aggregate {
        count
        sum {
          conversion_value
        }
      }
    }
  }
`;

// =====================================================
// SERVICE IMPLEMENTATION
// =====================================================

export const graphqlAnalyticsService = {
  // =====================================================
  // PAGE VIEW METHODS
  // =====================================================

  /**
   * Track a page view
   */
  async trackPageView(pageViewData) {
    try {
      log.info('📄 [GraphQL] Tracking page view:', pageViewData.path);

      const { data, errors } = await apolloClient.mutate({
        mutation: TrackPageViewDocument,
        variables: {
          data: {
            user_id: pageViewData.user_id || null,
            session_id: pageViewData.session_id,
            path: pageViewData.path,
            page_title: pageViewData.page_title || null,
            referrer: pageViewData.referrer || null,
            user_agent: pageViewData.user_agent || null,
            device_type: pageViewData.device_type || null,
            browser: pageViewData.browser || null,
            os: pageViewData.os || null,
            load_time: pageViewData.load_time || null,
          },
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const pageView = data?.insert_page_views_one;
      log.info('✅ [GraphQL] Page view tracked:', pageView?.id);
      return { data: pageView, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error tracking page view:', error);
      return { data: null, error };
    }
  },

  /**
   * Get page views
   */
  async getPageViews(options = {}) {
    try {
      log.info('📊 [GraphQL] Fetching page views');

      const { data, errors } = await apolloClient.query({
        query: GetPageViewsDocument,
        variables: {
          userId: options.userId || null,
          startDate: options.startDate || null,
          limit: options.limit || 50,
          offset: options.offset || 0,
        },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const pageViews = data?.page_views || [];
      const totalCount = data?.page_views_aggregate?.aggregate?.count || 0;

      log.info(`✅ [GraphQL] Fetched ${pageViews.length} page views`);
      return { data: { page_views: pageViews, total: totalCount }, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching page views:', error);
      return { data: { page_views: [], total: 0 }, error };
    }
  },

  /**
   * Get popular pages
   */
  async getPopularPages(daysBack = 7, limit = 10) {
    try {
      log.info('🔥 [GraphQL] Fetching popular pages');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, errors } = await apolloClient.query({
        query: GetPopularPagesDocument,
        variables: {
          startDate: startDate.toISOString(),
          limit,
        },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      // Group by path and count
      const pathCounts = {};
      const pathUsers = {};

      data?.page_views_aggregate?.nodes?.forEach(node => {
        pathCounts[node.path] = (pathCounts[node.path] || 0) + 1;
        if (!pathUsers[node.path]) {
          pathUsers[node.path] = new Set();
        }
      });

      const popular = Object.entries(pathCounts)
        .map(([path, count]) => ({
          path,
          view_count: count,
          unique_users: pathUsers[path]?.size || 0
        }))
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, limit);

      log.info(`✅ [GraphQL] Found ${popular.length} popular pages`);
      return { data: popular, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching popular pages:', error);
      return { data: [], error };
    }
  },

  // =====================================================
  // EVENT TRACKING METHODS
  // =====================================================

  /**
   * Track a user event
   */
  async trackEvent(eventData) {
    try {
      log.info('🎯 [GraphQL] Tracking event:', eventData.event_name);

      const { data, errors } = await apolloClient.mutate({
        mutation: TrackEventDocument,
        variables: {
          data: {
            user_id: eventData.user_id || null,
            session_id: eventData.session_id,
            event_name: eventData.event_name,
            event_category: eventData.event_category || null,
            event_action: eventData.event_action || null,
            event_label: eventData.event_label || null,
            event_value: eventData.event_value || null,
            page_path: eventData.page_path || null,
            element_id: eventData.element_id || null,
            element_text: eventData.element_text || null,
            properties: eventData.properties || null,
          },
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const event = data?.insert_user_events_one;
      log.info('✅ [GraphQL] Event tracked:', event?.id);
      return { data: event, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error tracking event:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user events
   */
  async getUserEvents(options = {}) {
    try {
      log.info('📈 [GraphQL] Fetching user events');

      const { data, errors } = await apolloClient.query({
        query: GetUserEventsDocument,
        variables: {
          userId: options.userId || null,
          sessionId: options.sessionId || null,
          eventName: options.eventName || null,
          startDate: options.startDate || null,
          limit: options.limit || 50,
          offset: options.offset || 0,
        },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const events = data?.user_events || [];
      const totalCount = data?.user_events_aggregate?.aggregate?.count || 0;

      log.info(`✅ [GraphQL] Fetched ${events.length} events`);
      return { data: events, count: totalCount, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching events:', error);
      return { data: [], count: 0, error };
    }
  },

  /**
   * Get top events
   */
  async getTopEvents(daysBack = 7, limit = 10) {
    try {
      log.info('🏆 [GraphQL] Fetching top events');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, errors } = await apolloClient.query({
        query: GetTopEventsDocument,
        variables: {
          startDate: startDate.toISOString(),
          limit,
        },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      // Group by event name and count
      const eventCounts = {};
      const eventUsers = {};

      data?.user_events_aggregate?.nodes?.forEach(node => {
        eventCounts[node.event_name] = (eventCounts[node.event_name] || 0) + 1;
        if (!eventUsers[node.event_name]) {
          eventUsers[node.event_name] = new Set();
        }
      });

      const topEvents = Object.entries(eventCounts)
        .map(([name, count]) => ({
          event_name: name,
          event_count: count,
          unique_users: eventUsers[name]?.size || 0
        }))
        .sort((a, b) => b.event_count - a.event_count)
        .slice(0, limit);

      log.info(`✅ [GraphQL] Found ${topEvents.length} top events`);
      return { data: topEvents, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching top events:', error);
      return { data: [], error };
    }
  },

  // =====================================================
  // SESSION METHODS
  // =====================================================

  /**
   * Create a new session
   */
  async createSession(sessionData) {
    try {
      log.info('🆕 [GraphQL] Creating session with data:', sessionData);

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateSessionDocument,
        variables: {
          data: {
            user_id: sessionData.user_id || null,
            entry_page: sessionData.entry_page,
            device_type: sessionData.device_type || null,
            browser: sessionData.browser || null,
            os: sessionData.os || null,
            country: sessionData.country || null,
            city: sessionData.city || null,
          },
        },
      });

      if (errors && errors.length > 0) {
        log.error('❌ [GraphQL] GraphQL errors:', errors);
        throw new Error(errors[0].message);
      }

      const session = data?.insert_user_sessions_one;

      if (!session) {
        log.error('❌ [GraphQL] No session returned. Full response:', data);
        throw new Error('No session data returned from mutation');
      }

      log.info('✅ [GraphQL] Session created:', session.id);
      return { data: session, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error creating session:', error);
      return { data: null, error };
    }
  },

  /**
   * Update a session
   */
  async updateSession(sessionId, updates) {
    try {
      log.info('✏️ [GraphQL] Updating session:', sessionId);

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateSessionDocument,
        variables: {
          id: sessionId,
          updates,
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const session = data?.update_user_sessions_by_pk;
      log.info('✅ [GraphQL] Session updated');
      return { data: session, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error updating session:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user sessions
   */
  async getUserSessions(userId, options = {}) {
    try {
      log.info('📅 [GraphQL] Fetching user sessions');

      const { data, errors } = await apolloClient.query({
        query: GetUserSessionsDocument,
        variables: {
          userId,
          limit: options.limit || 20,
          offset: options.offset || 0,
        },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const sessions = data?.user_sessions || [];
      const totalCount = data?.user_sessions_aggregate?.aggregate?.count || 0;
      const avgDuration = data?.user_sessions_aggregate?.aggregate?.avg?.duration || 0;

      log.info(`✅ [GraphQL] Fetched ${sessions.length} sessions`);
      return {
        data: {
          sessions,
          total: totalCount,
          avgDuration: Math.round(avgDuration),
        },
        error: null,
      };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching sessions:', error);
      return { data: { sessions: [], total: 0, avgDuration: 0 }, error };
    }
  },

  // =====================================================
  // CONVERSION METHODS
  // =====================================================

  /**
   * Track a conversion
   */
  async trackConversion(conversionData) {
    try {
      log.info('💰 [GraphQL] Tracking conversion:', conversionData.conversion_type);

      const { data, errors } = await apolloClient.mutate({
        mutation: TrackConversionDocument,
        variables: {
          data: {
            user_id: conversionData.user_id || null,
            session_id: conversionData.session_id || null,
            conversion_type: conversionData.conversion_type,
            conversion_value: conversionData.conversion_value || null,
            currency: conversionData.currency || 'USD',
            related_id: conversionData.related_id || null,
            related_type: conversionData.related_type || null,
            properties: conversionData.properties || null,
          },
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const conversion = data?.insert_conversion_events_one;
      log.info('✅ [GraphQL] Conversion tracked:', conversion?.id);
      return { data: conversion, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error tracking conversion:', error);
      return { data: null, error };
    }
  },

  /**
   * Get conversions
   */
  async getConversions(options = {}) {
    try {
      log.info('💵 [GraphQL] Fetching conversions');

      const { data, errors } = await apolloClient.query({
        query: GetConversionsDocument,
        variables: {
          userId: options.userId || null,
          conversionType: options.conversionType || null,
          startDate: options.startDate || null,
          limit: options.limit || 50,
          offset: options.offset || 0,
        },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const conversions = data?.conversion_events || [];
      const totalCount = data?.conversion_events_aggregate?.aggregate?.count || 0;
      const totalValue = data?.conversion_events_aggregate?.aggregate?.sum?.conversion_value || 0;

      log.info(`✅ [GraphQL] Fetched ${conversions.length} conversions`);
      return {
        data: {
          conversions,
          total: totalCount,
          total_value: parseFloat(totalValue.toFixed(2)),
        },
        error: null,
      };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching conversions:', error);
      return { data: { conversions: [], total: 0, total_value: 0 }, error };
    }
  },
};

export default graphqlAnalyticsService;
