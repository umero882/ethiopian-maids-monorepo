/**
 * Admin Support Service
 * Provides GraphQL operations for admin support ticket management
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('adminSupportService');

// GraphQL Queries

/**
 * Get all support tickets with pagination and filters
 */
const GET_TICKETS = gql`
  query GetAdminSupportTickets(
    $limit: Int!
    $offset: Int!
    $where: support_tickets_bool_exp
    $order_by: [support_tickets_order_by!]
  ) {
    support_tickets(
      limit: $limit
      offset: $offset
      where: $where
      order_by: $order_by
    ) {
      id
      subject
      message
      category
      priority
      status
      user_id
      user_name
      user_type
      user_email
      assigned_agent_id
      assigned_agent_name
      first_response_at
      last_response_at
      resolved_at
      closed_at
      response_count
      satisfaction_rating
      feedback_comment
      tags
      internal_notes
      metadata
      created_at
      updated_at
      support_messages(order_by: { created_at: asc }) {
        id
        sender_id
        sender_name
        sender_type
        message
        attachments
        is_internal
        created_at
      }
    }
    support_tickets_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

/**
 * Get support ticket statistics
 */
const GET_TICKET_STATS = gql`
  query GetSupportTicketStats {
    # Total tickets
    total: support_tickets_aggregate {
      aggregate {
        count
      }
    }

    # By status - using the actual status values in DB
    open: support_tickets_aggregate(where: { status: { _eq: "open" } }) {
      aggregate {
        count
      }
    }

    in_progress: support_tickets_aggregate(where: { status: { _eq: "in_progress" } }) {
      aggregate {
        count
      }
    }

    resolved: support_tickets_aggregate(where: { status: { _eq: "resolved" } }) {
      aggregate {
        count
      }
    }

    closed: support_tickets_aggregate(where: { status: { _eq: "closed" } }) {
      aggregate {
        count
      }
    }

    escalated: support_tickets_aggregate(where: { status: { _eq: "escalated" } }) {
      aggregate {
        count
      }
    }

    # By priority
    high_priority: support_tickets_aggregate(where: { priority: { _eq: "high" } }) {
      aggregate {
        count
      }
    }

    # By user type
    maid_tickets: support_tickets_aggregate(where: { user_type: { _eq: "maid" } }) {
      aggregate {
        count
      }
    }

    sponsor_tickets: support_tickets_aggregate(where: { user_type: { _eq: "sponsor" } }) {
      aggregate {
        count
      }
    }

    agency_tickets: support_tickets_aggregate(where: { user_type: { _eq: "agency" } }) {
      aggregate {
        count
      }
    }

    # Average satisfaction
    satisfaction: support_tickets_aggregate(where: { satisfaction_rating: { _is_null: false } }) {
      aggregate {
        count
        avg {
          satisfaction_rating
        }
      }
    }

    # With first response
    responded: support_tickets_aggregate(where: { first_response_at: { _is_null: false } }) {
      aggregate {
        count
      }
    }
  }
`;

/**
 * Get single ticket by ID
 */
const GET_TICKET_BY_ID = gql`
  query GetSupportTicketById($id: uuid!) {
    support_tickets_by_pk(id: $id) {
      id
      subject
      message
      category
      priority
      status
      user_id
      user_name
      user_type
      user_email
      assigned_agent_id
      assigned_agent_name
      first_response_at
      last_response_at
      resolved_at
      closed_at
      response_count
      satisfaction_rating
      feedback_comment
      tags
      internal_notes
      metadata
      created_at
      updated_at
      support_messages(order_by: { created_at: asc }) {
        id
        sender_id
        sender_name
        sender_type
        message
        attachments
        is_internal
        created_at
      }
    }
  }
`;

/**
 * Update ticket status
 */
const UPDATE_TICKET_STATUS = gql`
  mutation UpdateSupportTicketStatus(
    $id: uuid!
    $status: String!
    $resolved_at: timestamptz
    $closed_at: timestamptz
    $internal_notes: String
  ) {
    update_support_tickets_by_pk(
      pk_columns: { id: $id }
      _set: {
        status: $status
        resolved_at: $resolved_at
        closed_at: $closed_at
        internal_notes: $internal_notes
      }
    ) {
      id
      status
      resolved_at
      closed_at
      internal_notes
      updated_at
    }
  }
`;

/**
 * Assign ticket to agent
 */
const ASSIGN_TICKET = gql`
  mutation AssignSupportTicket(
    $id: uuid!
    $assigned_agent_id: uuid
    $assigned_agent_name: String
    $first_response_at: timestamptz
  ) {
    update_support_tickets_by_pk(
      pk_columns: { id: $id }
      _set: {
        assigned_agent_id: $assigned_agent_id
        assigned_agent_name: $assigned_agent_name
        first_response_at: $first_response_at
        status: "in_progress"
      }
    ) {
      id
      assigned_agent_id
      assigned_agent_name
      first_response_at
      status
      updated_at
    }
  }
`;

/**
 * Add message to ticket
 */
const ADD_TICKET_MESSAGE = gql`
  mutation AddSupportTicketMessage(
    $ticket_id: uuid!
    $sender_id: uuid
    $sender_name: String!
    $sender_type: String!
    $message: String!
    $is_internal: Boolean
  ) {
    insert_support_messages_one(
      object: {
        ticket_id: $ticket_id
        sender_id: $sender_id
        sender_name: $sender_name
        sender_type: $sender_type
        message: $message
        is_internal: $is_internal
      }
    ) {
      id
      ticket_id
      sender_name
      sender_type
      message
      is_internal
      created_at
    }
    update_support_tickets_by_pk(
      pk_columns: { id: $ticket_id }
      _set: { last_response_at: "now()" }
      _inc: { response_count: 1 }
    ) {
      id
      last_response_at
      response_count
    }
  }
`;

/**
 * Update ticket internal notes
 */
const UPDATE_TICKET_NOTES = gql`
  mutation UpdateSupportTicketNotes($id: uuid!, $internal_notes: String!) {
    update_support_tickets_by_pk(
      pk_columns: { id: $id }
      _set: { internal_notes: $internal_notes }
    ) {
      id
      internal_notes
      updated_at
    }
  }
`;

// Service functions

export const adminSupportService = {
  /**
   * Get tickets with pagination, filtering, and sorting
   */
  async getTickets({
    page = 1,
    limit = 10,
    status = 'all',
    category = 'all',
    priority = 'all',
    userType = 'all',
    searchTerm = '',
    sortBy = 'created_at',
    sortDirection = 'desc'
  }) {
    try {
      const offset = (page - 1) * limit;

      // Build where clause
      const whereConditions = [];

      if (status && status !== 'all') {
        whereConditions.push({ status: { _eq: status } });
      }

      // Map UI category values to database values
      if (category && category !== 'all') {
        const categoryMap = {
          'payment_issues': 'billing',
          'technical_issues': 'technical',
          'account_issues': 'technical',
          'booking_issues': 'billing',
          'financial_issues': 'billing',
          // Direct database values
          'technical': 'technical',
          'billing': 'billing'
        };
        const dbCategory = categoryMap[category] || category;
        whereConditions.push({ category: { _eq: dbCategory } });
      }

      if (priority && priority !== 'all') {
        whereConditions.push({ priority: { _eq: priority } });
      }

      if (userType && userType !== 'all') {
        whereConditions.push({ user_type: { _eq: userType } });
      }

      if (searchTerm) {
        whereConditions.push({
          _or: [
            { subject: { _ilike: `%${searchTerm}%` } },
            { message: { _ilike: `%${searchTerm}%` } },
            { user_name: { _ilike: `%${searchTerm}%` } },
            { user_email: { _ilike: `%${searchTerm}%` } }
          ]
        });
      }

      const where = whereConditions.length > 0
        ? { _and: whereConditions }
        : {};

      // Build order by
      const order_by = [{ [sortBy]: sortDirection }];

      console.log('[adminSupportService] Fetching tickets with:', { limit, offset, where, order_by });

      const result = await apolloClient.query({
        query: GET_TICKETS,
        variables: { limit, offset, where, order_by },
        fetchPolicy: 'network-only'
      });

      console.log('[adminSupportService] Query result:', result);

      // Apollo Client 4 returns { data, error, errors, loading, networkStatus }
      const { data, error, errors } = result;

      if (error) {
        log.error('Apollo error fetching tickets:', error);
        console.error('[adminSupportService] Apollo error:', error);
        return { data: null, error };
      }

      if (errors && errors.length > 0) {
        log.error('GraphQL errors fetching tickets:', errors);
        console.error('[adminSupportService] GraphQL errors:', errors);
        return { data: null, error: errors[0] };
      }

      const tickets = data?.support_tickets || [];
      const totalCount = data?.support_tickets_aggregate?.aggregate?.count || 0;

      console.log('[adminSupportService] Found', tickets.length, 'tickets, total:', totalCount);

      // Transform tickets to match UI expectations
      const transformedTickets = tickets.map(ticket => ({
        id: ticket.id,
        ticket_id: `SUP-${ticket.id.substring(0, 8).toUpperCase()}`,
        subject: ticket.subject || 'No Subject',
        description: ticket.message,
        category: this.mapCategory(ticket.category),
        subcategory: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        requester: {
          id: ticket.user_id,
          name: ticket.user_name,
          email: ticket.user_email,
          phone: null,
          type: ticket.user_type,
          avatar: null
        },
        assigned_agent: ticket.assigned_agent_name ? {
          id: ticket.assigned_agent_id,
          name: ticket.assigned_agent_name,
          email: null,
          avatar: null
        } : null,
        tags: ticket.tags || [],
        satisfaction_rating: ticket.satisfaction_rating,
        estimated_resolution: null,
        actual_resolution: ticket.resolved_at,
        first_response_time: this.calculateResponseTime(ticket.created_at, ticket.first_response_at),
        resolution_time: this.calculateResponseTime(ticket.created_at, ticket.resolved_at),
        escalated: ticket.status === 'escalated',
        messages: (ticket.support_messages || []).map(msg => ({
          id: msg.id,
          sender_type: msg.sender_type,
          sender_name: msg.sender_name,
          message: msg.message,
          timestamp: msg.created_at,
          attachments: msg.attachments || [],
          is_internal: msg.is_internal || false
        }))
      }));

      return {
        data: {
          tickets: transformedTickets,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page
        },
        error: null
      };
    } catch (error) {
      log.error('Error fetching tickets:', error);
      return { data: null, error };
    }
  },

  /**
   * Map database category to UI category
   */
  mapCategory(dbCategory) {
    const categoryMap = {
      'technical': 'technical_issues',
      'billing': 'payment_issues',
      'general': 'booking_issues',
      'account': 'account_issues'
    };
    return categoryMap[dbCategory] || dbCategory;
  },

  /**
   * Calculate response time in minutes
   */
  calculateResponseTime(startTime, endTime) {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end - start) / (1000 * 60)); // minutes
  },

  /**
   * Get ticket statistics
   */
  async getStats() {
    try {
      console.log('[adminSupportService] Fetching ticket stats...');

      const result = await apolloClient.query({
        query: GET_TICKET_STATS,
        fetchPolicy: 'network-only'
      });

      console.log('[adminSupportService] Stats result:', result);

      const { data, error, errors } = result;

      if (error) {
        log.error('Apollo error fetching ticket stats:', error);
        console.error('[adminSupportService] Apollo error on stats:', error);
        return { data: null, error };
      }

      if (errors && errors.length > 0) {
        log.error('GraphQL errors fetching ticket stats:', errors);
        console.error('[adminSupportService] GraphQL errors on stats:', errors);
        return { data: null, error: errors[0] };
      }

      const totalTickets = data?.total?.aggregate?.count || 0;
      const openTickets = (data?.open?.aggregate?.count || 0) + (data?.in_progress?.aggregate?.count || 0);
      const resolvedTickets = (data?.resolved?.aggregate?.count || 0) + (data?.closed?.aggregate?.count || 0);
      const escalatedTickets = data?.escalated?.aggregate?.count || 0;
      const highPriorityTickets = data?.high_priority?.aggregate?.count || 0;
      const respondedTickets = data?.responded?.aggregate?.count || 0;
      const satisfactionCount = data?.satisfaction?.aggregate?.count || 0;
      const avgSatisfaction = data?.satisfaction?.aggregate?.avg?.satisfaction_rating || 0;

      // Calculate metrics
      const avgFirstResponse = totalTickets > 0 && respondedTickets > 0
        ? Math.round((respondedTickets / totalTickets) * 60) // Placeholder - would need timestamp calculation
        : 0;

      const avgResolution = resolvedTickets > 0
        ? Math.round((resolvedTickets / totalTickets) * 180) // Placeholder - would need timestamp calculation
        : 0;

      const stats = {
        totalTickets,
        openTickets,
        escalatedTickets,
        avgFirstResponse, // in minutes
        avgResolution, // in minutes
        satisfactionScore: avgSatisfaction,
        byUserType: {
          maid: data?.maid_tickets?.aggregate?.count || 0,
          sponsor: data?.sponsor_tickets?.aggregate?.count || 0,
          agency: data?.agency_tickets?.aggregate?.count || 0
        },
        byStatus: {
          open: data?.open?.aggregate?.count || 0,
          in_progress: data?.in_progress?.aggregate?.count || 0,
          resolved: data?.resolved?.aggregate?.count || 0,
          closed: data?.closed?.aggregate?.count || 0,
          escalated: data?.escalated?.aggregate?.count || 0
        }
      };

      return { data: stats, error: null };
    } catch (error) {
      log.error('Error fetching ticket stats:', error);
      return { data: null, error };
    }
  },

  /**
   * Get ticket by ID
   */
  async getTicketById(id) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_TICKET_BY_ID,
        variables: { id },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        log.error('GraphQL errors fetching ticket:', errors);
        return { data: null, error: errors[0] };
      }

      const ticket = data?.support_tickets_by_pk;

      if (!ticket) {
        return { data: null, error: new Error('Ticket not found') };
      }

      // Transform ticket
      const transformedTicket = {
        id: ticket.id,
        ticket_id: `SUP-${ticket.id.substring(0, 8).toUpperCase()}`,
        subject: ticket.subject || 'No Subject',
        description: ticket.message,
        category: this.mapCategory(ticket.category),
        subcategory: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        requester: {
          id: ticket.user_id,
          name: ticket.user_name,
          email: ticket.user_email,
          phone: null,
          type: ticket.user_type,
          avatar: null
        },
        assigned_agent: ticket.assigned_agent_name ? {
          id: ticket.assigned_agent_id,
          name: ticket.assigned_agent_name,
          email: null,
          avatar: null
        } : null,
        tags: ticket.tags || [],
        satisfaction_rating: ticket.satisfaction_rating,
        actual_resolution: ticket.resolved_at,
        first_response_time: this.calculateResponseTime(ticket.created_at, ticket.first_response_at),
        resolution_time: this.calculateResponseTime(ticket.created_at, ticket.resolved_at),
        escalated: ticket.status === 'escalated',
        internal_notes: ticket.internal_notes,
        messages: (ticket.support_messages || []).map(msg => ({
          id: msg.id,
          sender_type: msg.sender_type,
          sender_name: msg.sender_name,
          message: msg.message,
          timestamp: msg.created_at,
          attachments: msg.attachments || [],
          is_internal: msg.is_internal || false
        }))
      };

      return { data: transformedTicket, error: null };
    } catch (error) {
      log.error('Error fetching ticket by ID:', error);
      return { data: null, error };
    }
  },

  /**
   * Update ticket status
   */
  async updateTicketStatus(id, action, additionalData = {}) {
    try {
      const now = new Date().toISOString();
      let variables = { id };

      switch (action) {
        case 'in_progress':
          variables.status = 'in_progress';
          break;
        case 'resolve':
          variables.status = 'resolved';
          variables.resolved_at = now;
          break;
        case 'close':
          variables.status = 'closed';
          variables.closed_at = now;
          break;
        case 'escalate':
          variables.status = 'escalated';
          variables.internal_notes = additionalData.notes || 'Escalated by admin';
          break;
        case 'reopen':
          variables.status = 'in_progress';
          variables.resolved_at = null;
          variables.closed_at = null;
          break;
        default:
          return { data: null, error: new Error('Invalid action') };
      }

      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_TICKET_STATUS,
        variables
      });

      if (errors) {
        log.error('GraphQL errors updating ticket:', errors);
        return { data: null, error: errors[0] };
      }

      return { data: data?.update_support_tickets_by_pk, error: null };
    } catch (error) {
      log.error('Error updating ticket status:', error);
      return { data: null, error };
    }
  },

  /**
   * Assign ticket to agent
   */
  async assignTicket(ticketId, agentId, agentName) {
    try {
      const now = new Date().toISOString();

      const { data, errors } = await apolloClient.mutate({
        mutation: ASSIGN_TICKET,
        variables: {
          id: ticketId,
          assigned_agent_id: agentId,
          assigned_agent_name: agentName,
          first_response_at: now
        }
      });

      if (errors) {
        log.error('GraphQL errors assigning ticket:', errors);
        return { data: null, error: errors[0] };
      }

      return { data: data?.update_support_tickets_by_pk, error: null };
    } catch (error) {
      log.error('Error assigning ticket:', error);
      return { data: null, error };
    }
  },

  /**
   * Add message to ticket
   */
  async addMessage(ticketId, senderId, senderName, senderType, message, isInternal = false) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: ADD_TICKET_MESSAGE,
        variables: {
          ticket_id: ticketId,
          sender_id: senderId,
          sender_name: senderName,
          sender_type: senderType,
          message: message,
          is_internal: isInternal
        }
      });

      if (errors) {
        log.error('GraphQL errors adding message:', errors);
        return { data: null, error: errors[0] };
      }

      return { data: data?.insert_support_messages_one, error: null };
    } catch (error) {
      log.error('Error adding message:', error);
      return { data: null, error };
    }
  },

  /**
   * Update ticket internal notes
   */
  async updateNotes(ticketId, notes) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_TICKET_NOTES,
        variables: {
          id: ticketId,
          internal_notes: notes
        }
      });

      if (errors) {
        log.error('GraphQL errors updating notes:', errors);
        return { data: null, error: errors[0] };
      }

      return { data: data?.update_support_tickets_by_pk, error: null };
    } catch (error) {
      log.error('Error updating notes:', error);
      return { data: null, error };
    }
  }
};

export default adminSupportService;
