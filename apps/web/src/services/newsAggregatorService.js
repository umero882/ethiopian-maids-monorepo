import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

/**
 * News Aggregator Service
 * Fetches and manages news from multiple sources including:
 * - GCC labor news
 * - Platform announcements
 * - User activity updates
 * Migrated to GraphQL/Hasura
 */

// GraphQL Queries
const GET_LATEST_ANNOUNCEMENTS = gql`
  query GetLatestAnnouncements($limit: Int!) {
    platform_announcements(
      where: { is_active: { _eq: true } }
      order_by: { priority: desc, published_at: desc }
      limit: $limit
    ) {
      id
      title
      message
      icon
      color
      source
      type
      priority
      published_at
    }
    activity_announcements(
      where: { is_public: { _eq: true } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      title
      description
      activity_type
      created_at
    }
  }
`;

const INSERT_PLATFORM_ANNOUNCEMENT = gql`
  mutation InsertPlatformAnnouncement($object: platform_announcements_insert_input!) {
    insert_platform_announcements_one(object: $object) {
      id
      type
      title
      message
      icon
      color
      priority
      target_audience
      url
      is_active
      created_at
    }
  }
`;

const INSERT_ACTIVITY_ANNOUNCEMENT = gql`
  mutation InsertActivityAnnouncement($object: activity_announcements_insert_input!) {
    insert_activity_announcements_one(object: $object) {
      id
      activity_type
      title
      description
      user_id
      agency_id
      metadata
      is_public
      created_at
    }
  }
`;

class NewsAggregatorService {
  constructor() {
    this.lastFetch = null;
    this.cache = [];
    this.updateInterval = 60 * 60 * 1000; // 1 hour in milliseconds
    this.subscribers = [];
  }

  /**
   * Initialize the service and start periodic updates
   */
  async initialize() {
    try {
      await this.fetchAllAnnouncements();
      this.startPeriodicUpdates();
      console.log('[NewsAggregator] Service initialized successfully');
    } catch (error) {
      console.error('[NewsAggregator] Initialization failed:', error);
    }
  }

  /**
   * Fetch all announcements from the database
   */
  async fetchAllAnnouncements() {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_LATEST_ANNOUNCEMENTS,
        variables: { limit: 20 },
        fetchPolicy: 'network-only'
      });

      if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

      // Combine platform and activity announcements
      const platformAnnouncements = data?.platform_announcements || [];
      const activityAnnouncements = data?.activity_announcements || [];

      // Format platform announcements
      const formattedPlatform = platformAnnouncements.map(item => ({
        id: item.id,
        text: item.title,
        description: item.message,
        icon: this.getIconComponent(item.icon),
        color: this.getColorClass(item.color),
        source: item.source || 'Platform',
        type: item.type || 'platform',
        priority: item.priority,
        publishedAt: item.published_at,
        timeAgo: this.getTimeAgo(item.published_at),
        isLive: this.isRecent(item.published_at)
      }));

      // Format activity announcements
      const formattedActivity = activityAnnouncements.map(item => ({
        id: item.id,
        text: item.title,
        description: item.description,
        icon: this.getIconForActivityType(item.activity_type),
        color: 'text-blue-600',
        source: 'Activity',
        type: 'activity',
        priority: 5,
        publishedAt: item.created_at,
        timeAgo: this.getTimeAgo(item.created_at),
        isLive: this.isRecent(item.created_at)
      }));

      // Combine and sort by priority
      this.cache = [...formattedPlatform, ...formattedActivity]
        .sort((a, b) => b.priority - a.priority);

      this.lastFetch = new Date();
      this.notifySubscribers();

      console.log(`[NewsAggregator] Fetched ${this.cache.length} announcements`);
      return this.cache;
    } catch (error) {
      console.error('[NewsAggregator] Failed to fetch announcements:', error);
      return this.getFallbackAnnouncements();
    }
  }

  /**
   * Get icon for activity type
   */
  getIconForActivityType(activityType) {
    const iconMap = {
      'new_maid': 'UserPlus',
      'placement': 'CheckCircle',
      'registration': 'Users',
      'booking': 'Briefcase',
      'review': 'Star'
    };
    return iconMap[activityType] || 'Info';
  }

  /**
   * Get icon component name from string
   */
  getIconComponent(iconName) {
    const iconMap = {
      'Briefcase': 'Briefcase',
      'Globe': 'Globe',
      'Users': 'Users',
      'UserPlus': 'UserPlus',
      'CheckCircle': 'CheckCircle',
      'Award': 'Award',
      'TrendingUp': 'TrendingUp',
      'Star': 'Star',
      'Sparkles': 'Sparkles',
      'Tag': 'Tag',
      'HeadphonesIcon': 'Headphones',
      'Info': 'Info'
    };
    return iconMap[iconName] || 'Info';
  }

  /**
   * Get Tailwind color classes
   */
  getColorClass(color) {
    const colorMap = {
      'green': 'text-green-600',
      'blue': 'text-blue-600',
      'purple': 'text-purple-600',
      'amber': 'text-amber-600',
      'red': 'text-red-600',
      'yellow': 'text-yellow-600'
    };
    return colorMap[color] || 'text-blue-600';
  }

  /**
   * Calculate time ago from timestamp
   */
  getTimeAgo(timestamp) {
    if (!timestamp) return 'Recently';

    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  }

  /**
   * Check if announcement is recent (within last hour)
   */
  isRecent(timestamp) {
    if (!timestamp) return false;
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    return diffMs < 60 * 60 * 1000; // 1 hour
  }

  /**
   * Start periodic updates
   */
  startPeriodicUpdates() {
    // Clear any existing interval
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }

    // Fetch updates every hour
    this.updateIntervalId = setInterval(async () => {
      console.log('[NewsAggregator] Running scheduled update...');
      await this.fetchAllAnnouncements();
    }, this.updateInterval);
  }

  /**
   * Stop periodic updates
   */
  stopPeriodicUpdates() {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }

  /**
   * Subscribe to announcement updates
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers of updates
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.cache);
      } catch (error) {
        console.error('[NewsAggregator] Subscriber notification failed:', error);
      }
    });
  }

  /**
   * Get cached announcements
   */
  getAnnouncements() {
    return this.cache;
  }

  /**
   * Force refresh announcements
   */
  async refresh() {
    console.log('[NewsAggregator] Manual refresh triggered');
    return await this.fetchAllAnnouncements();
  }

  /**
   * Fallback announcements when API fails
   */
  getFallbackAnnouncements() {
    return [
      {
        id: 'fallback-1',
        text: '1000+ Verified Domestic Workers Across GCC',
        description: 'Join our growing network of professional agencies and workers',
        icon: 'Users',
        color: 'text-blue-600',
        source: 'Platform',
        type: 'platform',
        priority: 10,
        isLive: false
      },
      {
        id: 'fallback-2',
        text: '97% Successful Placement Rate This Month',
        description: 'Industry-leading success rate for domestic worker placements',
        icon: 'TrendingUp',
        color: 'text-green-600',
        source: 'Platform',
        type: 'platform',
        priority: 9,
        isLive: false
      },
      {
        id: 'fallback-3',
        text: '24/7 Customer Support Now Available',
        description: 'Get help anytime with our dedicated support team',
        icon: 'Headphones',
        color: 'text-purple-600',
        source: 'Platform',
        type: 'platform',
        priority: 8,
        isLive: false
      }
    ];
  }

  /**
   * Create a platform announcement (admin only)
   */
  async createPlatformAnnouncement(data) {
    try {
      const { data: result, errors } = await apolloClient.mutate({
        mutation: INSERT_PLATFORM_ANNOUNCEMENT,
        variables: {
          object: {
            type: data.type,
            title: data.title,
            message: data.message,
            icon: data.icon || 'Info',
            color: data.color || 'blue',
            priority: data.priority || 0,
            target_audience: data.targetAudience || 'all',
            url: data.url || null,
            is_active: true
          }
        }
      });

      if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

      // Refresh announcements
      await this.fetchAllAnnouncements();

      return { success: true, data: result?.insert_platform_announcements_one };
    } catch (error) {
      console.error('[NewsAggregator] Failed to create announcement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create an activity announcement
   */
  async createActivityAnnouncement(data) {
    try {
      const { data: result, errors } = await apolloClient.mutate({
        mutation: INSERT_ACTIVITY_ANNOUNCEMENT,
        variables: {
          object: {
            activity_type: data.activityType,
            title: data.title,
            description: data.description,
            user_id: data.userId,
            agency_id: data.agencyId,
            metadata: data.metadata || {},
            is_public: data.isPublic !== false
          }
        }
      });

      if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

      // Refresh announcements
      await this.fetchAllAnnouncements();

      return { success: true, data: result?.insert_activity_announcements_one };
    } catch (error) {
      console.error('[NewsAggregator] Failed to create activity announcement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get last update time
   */
  getLastUpdateTime() {
    return this.lastFetch;
  }

  /**
   * Check if service needs update
   */
  needsUpdate() {
    if (!this.lastFetch) return true;
    const now = new Date();
    const diff = now - this.lastFetch;
    return diff >= this.updateInterval;
  }
}

// Create singleton instance
const newsAggregatorService = new NewsAggregatorService();

// Initialize on import (only in browser)
if (typeof window !== 'undefined') {
  newsAggregatorService.initialize();
}

export default newsAggregatorService;
