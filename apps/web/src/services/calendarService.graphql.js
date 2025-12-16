/**
 * Calendar & Tasks Service - GraphQL Implementation
 * Handles calendar events and agency tasks using GraphQL/Hasura
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';
import { eventReminderService } from './eventReminderService';

const log = createLogger('CalendarService.GraphQL');

// ============================================================================
// CALENDAR EVENTS - GraphQL Documents
// ============================================================================

const GetCalendarEventsDocument = gql`
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
      outcome
      tags
      metadata
      created_at
      updated_at
    }
  }
`;

const GetCalendarEventByIdDocument = gql`
  query GetCalendarEventById($id: uuid!) {
    calendar_events_by_pk(id: $id) {
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
      outcome
      tags
      metadata
      created_at
      updated_at
    }
  }
`;

const CreateCalendarEventDocument = gql`
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
      all_day
      notes
      tags
      created_at
      updated_at
    }
  }
`;

const UpdateCalendarEventDocument = gql`
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
        description
        event_type
        start_date
        start_time
        end_time
        location
        priority
        status
        updated_at
      }
    }
  }
`;

const DeleteCalendarEventDocument = gql`
  mutation DeleteCalendarEvent($id: uuid!, $agency_id: String!) {
    delete_calendar_events(
      where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
    ) {
      affected_rows
    }
  }
`;

// ============================================================================
// AGENCY TASKS - GraphQL Documents
// ============================================================================

const GetAgencyTasksDocument = gql`
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
      user {
        id
        email
      }
    }
  }
`;

const GetAgencyTaskByIdDocument = gql`
  query GetAgencyTaskById($id: uuid!) {
    agency_tasks_by_pk(id: $id) {
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
      user {
        id
        email
      }
    }
  }
`;

const CreateAgencyTaskDocument = gql`
  mutation CreateAgencyTask($data: agency_tasks_insert_input!) {
    insert_agency_tasks_one(object: $data) {
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
      created_at
      updated_at
      user {
        id
        email
      }
    }
  }
`;

const UpdateAgencyTaskDocument = gql`
  mutation UpdateAgencyTask(
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
        description
        priority
        status
        due_date
        progress
        updated_at
      }
    }
  }
`;

const DeleteAgencyTaskDocument = gql`
  mutation DeleteAgencyTask($id: uuid!, $agency_id: String!) {
    delete_agency_tasks(
      where: { id: { _eq: $id }, agency_id: { _eq: $agency_id } }
    ) {
      affected_rows
    }
  }
`;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export const graphqlCalendarService = {
  // ============================================================================
  // CALENDAR EVENTS
  // ============================================================================

  /**
   * Get all calendar events for an agency
   * @param {string} agencyId - The agency ID (Firebase UID)
   * @param {object} filters - Optional filters (not used server-side, filtering done in UI)
   * @returns {Promise<{data: Array|null, error: object|null}>}
   */
  async getCalendarEventsWithFilters(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        log.warn('No agency ID provided for calendar events');
        return { data: [], error: null };
      }

      log.debug('Fetching calendar events', { agencyId });

      const { data, errors } = await apolloClient.query({
        query: GetCalendarEventsDocument,
        variables: { agency_id: agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        log.error('GraphQL errors fetching calendar events:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const events = data?.calendar_events || [];
      log.info(`Fetched ${events.length} calendar events`);

      return { data: events, error: null };
    } catch (error) {
      log.error('Failed to fetch calendar events:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Get a single calendar event by ID
   * @param {string} eventId - The event UUID
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getCalendarEventById(eventId) {
    try {
      if (!eventId) {
        return { data: null, error: { message: 'Event ID is required' } };
      }

      const { data, errors } = await apolloClient.query({
        query: GetCalendarEventByIdDocument,
        variables: { id: eventId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        log.error('GraphQL errors fetching calendar event:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      return { data: data?.calendar_events_by_pk || null, error: null };
    } catch (error) {
      log.error('Failed to fetch calendar event:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Create a new calendar event
   * @param {string} agencyId - The agency ID (Firebase UID)
   * @param {object} eventData - The event data
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async createCalendarEvent(agencyId, eventData) {
    try {
      if (!agencyId) {
        return { data: null, error: { message: 'Agency ID is required' } };
      }

      log.debug('Creating calendar event', { agencyId, eventData });

      // Prepare the payload
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
        status: eventData.status || 'scheduled',
        maid_id: eventData.maid_id || null,
        sponsor_id: eventData.sponsor_id || null,
        all_day: eventData.all_day || false,
        notes: eventData.notes || null,
        tags: eventData.tags || [],
        metadata: {
          reminder_intervals: eventData.reminder_intervals || null,
          send_notifications: eventData.send_notifications !== false,
        },
      };

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateCalendarEventDocument,
        variables: { data: payload },
      });

      if (errors && errors.length > 0) {
        log.error('GraphQL errors creating calendar event:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const created = data?.insert_calendar_events_one;
      log.info('Calendar event created successfully', { id: created?.id });

      // Send notifications to participants
      if (created && eventData.send_notifications !== false) {
        const participants = {
          maidId: eventData.maid_id,
          sponsorId: eventData.sponsor_id,
        };

        // Send appropriate notifications based on event type
        if (eventData.event_type === 'interview' && eventData.meeting_link) {
          await eventReminderService.sendInterviewNotifications(
            created,
            agencyId,
            eventData.maid_id,
            eventData.sponsor_id,
            eventData.meeting_link
          );
        } else {
          // Send general event notifications
          await eventReminderService.sendEventCreatedNotifications(created, agencyId, participants);
          await eventReminderService.scheduleEventReminders(
            created,
            agencyId,
            participants,
            eventData.reminder_intervals
          );
        }
      }

      return { data: created, error: null };
    } catch (error) {
      log.error('Failed to create calendar event:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Update an existing calendar event
   * @param {string} eventId - The event UUID
   * @param {string} agencyId - The agency ID (Firebase UID)
   * @param {object} updates - The fields to update
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateCalendarEvent(eventId, agencyId, updates) {
    try {
      if (!eventId || !agencyId) {
        return { data: null, error: { message: 'Event ID and Agency ID are required' } };
      }

      log.debug('Updating calendar event', { eventId, agencyId, updates });

      // Prepare update payload (only include defined fields)
      const payload = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.event_type !== undefined) payload.event_type = updates.event_type;
      if (updates.start_date !== undefined) payload.start_date = updates.start_date;
      if (updates.start_time !== undefined) payload.start_time = updates.start_time;
      if (updates.end_time !== undefined) payload.end_time = updates.end_time;
      if (updates.location !== undefined) payload.location = updates.location;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.outcome !== undefined) payload.outcome = updates.outcome;

      payload.updated_at = new Date().toISOString();

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateCalendarEventDocument,
        variables: {
          id: eventId,
          agency_id: agencyId,
          data: payload,
        },
      });

      if (errors && errors.length > 0) {
        log.error('GraphQL errors updating calendar event:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const updated = data?.update_calendar_events?.returning?.[0];
      log.info('Calendar event updated successfully', { id: eventId });

      return { data: updated, error: null };
    } catch (error) {
      log.error('Failed to update calendar event:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Delete a calendar event
   * @param {string} eventId - The event UUID
   * @param {string} agencyId - The agency ID (Firebase UID)
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async deleteCalendarEvent(eventId, agencyId) {
    try {
      if (!eventId || !agencyId) {
        return { data: null, error: { message: 'Event ID and Agency ID are required' } };
      }

      log.debug('Deleting calendar event', { eventId, agencyId });

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteCalendarEventDocument,
        variables: {
          id: eventId,
          agency_id: agencyId,
        },
      });

      if (errors && errors.length > 0) {
        log.error('GraphQL errors deleting calendar event:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const affectedRows = data?.delete_calendar_events?.affected_rows || 0;
      log.info('Calendar event deleted', { eventId, affectedRows });

      return { data: { success: affectedRows > 0 }, error: null };
    } catch (error) {
      log.error('Failed to delete calendar event:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // ============================================================================
  // AGENCY TASKS
  // ============================================================================

  /**
   * Get all tasks for an agency
   * Maps 'progress' field from DB to 'completion_percentage' for UI compatibility
   * @param {string} agencyId - The agency ID (Firebase UID)
   * @param {object} filters - Optional filters (not used server-side, filtering done in UI)
   * @returns {Promise<{data: Array|null, error: object|null}>}
   */
  async getTasksWithFilters(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        log.warn('No agency ID provided for tasks');
        return { data: [], error: null };
      }

      log.debug('Fetching agency tasks', { agencyId });

      const { data, errors } = await apolloClient.query({
        query: GetAgencyTasksDocument,
        variables: { agency_id: agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        log.error('GraphQL errors fetching tasks:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      // Map progress to completion_percentage and user to assigned_to for UI compatibility
      const tasks = (data?.agency_tasks || []).map(task => ({
        ...task,
        completion_percentage: task.progress || 0,
        actual_hours: 0, // Not in schema, default to 0
        assigned_to: task.user ? {
          id: task.user.id,
          name: task.user.email?.split('@')[0] || 'Unknown',
          email: task.user.email,
        } : null,
      }));

      log.info(`Fetched ${tasks.length} tasks`);

      return { data: tasks, error: null };
    } catch (error) {
      log.error('Failed to fetch tasks:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Get a single task by ID
   * @param {string} taskId - The task UUID
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async getTaskById(taskId) {
    try {
      if (!taskId) {
        return { data: null, error: { message: 'Task ID is required' } };
      }

      const { data, errors } = await apolloClient.query({
        query: GetAgencyTaskByIdDocument,
        variables: { id: taskId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        log.error('GraphQL errors fetching task:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const task = data?.agency_tasks_by_pk;
      if (task) {
        // Map fields for UI compatibility
        task.completion_percentage = task.progress || 0;
        task.actual_hours = 0;
        task.assigned_to = task.user ? {
          id: task.user.id,
          name: task.user.email?.split('@')[0] || 'Unknown',
          email: task.user.email,
        } : null;
      }

      return { data: task, error: null };
    } catch (error) {
      log.error('Failed to fetch task:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Create a new task
   * @param {string} agencyId - The agency ID (Firebase UID)
   * @param {object} taskData - The task data
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async createTask(agencyId, taskData) {
    try {
      if (!agencyId) {
        return { data: null, error: { message: 'Agency ID is required' } };
      }

      log.debug('Creating task', { agencyId, taskData });

      // Prepare the payload - map completion_percentage to progress
      const payload = {
        agency_id: agencyId,
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority || 'medium',
        status: taskData.status || 'pending',
        due_date: taskData.due_date || null,
        assigned_to_id: taskData.assigned_to_id || null,
        estimated_hours: taskData.estimated_hours || null,
        progress: taskData.completion_percentage || 0,
        tags: taskData.tags || [],
        task_type: taskData.task_type || null,
        related_maid_id: taskData.related_maid_id || null,
        related_sponsor_id: taskData.related_sponsor_id || null,
      };

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateAgencyTaskDocument,
        variables: { data: payload },
      });

      if (errors && errors.length > 0) {
        log.error('GraphQL errors creating task:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const created = data?.insert_agency_tasks_one;

      // Map fields for UI compatibility
      if (created) {
        created.completion_percentage = created.progress || 0;
        created.actual_hours = 0;
        created.assigned_to = created.user ? {
          id: created.user.id,
          name: created.user.email?.split('@')[0] || 'Unknown',
          email: created.user.email,
        } : null;
      }

      log.info('Task created successfully', { id: created?.id });

      return { data: created, error: null };
    } catch (error) {
      log.error('Failed to create task:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Update task status and progress
   * @param {string} taskId - The task UUID
   * @param {string} agencyId - The agency ID (Firebase UID)
   * @param {string} status - The new status
   * @param {number} completionPercentage - The completion percentage (0-100)
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateTaskStatus(taskId, agencyId, status, completionPercentage) {
    try {
      if (!taskId || !agencyId) {
        return { data: null, error: { message: 'Task ID and Agency ID are required' } };
      }

      log.debug('Updating task status', { taskId, agencyId, status, completionPercentage });

      const payload = {
        status,
        progress: completionPercentage,
        updated_at: new Date().toISOString(),
      };

      // If completed, set completed_at
      if (status === 'completed') {
        payload.completed_at = new Date().toISOString();
      }

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateAgencyTaskDocument,
        variables: {
          id: taskId,
          agency_id: agencyId,
          data: payload,
        },
      });

      if (errors && errors.length > 0) {
        log.error('GraphQL errors updating task status:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const updated = data?.update_agency_tasks?.returning?.[0];
      log.info('Task status updated successfully', { taskId, status });

      return { data: updated, error: null };
    } catch (error) {
      log.error('Failed to update task status:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Update a task
   * @param {string} taskId - The task UUID
   * @param {string} agencyId - The agency ID (Firebase UID)
   * @param {object} updates - The fields to update
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async updateTask(taskId, agencyId, updates) {
    try {
      if (!taskId || !agencyId) {
        return { data: null, error: { message: 'Task ID and Agency ID are required' } };
      }

      log.debug('Updating task', { taskId, agencyId, updates });

      // Prepare update payload
      const payload = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.due_date !== undefined) payload.due_date = updates.due_date;
      if (updates.assigned_to_id !== undefined) payload.assigned_to_id = updates.assigned_to_id;
      if (updates.estimated_hours !== undefined) payload.estimated_hours = updates.estimated_hours;
      if (updates.completion_percentage !== undefined) payload.progress = updates.completion_percentage;
      if (updates.progress !== undefined) payload.progress = updates.progress;
      if (updates.tags !== undefined) payload.tags = updates.tags;

      payload.updated_at = new Date().toISOString();

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateAgencyTaskDocument,
        variables: {
          id: taskId,
          agency_id: agencyId,
          data: payload,
        },
      });

      if (errors && errors.length > 0) {
        log.error('GraphQL errors updating task:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const updated = data?.update_agency_tasks?.returning?.[0];
      log.info('Task updated successfully', { taskId });

      return { data: updated, error: null };
    } catch (error) {
      log.error('Failed to update task:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  /**
   * Delete a task
   * @param {string} taskId - The task UUID
   * @param {string} agencyId - The agency ID (Firebase UID)
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  async deleteTask(taskId, agencyId) {
    try {
      if (!taskId || !agencyId) {
        return { data: null, error: { message: 'Task ID and Agency ID are required' } };
      }

      log.debug('Deleting task', { taskId, agencyId });

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteAgencyTaskDocument,
        variables: {
          id: taskId,
          agency_id: agencyId,
        },
      });

      if (errors && errors.length > 0) {
        log.error('GraphQL errors deleting task:', errors);
        return { data: null, error: { message: errors[0].message } };
      }

      const affectedRows = data?.delete_agency_tasks?.affected_rows || 0;
      log.info('Task deleted', { taskId, affectedRows });

      return { data: { success: affectedRows > 0 }, error: null };
    } catch (error) {
      log.error('Failed to delete task:', error);
      return { data: null, error: { message: error.message } };
    }
  },
};

export default graphqlCalendarService;
