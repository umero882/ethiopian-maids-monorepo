import { gql } from '@apollo/client';
import { apolloClient } from '@ethio/api-client';
import { createLogger } from '@/utils/logger';

const log = createLogger('SupportService.GraphQL');

// Get support tickets for agency
const GetSupportTicketsDocument = gql`
  query GetSupportTickets($userId: uuid!, $status: String, $priority: String, $category: String, $limit: Int = 50) {
    support_tickets(
      where: {
        user_id: { _eq: $userId }
        status: { _eq: $status }
        priority: { _eq: $priority }
        category: { _eq: $category }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      subject
      message
      category
      priority
      status
      user_id
      user_name
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
    }
  }
`;

// Get all support tickets (no status filter)
const GetAllSupportTicketsDocument = gql`
  query GetAllSupportTickets($userId: uuid!, $limit: Int = 50) {
    support_tickets(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      subject
      message
      category
      priority
      status
      user_id
      user_name
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
    }
  }
`;

// Get support ticket stats
const GetSupportTicketStatsDocument = gql`
  query GetSupportTicketStats($userId: uuid!) {
    total: support_tickets_aggregate(
      where: { user_id: { _eq: $userId } }
    ) {
      aggregate {
        count
        avg {
          satisfaction_rating
        }
      }
    }
    open: support_tickets_aggregate(
      where: { user_id: { _eq: $userId }, status: { _eq: "open" } }
    ) {
      aggregate {
        count
      }
    }
    in_progress: support_tickets_aggregate(
      where: { user_id: { _eq: $userId }, status: { _eq: "in_progress" } }
    ) {
      aggregate {
        count
      }
    }
    resolved: support_tickets_aggregate(
      where: { user_id: { _eq: $userId }, status: { _in: ["resolved", "closed"] } }
    ) {
      aggregate {
        count
      }
    }
    high_priority: support_tickets_aggregate(
      where: { user_id: { _eq: $userId }, priority: { _eq: "high" } }
    ) {
      aggregate {
        count
      }
    }
    critical: support_tickets_aggregate(
      where: { user_id: { _eq: $userId }, priority: { _eq: "critical" } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Get disputes for agency
const GetDisputesDocument = gql`
  query GetDisputes($agencyId: uuid!, $status: String, $limit: Int = 50) {
    disputes(
      where: {
        agency_id: { _eq: $agencyId }
        status: { _eq: $status }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      title
      description
      dispute_type
      status
      priority
      claimed_amount
      awarded_amount
      currency
      raised_by_id
      raised_by_type
      maid_id
      sponsor_id
      placement_id
      assigned_mediator_id
      assigned_mediator_name
      resolution_type
      resolution_notes
      resolved_at
      resolved_by_id
      first_response_at
      last_activity_at
      internal_notes
      tags
      evidence_summary
      created_at
      updated_at
      dispute_parties {
        id
        party_name
        party_type
        party_role
      }
      dispute_evidences {
        id
        evidence_type
        file_url
        description
        uploaded_at
      }
      userByRaisedById {
        id
        full_name
        email
      }
    }
  }
`;

// Get all disputes (no status filter)
const GetAllDisputesDocument = gql`
  query GetAllDisputes($agencyId: uuid!, $limit: Int = 50) {
    disputes(
      where: { agency_id: { _eq: $agencyId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      title
      description
      dispute_type
      status
      priority
      claimed_amount
      awarded_amount
      currency
      raised_by_id
      raised_by_type
      maid_id
      sponsor_id
      placement_id
      assigned_mediator_id
      assigned_mediator_name
      resolution_type
      resolution_notes
      resolved_at
      resolved_by_id
      first_response_at
      last_activity_at
      internal_notes
      tags
      evidence_summary
      created_at
      updated_at
      dispute_parties {
        id
        party_name
        party_type
        party_role
      }
      dispute_evidences {
        id
        evidence_type
        file_url
        description
        uploaded_at
      }
      userByRaisedById {
        id
        full_name
        email
      }
    }
  }
`;

// Get dispute stats
const GetDisputeStatsDocument = gql`
  query GetDisputeStats($agencyId: uuid!) {
    total: disputes_aggregate(
      where: { agency_id: { _eq: $agencyId } }
    ) {
      aggregate {
        count
        sum {
          claimed_amount
          awarded_amount
        }
      }
    }
    open: disputes_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        status: { _in: ["open", "under_investigation", "mediation_scheduled"] }
      }
    ) {
      aggregate {
        count
      }
    }
    resolved: disputes_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        status: { _in: ["resolved", "closed", "settled"] }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Create support ticket
const CreateSupportTicketDocument = gql`
  mutation CreateSupportTicket($data: support_tickets_insert_input!) {
    insert_support_tickets_one(object: $data) {
      id
      subject
      message
      category
      priority
      status
      created_at
    }
  }
`;

// Update support ticket status
const UpdateTicketStatusDocument = gql`
  mutation UpdateTicketStatus($id: uuid!, $status: String!, $updated_at: timestamptz!) {
    update_support_tickets_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, updated_at: $updated_at }
    ) {
      id
      status
      updated_at
    }
  }
`;

// Update dispute status
const UpdateDisputeStatusDocument = gql`
  mutation UpdateDisputeStatus($id: uuid!, $status: String!, $updated_at: timestamptz!) {
    update_disputes_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, updated_at: $updated_at, last_activity_at: $updated_at }
    ) {
      id
      status
      updated_at
    }
  }
`;

// Get support messages for a ticket
const GetSupportMessagesDocument = gql`
  query GetSupportMessages($ticketId: uuid!) {
    support_messages(
      where: { ticket_id: { _eq: $ticketId } }
      order_by: { created_at: asc }
    ) {
      id
      ticket_id
      sender_id
      sender_name
      sender_type
      message
      attachments
      is_internal
      created_at
    }
  }
`;

// Add support message
const AddSupportMessageDocument = gql`
  mutation AddSupportMessage($data: support_messages_insert_input!) {
    insert_support_messages_one(object: $data) {
      id
      ticket_id
      message
      created_at
    }
  }
`;

// Knowledge base - common issues
const KNOWLEDGE_BASE = {
  commonIssues: [
    {
      id: 1,
      title: 'How to update maid profile information',
      description: 'Navigate to Maid Management > Select maid > Edit Profile to update details like skills, experience, and photos.',
      views: 1250,
      rating: 4.8,
      category: 'profile'
    },
    {
      id: 2,
      title: 'Understanding placement fee structure',
      description: 'Placement fees are 500 AED per successful placement. Fees are held in escrow until visa approval, then released.',
      views: 980,
      rating: 4.6,
      category: 'billing'
    },
    {
      id: 3,
      title: 'How to resolve visa rejection issues',
      description: 'Contact support with the rejection reason. We can help prepare reapplication documents or find alternative sponsors.',
      views: 756,
      rating: 4.5,
      category: 'placement'
    },
    {
      id: 4,
      title: 'Document verification requirements',
      description: 'All agencies must upload: Trade License, Authorized Person ID, and Agency Logo. Documents are verified within 24-48 hours.',
      views: 654,
      rating: 4.7,
      category: 'documentation'
    },
    {
      id: 5,
      title: 'How to handle maid returns',
      description: 'If a maid is returned before visa approval, the placement fee is converted to credit for your next placement.',
      views: 543,
      rating: 4.4,
      category: 'placement'
    }
  ],
  templates: [
    {
      id: 1,
      title: 'Acknowledging New Ticket',
      category: 'general',
      content: 'Thank you for contacting support. We have received your request and our team is reviewing it. You can expect a response within 24 hours.'
    },
    {
      id: 2,
      title: 'Requesting More Information',
      category: 'technical',
      content: 'To better assist you, could you please provide: 1) The specific error message you\'re seeing, 2) Steps to reproduce the issue, 3) Screenshots if available.'
    },
    {
      id: 3,
      title: 'Billing Inquiry Response',
      category: 'billing',
      content: 'Regarding your billing inquiry, I\'ve reviewed your account and found [details]. Please let me know if you need any clarification or have additional questions.'
    },
    {
      id: 4,
      title: 'Ticket Resolution',
      category: 'general',
      content: 'Your issue has been resolved. Please test and confirm everything is working as expected. Don\'t hesitate to reach out if you need further assistance.'
    }
  ]
};

class SupportService {
  async getSupportTickets(userId, filters = {}) {
    try {
      const { status, priority, category } = filters;

      // Use different query based on whether we have filters
      const hasFilters = status && status !== 'all' || priority && priority !== 'all' || category && category !== 'all';

      if (!hasFilters) {
        const { data, errors } = await apolloClient.query({
          query: GetAllSupportTicketsDocument,
          variables: { userId, limit: 50 },
          fetchPolicy: 'network-only',
        });

        if (errors) {
          log.error('GraphQL errors:', errors);
          return { data: [], error: errors[0] };
        }

        return { data: data?.support_tickets || [], error: null };
      }

      // Build variables with filters
      const variables = { userId, limit: 50 };
      if (status && status !== 'all') variables.status = status;
      if (priority && priority !== 'all') variables.priority = priority;
      if (category && category !== 'all') variables.category = category;

      const { data, errors } = await apolloClient.query({
        query: GetSupportTicketsDocument,
        variables,
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: [], error: errors[0] };
      }

      return { data: data?.support_tickets || [], error: null };
    } catch (error) {
      log.error('Error fetching support tickets:', error);
      return { data: [], error };
    }
  }

  async getTicketStats(userId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetSupportTicketStatsDocument,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: errors[0] };
      }

      const total = data?.total?.aggregate?.count || 0;
      const open = data?.open?.aggregate?.count || 0;
      const inProgress = data?.in_progress?.aggregate?.count || 0;
      const resolved = data?.resolved?.aggregate?.count || 0;
      const highPriority = data?.high_priority?.aggregate?.count || 0;
      const critical = data?.critical?.aggregate?.count || 0;
      const avgSatisfaction = data?.total?.aggregate?.avg?.satisfaction_rating || 0;

      // Calculate resolution rate
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      // Calculate average response time (mock for now - would need timestamps)
      const avgResponseTime = total > 0 ? 2.5 : 0; // hours

      return {
        data: {
          totalTickets: total,
          openTickets: open,
          inProgressTickets: inProgress,
          resolvedTickets: resolved,
          highPriorityTickets: highPriority,
          criticalTickets: critical,
          resolutionRate,
          averageResponseTime: avgResponseTime,
          satisfactionScore: avgSatisfaction,
        },
        error: null,
      };
    } catch (error) {
      log.error('Error fetching ticket stats:', error);
      return { data: null, error };
    }
  }

  async getDisputes(agencyId, filters = {}) {
    try {
      const { status } = filters;

      if (!status || status === 'all') {
        const { data, errors } = await apolloClient.query({
          query: GetAllDisputesDocument,
          variables: { agencyId, limit: 50 },
          fetchPolicy: 'network-only',
        });

        if (errors) {
          log.error('GraphQL errors:', errors);
          return { data: [], error: errors[0] };
        }

        // Transform disputes to expected format
        const disputes = (data?.disputes || []).map(dispute => ({
          ...dispute,
          dispute_number: dispute.id.substring(0, 8).toUpperCase(),
          type: dispute.dispute_type,
          disputed_amount: dispute.claimed_amount,
          complainant_name: dispute.userByRaisedById?.full_name || 'Unknown',
          severity: dispute.priority,
          parties: dispute.dispute_parties?.map(p => ({
            name: p.party_name,
            role: p.party_role || p.party_type,
          })) || [],
          evidence: dispute.dispute_evidences?.map(e => ({
            name: e.description || `Evidence ${e.evidence_type}`,
            type: e.evidence_type,
            url: e.file_url,
          })) || [],
        }));

        return { data: disputes, error: null };
      }

      const { data, errors } = await apolloClient.query({
        query: GetDisputesDocument,
        variables: { agencyId, status, limit: 50 },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: [], error: errors[0] };
      }

      // Transform disputes
      const disputes = (data?.disputes || []).map(dispute => ({
        ...dispute,
        dispute_number: dispute.id.substring(0, 8).toUpperCase(),
        type: dispute.dispute_type,
        disputed_amount: dispute.claimed_amount,
        complainant_name: dispute.userByRaisedById?.full_name || 'Unknown',
        severity: dispute.priority,
        parties: dispute.dispute_parties?.map(p => ({
          name: p.party_name,
          role: p.party_role || p.party_type,
        })) || [],
        evidence: dispute.dispute_evidences?.map(e => ({
          name: e.description || `Evidence ${e.evidence_type}`,
          type: e.evidence_type,
          url: e.file_url,
        })) || [],
      }));

      return { data: disputes, error: null };
    } catch (error) {
      log.error('Error fetching disputes:', error);
      return { data: [], error };
    }
  }

  async getDisputeStats(agencyId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetDisputeStatsDocument,
        variables: { agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: errors[0] };
      }

      return {
        data: {
          totalDisputes: data?.total?.aggregate?.count || 0,
          openDisputes: data?.open?.aggregate?.count || 0,
          resolvedDisputes: data?.resolved?.aggregate?.count || 0,
          totalClaimedAmount: parseFloat(data?.total?.aggregate?.sum?.claimed_amount) || 0,
          totalAwardedAmount: parseFloat(data?.total?.aggregate?.sum?.awarded_amount) || 0,
        },
        error: null,
      };
    } catch (error) {
      log.error('Error fetching dispute stats:', error);
      return { data: null, error };
    }
  }

  async createTicket(userId, userName, userEmail, ticketData) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: CreateSupportTicketDocument,
        variables: {
          data: {
            user_id: userId,
            user_name: userName,
            user_email: userEmail,
            user_type: 'agency',
            subject: ticketData.subject,
            message: ticketData.message,
            category: ticketData.category,
            priority: ticketData.priority,
            status: 'open',
          },
        },
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: errors[0] };
      }

      return { data: data?.insert_support_tickets_one, error: null };
    } catch (error) {
      log.error('Error creating ticket:', error);
      return { data: null, error };
    }
  }

  async updateTicketStatus(ticketId, newStatus) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateTicketStatusDocument,
        variables: {
          id: ticketId,
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: errors[0] };
      }

      return { data: data?.update_support_tickets_by_pk, error: null };
    } catch (error) {
      log.error('Error updating ticket status:', error);
      return { data: null, error };
    }
  }

  async updateDisputeStatus(disputeId, newStatus) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateDisputeStatusDocument,
        variables: {
          id: disputeId,
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: errors[0] };
      }

      return { data: data?.update_disputes_by_pk, error: null };
    } catch (error) {
      log.error('Error updating dispute status:', error);
      return { data: null, error };
    }
  }

  async getSupportMessages(ticketId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetSupportMessagesDocument,
        variables: { ticketId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: [], error: errors[0] };
      }

      return { data: data?.support_messages || [], error: null };
    } catch (error) {
      log.error('Error fetching support messages:', error);
      return { data: [], error };
    }
  }

  async addSupportMessage(ticketId, senderId, senderName, senderType, message) {
    try {
      const { data, errors } = await apolloClient.mutate({
        mutation: AddSupportMessageDocument,
        variables: {
          data: {
            ticket_id: ticketId,
            sender_id: senderId,
            sender_name: senderName,
            sender_type: senderType,
            message,
          },
        },
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: errors[0] };
      }

      return { data: data?.insert_support_messages_one, error: null };
    } catch (error) {
      log.error('Error adding support message:', error);
      return { data: null, error };
    }
  }

  getKnowledgeBase() {
    return KNOWLEDGE_BASE;
  }

  async getSupportData(userId, filters = {}) {
    try {
      // Fetch all support data in parallel
      const [ticketsResult, statsResult, disputeStatsResult] = await Promise.all([
        this.getSupportTickets(userId, filters),
        this.getTicketStats(userId),
        this.getDisputeStats(userId),
      ]);

      // Transform tickets to expected format
      const tickets = (ticketsResult.data || []).map(ticket => ({
        ...ticket,
        ticket_number: ticket.id.substring(0, 8).toUpperCase(),
        title: ticket.subject || 'No Subject',
        description: ticket.message,
        requester_name: ticket.user_name,
        requester_email: ticket.user_email,
        requester_phone: null, // Not stored in schema
        assigned_to: ticket.assigned_agent_name ? {
          name: ticket.assigned_agent_name,
          id: ticket.assigned_agent_id,
        } : null,
        last_updated_at: ticket.updated_at
          ? new Date(ticket.updated_at).toLocaleDateString()
          : new Date(ticket.created_at).toLocaleDateString(),
        activity: [], // Would need separate query
      }));

      return {
        data: {
          tickets,
          stats: statsResult.data || {},
          disputeStats: disputeStatsResult.data || {},
          knowledgeBase: KNOWLEDGE_BASE,
        },
        error: null,
      };
    } catch (error) {
      log.error('Error fetching support data:', error);
      return { data: null, error };
    }
  }
}

export const supportService = new SupportService();
export default supportService;
