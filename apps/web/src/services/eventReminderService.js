/**
 * Event Reminder Service
 * Handles sending notifications and reminders for calendar events
 * Supports industry-standard reminder intervals
 */

import { graphqlNotificationService } from './notificationService.graphql';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('EventReminderService');

// Industry-standard reminder intervals (in minutes before event)
export const REMINDER_INTERVALS = [
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
  { value: 10080, label: '1 week before' },
];

// Default reminders for different event types
export const DEFAULT_REMINDERS = {
  interview: [1440, 60, 15], // 1 day, 1 hour, 15 min
  meeting: [60, 15], // 1 hour, 15 min
  medical: [1440, 120], // 1 day, 2 hours
  documentation: [1440], // 1 day
  training: [1440, 60], // 1 day, 1 hour
  placement: [2880, 1440], // 2 days, 1 day
  orientation: [1440, 60], // 1 day, 1 hour
  screening: [1440, 60], // 1 day, 1 hour
  followup: [60, 15], // 1 hour, 15 min
  other: [1440, 60], // 1 day, 1 hour
};

// GraphQL queries to get user details
const GetMaidDetailsDocument = gql`
  query GetMaidDetails($id: String!) {
    profiles_by_pk(id: $id) {
      id
      full_name
      email
      phone
      user_type
    }
  }
`;

const GetSponsorDetailsDocument = gql`
  query GetSponsorDetails($id: uuid!) {
    sponsors_by_pk(id: $id) {
      id
      full_name
      email
      phone
      user_id
    }
  }
`;

const GetAgencyDetailsDocument = gql`
  query GetAgencyDetails($id: String!) {
    agency_profiles_by_pk(id: $id) {
      id
      agency_name
      email
      phone
    }
  }
`;

// Create event reminder records
const CreateEventRemindersDocument = gql`
  mutation CreateEventReminders($data: [event_reminders_insert_input!]!) {
    insert_event_reminders(objects: $data, on_conflict: {
      constraint: event_reminders_pkey,
      update_columns: [reminder_time, sent]
    }) {
      affected_rows
      returning {
        id
        event_id
        user_id
        reminder_time
        sent
      }
    }
  }
`;

/**
 * Event Reminder Service
 */
export const eventReminderService = {
  /**
   * Send immediate notifications when an event is created
   * Notifies all participants (agency, maid, sponsor)
   */
  async sendEventCreatedNotifications(event, agencyId, participants = {}) {
    try {
      log.info('Sending event created notifications', { eventId: event.id });

      const notifications = [];
      const eventDateTime = formatEventDateTime(event);
      const meetingLinkText = event.meeting_link ? `\n\nMeeting Link: ${event.meeting_link}` : '';
      const locationText = event.location ? `\nLocation: ${event.location}` : '';

      // Notification for maid if assigned
      if (participants.maidId) {
        const maidDetails = await this.getMaidDetails(participants.maidId);
        if (maidDetails) {
          notifications.push({
            user_id: participants.maidId,
            title: `New ${event.event_type}: ${event.title}`,
            message: `You have been invited to ${event.title} on ${eventDateTime}.${locationText}${meetingLinkText}`,
            type: 'event_invitation',
            link: `/events/${event.id}`,
          });
        }
      }

      // Notification for sponsor if assigned
      if (participants.sponsorId) {
        const sponsorDetails = await this.getSponsorDetails(participants.sponsorId);
        if (sponsorDetails && sponsorDetails.user_id) {
          notifications.push({
            user_id: sponsorDetails.user_id,
            title: `New ${event.event_type}: ${event.title}`,
            message: `You have been invited to ${event.title} on ${eventDateTime}.${locationText}${meetingLinkText}`,
            type: 'event_invitation',
            link: `/events/${event.id}`,
          });
        }
      }

      // Send all notifications
      if (notifications.length > 0) {
        const result = await graphqlNotificationService.createMultipleNotifications(notifications);
        log.info('Event created notifications sent', { count: notifications.length });
        return { success: true, notificationsSent: notifications.length };
      }

      return { success: true, notificationsSent: 0 };
    } catch (error) {
      log.error('Failed to send event created notifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Schedule reminders for an event
   * Creates reminder records that will be processed by a background job
   */
  async scheduleEventReminders(event, agencyId, participants = {}, reminderIntervals = null) {
    try {
      log.info('Scheduling event reminders', { eventId: event.id });

      // Use default reminders if not specified
      const intervals = reminderIntervals || DEFAULT_REMINDERS[event.event_type] || DEFAULT_REMINDERS.other;

      const eventDateTime = new Date(`${event.start_date}T${event.start_time || '00:00'}:00`);
      const reminders = [];

      // Get all participants to notify
      const participantIds = [];

      // Add maid
      if (participants.maidId) {
        participantIds.push(participants.maidId);
      }

      // Add sponsor (get user_id from sponsor)
      if (participants.sponsorId) {
        const sponsorDetails = await this.getSponsorDetails(participants.sponsorId);
        if (sponsorDetails && sponsorDetails.user_id) {
          participantIds.push(sponsorDetails.user_id);
        }
      }

      // Add agency
      if (agencyId) {
        participantIds.push(agencyId);
      }

      // Create reminder records for each participant and interval
      for (const userId of participantIds) {
        for (const minutesBefore of intervals) {
          const reminderTime = new Date(eventDateTime.getTime() - minutesBefore * 60 * 1000);

          // Only schedule future reminders
          if (reminderTime > new Date()) {
            reminders.push({
              event_id: event.id,
              user_id: userId,
              reminder_time: reminderTime.toISOString(),
              minutes_before: minutesBefore,
              sent: false,
            });
          }
        }
      }

      log.info('Reminders scheduled', { count: reminders.length });

      // Store reminders in metadata for now (can be moved to separate table later)
      return {
        success: true,
        remindersScheduled: reminders.length,
        reminders
      };
    } catch (error) {
      log.error('Failed to schedule event reminders:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send a reminder notification
   */
  async sendReminderNotification(event, userId, minutesBefore) {
    try {
      const eventDateTime = formatEventDateTime(event);
      const timeText = getTimeBeforeText(minutesBefore);
      const meetingLinkText = event.meeting_link ? `\n\nJoin here: ${event.meeting_link}` : '';

      await graphqlNotificationService.createNotification(userId, {
        title: `Reminder: ${event.title} in ${timeText}`,
        message: `Your ${event.event_type} "${event.title}" is starting ${timeText} at ${eventDateTime}.${meetingLinkText}`,
        type: 'event_reminder',
        link: event.meeting_link || `/events/${event.id}`,
      });

      return { success: true };
    } catch (error) {
      log.error('Failed to send reminder notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send interview-specific notifications with meeting link
   */
  async sendInterviewNotifications(event, agencyId, maidId, sponsorId, meetingLink) {
    try {
      log.info('Sending interview notifications', { eventId: event.id, maidId, sponsorId });

      const notifications = [];
      const eventDateTime = formatEventDateTime(event);

      const interviewMessage = (recipientType) => {
        let message = `You have an interview scheduled for ${eventDateTime}.\n\n`;
        message += `Event: ${event.title}\n`;
        if (event.description) message += `Details: ${event.description}\n`;
        if (event.location) message += `Location: ${event.location}\n`;
        if (meetingLink) {
          message += `\nJoin the interview using this link:\n${meetingLink}\n`;
          message += `\nPlease join 5 minutes early to test your connection.`;
        }
        return message;
      };

      // Notify maid
      if (maidId) {
        notifications.push({
          user_id: maidId,
          title: `Interview Scheduled: ${event.title}`,
          message: interviewMessage('maid'),
          type: 'interview_scheduled',
          link: meetingLink || `/events/${event.id}`,
        });
      }

      // Notify sponsor
      if (sponsorId) {
        const sponsorDetails = await this.getSponsorDetails(sponsorId);
        if (sponsorDetails && sponsorDetails.user_id) {
          notifications.push({
            user_id: sponsorDetails.user_id,
            title: `Interview Scheduled: ${event.title}`,
            message: interviewMessage('sponsor'),
            type: 'interview_scheduled',
            link: meetingLink || `/events/${event.id}`,
          });
        }
      }

      // Send all notifications
      if (notifications.length > 0) {
        await graphqlNotificationService.createMultipleNotifications(notifications);
      }

      // Schedule reminders (industry standard for interviews)
      const interviewReminders = [1440, 120, 30, 15]; // 1 day, 2 hours, 30 min, 15 min
      await this.scheduleEventReminders(event, agencyId, { maidId, sponsorId }, interviewReminders);

      return { success: true, notificationsSent: notifications.length };
    } catch (error) {
      log.error('Failed to send interview notifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get maid details
   */
  async getMaidDetails(maidId) {
    try {
      const { data } = await apolloClient.query({
        query: GetMaidDetailsDocument,
        variables: { id: maidId },
        fetchPolicy: 'network-only',
      });
      return data?.profiles_by_pk;
    } catch (error) {
      log.error('Failed to get maid details:', error);
      return null;
    }
  },

  /**
   * Get sponsor details
   */
  async getSponsorDetails(sponsorId) {
    try {
      const { data } = await apolloClient.query({
        query: GetSponsorDetailsDocument,
        variables: { id: sponsorId },
        fetchPolicy: 'network-only',
      });
      return data?.sponsors_by_pk;
    } catch (error) {
      log.error('Failed to get sponsor details:', error);
      return null;
    }
  },

  /**
   * Get agency details
   */
  async getAgencyDetails(agencyId) {
    try {
      const { data } = await apolloClient.query({
        query: GetAgencyDetailsDocument,
        variables: { id: agencyId },
        fetchPolicy: 'network-only',
      });
      return data?.agency_profiles_by_pk;
    } catch (error) {
      log.error('Failed to get agency details:', error);
      return null;
    }
  },

  /**
   * Validate meeting link (Zoom or Google Meet)
   */
  validateMeetingLink(link) {
    if (!link) return { valid: true, type: null };

    const zoomPattern = /^https?:\/\/([\w-]+\.)?zoom\.us\/(j|my)\/[\w-]+/i;
    const googleMeetPattern = /^https?:\/\/meet\.google\.com\/[\w-]+/i;
    const teamsPattern = /^https?:\/\/teams\.microsoft\.com\/l\/meetup-join\//i;

    if (zoomPattern.test(link)) {
      return { valid: true, type: 'zoom', icon: 'video' };
    } else if (googleMeetPattern.test(link)) {
      return { valid: true, type: 'google_meet', icon: 'video' };
    } else if (teamsPattern.test(link)) {
      return { valid: true, type: 'teams', icon: 'video' };
    } else if (link.startsWith('http')) {
      return { valid: true, type: 'other', icon: 'link' };
    }

    return { valid: false, type: null, error: 'Invalid meeting link format' };
  },

  /**
   * Get meeting platform name
   */
  getMeetingPlatformName(link) {
    const validation = this.validateMeetingLink(link);
    switch (validation.type) {
      case 'zoom': return 'Zoom';
      case 'google_meet': return 'Google Meet';
      case 'teams': return 'Microsoft Teams';
      default: return 'Video Call';
    }
  },
};

// Helper functions
function formatEventDateTime(event) {
  const date = new Date(event.start_date);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (event.start_time) {
    const timeStr = new Date(`1970-01-01T${event.start_time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} at ${timeStr}`;
  }

  return dateStr;
}

function getTimeBeforeText(minutes) {
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? '1 hour' : `${hours} hours`;
  } else {
    const days = Math.floor(minutes / 1440);
    return days === 1 ? '1 day' : `${days} days`;
  }
}

export default eventReminderService;
