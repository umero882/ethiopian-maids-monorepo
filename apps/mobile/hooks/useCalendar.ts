/**
 * Calendar & Tasks Hooks
 *
 * Custom hooks for fetching calendar events and tasks for agency users.
 * Uses Apollo Client directly with GraphQL queries.
 */

import { useCallback, useEffect, useState } from 'react';
import { gql, useLazyQuery, useMutation } from '@apollo/client';

// ============================================
// GraphQL Queries
// ============================================

const GET_CALENDAR_EVENTS = gql`
  query GetCalendarEvents($agency_id: String!) {
    calendar_events(
      where: { agency_id: { _eq: $agency_id } }
      order_by: { start_date: asc, start_time: asc }
    ) {
      id
      agency_id
      title
      description
      event_type
      start_date
      start_time
      end_time
      location
      location_type
      meeting_link
      priority
      status
      maid_id
      sponsor_id
      all_day
      notes
      tags
      metadata
      created_at
      updated_at
    }
  }
`;

const GET_AGENCY_TASKS = gql`
  query GetAgencyTasks($agency_id: String!) {
    agency_tasks(
      where: { agency_id: { _eq: $agency_id } }
      order_by: { due_date: asc }
    ) {
      id
      agency_id
      title
      description
      priority
      status
      due_date
      assigned_to_id
      estimated_hours
      progress
      tags
      task_type
      related_maid_id
      related_sponsor_id
      completed_at
      created_at
      updated_at
    }
  }
`;

const GET_MAIDS_FOR_SELECTION = gql`
  query GetMaidsForSelection($limit: Int) {
    profiles(
      where: { user_type: { _eq: "maid" } }
      limit: $limit
      order_by: { created_at: desc }
    ) {
      id
      full_name
      email
      avatar_url
    }
  }
`;

const GET_SPONSORS_FOR_SELECTION = gql`
  query GetSponsorsForSelection($limit: Int) {
    sponsors(limit: $limit, order_by: { created_at: desc }) {
      id
      full_name
      company_name
      email
      profile_id
    }
  }
`;

// ============================================
// GraphQL Mutations
// ============================================

const CREATE_CALENDAR_EVENT = gql`
  mutation CreateCalendarEvent($data: calendar_events_insert_input!) {
    insert_calendar_events_one(object: $data) {
      id
      agency_id
      title
      description
      event_type
      start_date
      start_time
      end_time
      location
      location_type
      meeting_link
      priority
      status
      maid_id
      sponsor_id
      created_at
    }
  }
`;

const UPDATE_CALENDAR_EVENT = gql`
  mutation UpdateCalendarEvent(
    $id: uuid!
    $agency_id: String!
    $data: calendar_events_set_input!
  ) {
    update_calendar_events(
      where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
      _set: $data
    ) {
      affected_rows
      returning {
        id
        title
        status
        updated_at
      }
    }
  }
`;

const DELETE_CALENDAR_EVENT = gql`
  mutation DeleteCalendarEvent($id: uuid!, $agency_id: String!) {
    delete_calendar_events(
      where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
    ) {
      affected_rows
    }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($data: agency_tasks_insert_input!) {
    insert_agency_tasks_one(object: $data) {
      id
      agency_id
      title
      description
      priority
      status
      due_date
      progress
      created_at
    }
  }
`;

const UPDATE_TASK = gql`
  mutation UpdateTask(
    $id: uuid!
    $agency_id: String!
    $data: agency_tasks_set_input!
  ) {
    update_agency_tasks(
      where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
      _set: $data
    ) {
      affected_rows
      returning {
        id
        title
        status
        progress
        updated_at
      }
    }
  }
`;

const DELETE_TASK = gql`
  mutation DeleteTask($id: uuid!, $agency_id: String!) {
    delete_agency_tasks(
      where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
    ) {
      affected_rows
    }
  }
`;

const CREATE_NOTIFICATION = gql`
  mutation CreateNotification($data: notifications_insert_input!) {
    insert_notifications_one(object: $data) {
      id
      user_id
      title
      message
      type
      created_at
    }
  }
`;

const CREATE_MULTIPLE_NOTIFICATIONS = gql`
  mutation CreateMultipleNotifications($data: [notifications_insert_input!]!) {
    insert_notifications(objects: $data) {
      affected_rows
    }
  }
`;

// ============================================
// Types
// ============================================

export interface CalendarEvent {
  id: string;
  agency_id: string;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  location_type?: string;
  meeting_link?: string;
  priority: string;
  status: string;
  maid_id?: string;
  sponsor_id?: string;
  all_day?: boolean;
  notes?: string;
  tags?: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  agency_id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  due_date?: string;
  assigned_to_id?: string;
  estimated_hours?: number;
  progress: number;
  tags?: string[];
  task_type?: string;
  related_maid_id?: string;
  related_sponsor_id?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  photo?: string;
  user_id?: string;
}

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

// ============================================
// Hook Implementation
// ============================================

export function useCalendar(agencyId: string | undefined) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [maids, setMaids] = useState<Participant[]>([]);
  const [sponsors, setSponsors] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Queries
  const [fetchEvents] = useLazyQuery(GET_CALENDAR_EVENTS);
  const [fetchTasks] = useLazyQuery(GET_AGENCY_TASKS);
  const [fetchMaids] = useLazyQuery(GET_MAIDS_FOR_SELECTION);
  const [fetchSponsors] = useLazyQuery(GET_SPONSORS_FOR_SELECTION);

  // Mutations
  const [createEventMutation] = useMutation(CREATE_CALENDAR_EVENT);
  const [updateEventMutation] = useMutation(UPDATE_CALENDAR_EVENT);
  const [deleteEventMutation] = useMutation(DELETE_CALENDAR_EVENT);
  const [createTaskMutation] = useMutation(CREATE_TASK);
  const [updateTaskMutation] = useMutation(UPDATE_TASK);
  const [deleteTaskMutation] = useMutation(DELETE_TASK);
  const [createNotificationMutation] = useMutation(CREATE_NOTIFICATION);
  const [createMultipleNotificationsMutation] = useMutation(CREATE_MULTIPLE_NOTIFICATIONS);

  // Load all data
  const loadData = useCallback(async () => {
    if (!agencyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [eventsResult, tasksResult, maidsResult, sponsorsResult] = await Promise.all([
        fetchEvents({ variables: { agency_id: agencyId } }),
        fetchTasks({ variables: { agency_id: agencyId } }),
        fetchMaids({ variables: { limit: 100 } }),
        fetchSponsors({ variables: { limit: 100 } }),
      ]);

      if (eventsResult.data?.calendar_events) {
        setEvents(eventsResult.data.calendar_events);
      }
      if (tasksResult.data?.agency_tasks) {
        setTasks(tasksResult.data.agency_tasks);
      }
      if (maidsResult.data?.profiles) {
        // Filter duplicates by id
        const uniqueMaids = maidsResult.data.profiles.filter(
          (m: any, index: number, self: any[]) => index === self.findIndex(x => x.id === m.id)
        );
        setMaids(uniqueMaids.map((m: any) => ({
          id: m.id,
          name: m.full_name || 'Unknown Maid',
          email: m.email,
          photo: m.avatar_url,
        })));
      }
      if (sponsorsResult.data?.sponsors) {
        // Filter duplicates by id
        const uniqueSponsors = sponsorsResult.data.sponsors.filter(
          (s: any, index: number, self: any[]) => index === self.findIndex(x => x.id === s.id)
        );
        setSponsors(uniqueSponsors.map((s: any) => ({
          id: s.id,
          name: s.full_name || s.company_name || 'Unknown Sponsor',
          email: s.email,
          user_id: s.profile_id,
        })));
      }
    } catch (err: any) {
      console.error('Failed to load calendar data:', err);
      setError(err.message || 'Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  }, [agencyId, fetchEvents, fetchTasks, fetchMaids, fetchSponsors]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Send notifications to participants
  const sendEventNotifications = async (
    event: CalendarEvent,
    maidId?: string,
    sponsorId?: string
  ) => {
    const notifications: any[] = [];
    const eventDateTime = formatEventDateTime(event);
    const meetingLinkText = event.meeting_link ? `\n\nMeeting Link: ${event.meeting_link}` : '';
    const locationText = event.location ? `\nLocation: ${event.location}` : '';

    // Notification for maid
    if (maidId) {
      notifications.push({
        user_id: maidId,
        title: `New ${event.event_type}: ${event.title}`,
        message: `You have been invited to ${event.title} on ${eventDateTime}.${locationText}${meetingLinkText}`,
        type: 'event_invitation',
        link: `/events/${event.id}`,
      });
    }

    // Notification for sponsor
    if (sponsorId) {
      const sponsor = sponsors.find(s => s.id === sponsorId);
      if (sponsor?.user_id) {
        notifications.push({
          user_id: sponsor.user_id,
          title: `New ${event.event_type}: ${event.title}`,
          message: `You have been invited to ${event.title} on ${eventDateTime}.${locationText}${meetingLinkText}`,
          type: 'event_invitation',
          link: `/events/${event.id}`,
        });
      }
    }

    if (notifications.length > 0) {
      try {
        await createMultipleNotificationsMutation({
          variables: { data: notifications },
        });
      } catch (err) {
        console.error('Failed to send notifications:', err);
      }
    }
  };

  // Create event
  const createEvent = async (eventData: Partial<CalendarEvent> & {
    send_notifications?: boolean;
    reminder_intervals?: number[];
  }) => {
    if (!agencyId) throw new Error('Agency ID is required');

    const payload = {
      agency_id: agencyId,
      title: eventData.title,
      description: eventData.description || null,
      event_type: eventData.event_type || 'meeting',
      start_date: eventData.start_date,
      start_time: eventData.start_time || null,
      end_time: eventData.end_time || null,
      location: eventData.location || null,
      location_type: eventData.location_type || (eventData.meeting_link ? 'online' : 'onsite'),
      meeting_link: eventData.meeting_link || null,
      priority: eventData.priority || 'medium',
      status: 'scheduled',
      maid_id: eventData.maid_id || null,
      sponsor_id: eventData.sponsor_id || null,
      all_day: eventData.all_day || false,
      notes: eventData.notes || null,
      tags: eventData.tags || [],
      metadata: {
        reminder_intervals: eventData.reminder_intervals || [1440, 60],
        send_notifications: eventData.send_notifications !== false,
      },
    };

    const result = await createEventMutation({ variables: { data: payload } });
    const created = result.data?.insert_calendar_events_one;

    if (created && eventData.send_notifications !== false) {
      await sendEventNotifications(created, eventData.maid_id, eventData.sponsor_id);
    }

    setEvents(prev => [...prev, created]);
    return created;
  };

  // Update event
  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
    if (!agencyId) throw new Error('Agency ID is required');

    const result = await updateEventMutation({
      variables: {
        id: eventId,
        agency_id: agencyId,
        data: updates,
      },
    });

    const updated = result.data?.update_calendar_events?.returning?.[0];
    if (updated) {
      setEvents(prev => prev.map(e => (e.id === eventId ? { ...e, ...updated } : e)));
    }
    return updated;
  };

  // Delete event
  const deleteEvent = async (eventId: string) => {
    if (!agencyId) throw new Error('Agency ID is required');

    await deleteEventMutation({
      variables: { id: eventId, agency_id: agencyId },
    });

    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  // Create task
  const createTask = async (taskData: Partial<Task>) => {
    if (!agencyId) throw new Error('Agency ID is required');

    const payload = {
      agency_id: agencyId,
      title: taskData.title,
      description: taskData.description || null,
      priority: taskData.priority || 'medium',
      status: 'pending',
      due_date: taskData.due_date || null,
      estimated_hours: taskData.estimated_hours || 1,
      progress: 0,
      tags: taskData.tags || [],
    };

    const result = await createTaskMutation({ variables: { data: payload } });
    const created = result.data?.insert_agency_tasks_one;

    setTasks(prev => [...prev, created]);
    return created;
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!agencyId) throw new Error('Agency ID is required');

    const result = await updateTaskMutation({
      variables: {
        id: taskId,
        agency_id: agencyId,
        data: updates,
      },
    });

    const updated = result.data?.update_agency_tasks?.returning?.[0];
    if (updated) {
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...updated } : t)));
    }
    return updated;
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: string, progress?: number) => {
    const progressValue = progress ?? (status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0);
    return updateTask(taskId, { status, progress: progressValue });
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!agencyId) throw new Error('Agency ID is required');

    await deleteTaskMutation({
      variables: { id: taskId, agency_id: agencyId },
    });

    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  return {
    events,
    tasks,
    maids,
    sponsors,
    isLoading,
    error,
    refetch: loadData,
    createEvent,
    updateEvent,
    deleteEvent,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  };
}

// Helper functions
function formatEventDateTime(event: CalendarEvent): string {
  if (!event.start_date) return 'No date';

  try {
    const date = new Date(event.start_date + 'T12:00:00');
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (event.start_time) {
      const timeParts = event.start_time.split(':');
      const hours = parseInt(timeParts[0], 10);
      const minutes = timeParts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${dateStr} at ${hour12}:${minutes} ${ampm}`;
    }

    return dateStr;
  } catch (error) {
    return 'Invalid date';
  }
}

export default useCalendar;
