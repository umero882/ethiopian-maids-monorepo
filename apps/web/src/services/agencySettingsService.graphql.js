/**
 * Agency Settings Service - GraphQL
 * Fetches settings data from Hasura for Agency Settings page
 */

import { gql } from '@apollo/client';
import { apolloClient } from '@ethio/api-client';
import { log } from '@/utils/logger';

// ============================================
// GraphQL Queries
// ============================================

// Get agency team members
const GET_AGENCY_TEAM_MEMBERS = gql`
  query GetAgencyTeamMembers($agency_id: String!) {
    agency_team_members(
      where: { agency_id: { _eq: $agency_id } }
      order_by: { created_at: asc }
    ) {
      id
      agency_id
      full_name
      email
      phone
      role
      status
      profile_photo_url
      hire_date
      created_at
    }
  }
`;

// Get agency team members aggregate (count)
const GET_AGENCY_TEAM_STATS = gql`
  query GetAgencyTeamStats($agency_id: String!) {
    agency_team_members_aggregate(where: { agency_id: { _eq: $agency_id } }) {
      aggregate {
        count
      }
    }
    active_members: agency_team_members_aggregate(
      where: { agency_id: { _eq: $agency_id }, status: { _eq: "active" } }
    ) {
      aggregate {
        count
      }
    }
    invited_members: agency_team_members_aggregate(
      where: { agency_id: { _eq: $agency_id }, status: { _eq: "invited" } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Get agency subscription
const GET_AGENCY_SUBSCRIPTION = gql`
  query GetAgencySubscription($user_id: String!) {
    subscriptions(
      where: { user_id: { _eq: $user_id } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      user_id
      plan_id
      plan_name
      plan_type
      status
      amount
      currency
      billing_period
      start_date
      end_date
      expires_at
      cancelled_at
      stripe_customer_id
      stripe_subscription_id
      payment_status
      features
      metadata
      created_at
    }
  }
`;

// Get agency profile for settings
const GET_AGENCY_PROFILE = gql`
  query GetAgencyProfile($user_id: String!) {
    agency_profiles(where: { user_id: { _eq: $user_id } }) {
      id
      user_id
      agency_name
      agency_description
      email
      phone
      whatsapp
      website
      logo_url
      cover_image_url
      country
      city
      address
      license_number
      established_year
      is_verified
      verification_status
      settings
      notification_preferences
      created_at
      updated_at
    }
  }
`;

// ============================================
// GraphQL Mutations
// ============================================

// Insert team member
const INSERT_TEAM_MEMBER = gql`
  mutation InsertTeamMember($object: agency_team_members_insert_input!) {
    insert_agency_team_members_one(object: $object) {
      id
      agency_id
      full_name
      email
      phone
      role
      status
      profile_photo_url
      hire_date
      created_at
    }
  }
`;

// Update team member
const UPDATE_TEAM_MEMBER = gql`
  mutation UpdateTeamMember($id: uuid!, $updates: agency_team_members_set_input!) {
    update_agency_team_members_by_pk(pk_columns: { id: $id }, _set: $updates) {
      id
      agency_id
      full_name
      email
      phone
      role
      status
      profile_photo_url
      hire_date
      created_at
    }
  }
`;

// Delete team member
const DELETE_TEAM_MEMBER = gql`
  mutation DeleteTeamMember($id: uuid!) {
    delete_agency_team_members_by_pk(id: $id) {
      id
    }
  }
`;

// Update agency profile settings
const UPDATE_AGENCY_SETTINGS = gql`
  mutation UpdateAgencySettings($user_id: String!, $updates: agency_profiles_set_input!) {
    update_agency_profiles(
      where: { user_id: { _eq: $user_id } }
      _set: $updates
    ) {
      affected_rows
      returning {
        id
        settings
        notification_preferences
        updated_at
      }
    }
  }
`;

// ============================================
// Service Class
// ============================================

class AgencySettingsService {
  getClient() {
    return apolloClient;
  }

  // Get team members
  async getTeamMembers(agencyId) {
    try {
      const client = this.getClient();
      const { data } = await client.query({
        query: GET_AGENCY_TEAM_MEMBERS,
        variables: { agency_id: agencyId },
        fetchPolicy: 'network-only'
      });

      // Transform data to match expected format
      const members = (data?.agency_team_members || []).map(member => ({
        id: member.id,
        name: member.full_name,
        email: member.email || '',
        phone: member.phone || '',
        role: member.role,
        status: member.status || 'active',
        avatar: member.profile_photo_url,
        joined_date: member.hire_date || member.created_at,
        last_active: this.formatLastActive(member.created_at),
        permissions: this.getPermissionsForRole(member.role)
      }));

      return { data: members, error: null };
    } catch (error) {
      log.error('Error fetching team members:', error);
      return { data: [], error };
    }
  }

  // Get team statistics
  async getTeamStats(agencyId) {
    try {
      const client = this.getClient();
      const { data } = await client.query({
        query: GET_AGENCY_TEAM_STATS,
        variables: { agency_id: agencyId },
        fetchPolicy: 'network-only'
      });

      return {
        data: {
          totalMembers: data?.agency_team_members_aggregate?.aggregate?.count || 0,
          activeMembers: data?.active_members?.aggregate?.count || 0,
          invitedMembers: data?.invited_members?.aggregate?.count || 0
        },
        error: null
      };
    } catch (error) {
      log.error('Error fetching team stats:', error);
      return { data: null, error };
    }
  }

  // Get agency subscription
  async getSubscription(userId) {
    try {
      const client = this.getClient();
      const { data } = await client.query({
        query: GET_AGENCY_SUBSCRIPTION,
        variables: { user_id: userId },
        fetchPolicy: 'network-only'
      });

      const subscription = data?.subscriptions?.[0];

      if (!subscription) {
        // Return default free plan
        return {
          data: {
            planName: 'Free Plan',
            planType: 'free',
            status: 'active',
            amount: 0,
            currency: 'USD',
            billingPeriod: 'monthly',
            nextBillingDate: null,
            features: {
              maids: 3,
              messages_per_month: 3
            }
          },
          error: null
        };
      }

      return {
        data: {
          id: subscription.id,
          planId: subscription.plan_id,
          planName: subscription.plan_name,
          planType: subscription.plan_type,
          status: subscription.status,
          amount: subscription.amount,
          currency: subscription.currency || 'USD',
          billingPeriod: subscription.billing_period,
          startDate: subscription.start_date,
          endDate: subscription.end_date,
          expiresAt: subscription.expires_at,
          cancelledAt: subscription.cancelled_at,
          paymentStatus: subscription.payment_status,
          features: subscription.features,
          stripeCustomerId: subscription.stripe_customer_id,
          stripeSubscriptionId: subscription.stripe_subscription_id,
          nextBillingDate: subscription.end_date
        },
        error: null
      };
    } catch (error) {
      log.error('Error fetching subscription:', error);
      return { data: null, error };
    }
  }

  // Get agency profile settings
  async getAgencySettings(userId) {
    try {
      const client = this.getClient();
      const { data } = await client.query({
        query: GET_AGENCY_PROFILE,
        variables: { user_id: userId },
        fetchPolicy: 'network-only'
      });

      const profile = data?.agency_profiles?.[0];

      if (!profile) {
        return { data: null, error: null };
      }

      // Parse notification preferences
      const notificationPrefs = profile.notification_preferences || {};
      const settings = profile.settings || {};

      return {
        data: {
          id: profile.id,
          agencyName: profile.agency_name,
          notifications: {
            emailNotifications: notificationPrefs.email_notifications ?? true,
            inAppNotifications: notificationPrefs.in_app_notifications ?? true,
            notifyOnNewInquiries: notificationPrefs.notify_on_new_inquiries ?? true,
            notifyOnStatusChanges: notificationPrefs.notify_on_status_changes ?? true,
            notifyOnMessages: notificationPrefs.notify_on_messages ?? true,
            marketingEmails: notificationPrefs.marketing_emails ?? false
          },
          security: {
            twoFactorAuth: settings.two_factor_auth ?? false,
            loginNotifications: settings.login_notifications ?? true,
            dataSharing: settings.data_sharing ?? false
          }
        },
        error: null
      };
    } catch (error) {
      log.error('Error fetching agency settings:', error);
      return { data: null, error };
    }
  }

  // Add team member
  async addTeamMember(agencyId, memberData) {
    try {
      const client = this.getClient();
      const { data } = await client.mutate({
        mutation: INSERT_TEAM_MEMBER,
        variables: {
          object: {
            agency_id: agencyId,
            full_name: memberData.name,
            email: memberData.email,
            phone: memberData.phone || null,
            role: memberData.role,
            status: 'invited',
            hire_date: new Date().toISOString().split('T')[0]
          }
        }
      });

      const member = data?.insert_agency_team_members_one;

      return {
        data: {
          id: member.id,
          name: member.full_name,
          email: member.email,
          role: member.role,
          status: member.status,
          sent_date: new Date().toISOString().split('T')[0],
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        error: null
      };
    } catch (error) {
      log.error('Error adding team member:', error);
      return { data: null, error };
    }
  }

  // Update team member
  async updateTeamMember(memberId, updates) {
    try {
      const client = this.getClient();

      const updateData = {};
      if (updates.name) updateData.full_name = updates.name;
      if (updates.email) updateData.email = updates.email;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.role) updateData.role = updates.role;
      if (updates.status) updateData.status = updates.status;

      const { data } = await client.mutate({
        mutation: UPDATE_TEAM_MEMBER,
        variables: {
          id: memberId,
          updates: updateData
        }
      });

      return { data: data?.update_agency_team_members_by_pk, error: null };
    } catch (error) {
      log.error('Error updating team member:', error);
      return { data: null, error };
    }
  }

  // Remove team member
  async removeTeamMember(memberId) {
    try {
      const client = this.getClient();
      await client.mutate({
        mutation: DELETE_TEAM_MEMBER,
        variables: { id: memberId }
      });

      return { error: null };
    } catch (error) {
      log.error('Error removing team member:', error);
      return { error };
    }
  }

  // Update notification settings
  async updateNotificationSettings(userId, notificationSettings) {
    try {
      const client = this.getClient();

      const notification_preferences = {
        email_notifications: notificationSettings.emailNotifications,
        in_app_notifications: notificationSettings.inAppNotifications,
        notify_on_new_inquiries: notificationSettings.notifyOnNewInquiries,
        notify_on_status_changes: notificationSettings.notifyOnStatusChanges,
        notify_on_messages: notificationSettings.notifyOnMessages,
        marketing_emails: notificationSettings.marketingEmails
      };

      const { data } = await client.mutate({
        mutation: UPDATE_AGENCY_SETTINGS,
        variables: {
          user_id: userId,
          updates: { notification_preferences }
        }
      });

      return { data: data?.update_agency_profiles?.returning?.[0], error: null };
    } catch (error) {
      log.error('Error updating notification settings:', error);
      return { data: null, error };
    }
  }

  // Update security settings
  async updateSecuritySettings(userId, securitySettings) {
    try {
      const client = this.getClient();

      // Get current settings first
      const { data: currentData } = await client.query({
        query: GET_AGENCY_PROFILE,
        variables: { user_id: userId },
        fetchPolicy: 'network-only'
      });

      const currentSettings = currentData?.agency_profiles?.[0]?.settings || {};

      const settings = {
        ...currentSettings,
        two_factor_auth: securitySettings.twoFactorAuth,
        login_notifications: securitySettings.loginNotifications,
        data_sharing: securitySettings.dataSharing
      };

      const { data } = await client.mutate({
        mutation: UPDATE_AGENCY_SETTINGS,
        variables: {
          user_id: userId,
          updates: { settings }
        }
      });

      return { data: data?.update_agency_profiles?.returning?.[0], error: null };
    } catch (error) {
      log.error('Error updating security settings:', error);
      return { data: null, error };
    }
  }

  // Helper: Get permissions for role
  getPermissionsForRole(role) {
    const rolePermissions = {
      'Owner': ['all'],
      'Manager': ['manage_maids', 'manage_clients', 'view_reports', 'manage_billing', 'manage_team'],
      'Coordinator': ['manage_maids', 'view_reports', 'manage_documents', 'handle_inquiries'],
      'Assistant': ['view_maids', 'view_clients', 'basic_support'],
      'Recruiter': ['manage_maids', 'view_reports', 'recruitment'],
      'Customer Service': ['view_clients', 'handle_inquiries', 'basic_support', 'messaging'],
      'Accountant': ['manage_billing', 'view_reports', 'financial_records'],
      'Supervisor': ['manage_maids', 'manage_clients', 'view_reports', 'team_oversight']
    };

    return rolePermissions[role] || ['view_maids'];
  }

  // Helper: Format last active time
  formatLastActive(date) {
    if (!date) return 'Never';

    const now = new Date();
    const lastActive = new Date(date);
    const diffMs = now - lastActive;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return lastActive.toLocaleDateString();
  }

  // Get all settings data for the page
  async getSettingsData(userId, agencyId) {
    try {
      const [teamResult, subscriptionResult, settingsResult] = await Promise.all([
        agencyId ? this.getTeamMembers(agencyId) : { data: [], error: null },
        this.getSubscription(userId),
        this.getAgencySettings(userId)
      ]);

      // Default roles (stored locally for now, could be moved to DB)
      const defaultRoles = [
        {
          id: 'owner',
          name: 'Owner',
          description: 'Full access to all features and settings',
          permissions: ['all'],
          color: 'purple'
        },
        {
          id: 'manager',
          name: 'Manager',
          description: 'Manage operations, staff, and view all reports',
          permissions: ['manage_maids', 'manage_clients', 'view_reports', 'manage_billing', 'manage_team'],
          color: 'blue'
        },
        {
          id: 'coordinator',
          name: 'Coordinator',
          description: 'Handle day-to-day operations and maid management',
          permissions: ['manage_maids', 'view_reports', 'manage_documents', 'handle_inquiries'],
          color: 'green'
        },
        {
          id: 'assistant',
          name: 'Assistant',
          description: 'Basic access to view maids and handle simple tasks',
          permissions: ['view_maids', 'view_clients', 'basic_support'],
          color: 'gray'
        },
        {
          id: 'recruiter',
          name: 'Recruiter',
          description: 'Focus on finding and onboarding new maids',
          permissions: ['manage_maids', 'view_reports', 'recruitment'],
          color: 'orange'
        },
        {
          id: 'customer_service',
          name: 'Customer Service',
          description: 'Handle client inquiries and support requests',
          permissions: ['view_clients', 'handle_inquiries', 'basic_support', 'messaging'],
          color: 'teal'
        },
        {
          id: 'accountant',
          name: 'Accountant',
          description: 'Manage financial records and billing',
          permissions: ['manage_billing', 'view_reports', 'financial_records'],
          color: 'indigo'
        },
        {
          id: 'supervisor',
          name: 'Supervisor',
          description: 'Oversee operations and team performance',
          permissions: ['manage_maids', 'manage_clients', 'view_reports', 'team_oversight'],
          color: 'red'
        }
      ];

      return {
        data: {
          team: {
            members: teamResult.data || [],
            roles: defaultRoles,
            invitations: [] // Will track invitations from team members with status='invited'
          },
          subscription: subscriptionResult.data,
          notifications: settingsResult.data?.notifications || {
            emailNotifications: true,
            inAppNotifications: true,
            notifyOnNewInquiries: true,
            notifyOnStatusChanges: true,
            notifyOnMessages: true,
            marketingEmails: false
          },
          security: settingsResult.data?.security || {
            twoFactorAuth: false,
            loginNotifications: true,
            dataSharing: false
          }
        },
        error: null
      };
    } catch (error) {
      log.error('Error fetching settings data:', error);
      return { data: null, error };
    }
  }
}

// Export singleton instance
export const agencySettingsService = new AgencySettingsService();

export default agencySettingsService;
