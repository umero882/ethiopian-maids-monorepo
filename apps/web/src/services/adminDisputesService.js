/**
 * Admin Disputes Service
 * Handles dispute management with Stripe and local database integration
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminDisputesService');

// GraphQL query for local disputes tracking (if table exists)
const GET_LOCAL_DISPUTES = gql`
  query GetLocalDisputes($limit: Int = 50, $offset: Int = 0) {
    disputes: support_tickets(
      where: { category: { _eq: "dispute" } }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      subject
      description
      status
      priority
      created_at
      updated_at
      user_id
      profile {
        id
        full_name
        email
        user_type
      }
    }
    disputes_aggregate: support_tickets_aggregate(
      where: { category: { _eq: "dispute" } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Query for transactions to link with disputes
const GET_TRANSACTIONS = gql`
  query GetTransactions($limit: Int = 100) {
    placement_fee_transactions(
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      fee_amount
      amount_charged
      credits_applied
      currency
      fee_status
      created_at
      agency_id
      placement_workflow_id
      payment_intent_id
    }
  }
`;

class AdminDisputesService {
  constructor() {
    this.stripeApiUrl = '/api/stripe/disputes'; // Backend API endpoint
  }

  /**
   * Fetch disputes from Stripe via backend API
   * In production, this would call your backend which uses Stripe SDK
   */
  async getStripeDisputes(limit = 10) {
    try {
      log.info('Fetching Stripe disputes');

      // In a real implementation, this would call your backend API
      // which has access to your Stripe secret key
      // For now, we'll return empty since we can't directly call Stripe from frontend

      // Example of what the backend response would look like:
      // const response = await fetch(`${this.stripeApiUrl}?limit=${limit}`);
      // return await response.json();

      return { disputes: [], hasMore: false };
    } catch (error) {
      log.error('Error fetching Stripe disputes:', error);
      return { disputes: [], hasMore: false };
    }
  }

  /**
   * Fetch local disputes from support_tickets table
   */
  async getLocalDisputes(options = {}) {
    const { limit = 50, offset = 0 } = options;

    try {
      log.info('Fetching local disputes from support_tickets');

      const { data } = await apolloClient.query({
        query: GET_LOCAL_DISPUTES,
        variables: { limit, offset },
        fetchPolicy: 'network-only',
      });

      const disputes = (data?.disputes || []).map(ticket => this.formatTicketAsDispute(ticket));
      const total = data?.disputes_aggregate?.aggregate?.count || 0;

      return { disputes, total };
    } catch (error) {
      log.error('Error fetching local disputes:', error);
      return { disputes: [], total: 0 };
    }
  }

  /**
   * Get all transactions (for dispute context)
   */
  async getTransactions(limit = 100) {
    try {
      const { data } = await apolloClient.query({
        query: GET_TRANSACTIONS,
        variables: { limit },
        fetchPolicy: 'network-only',
      });

      return data?.placement_fee_transactions || [];
    } catch (error) {
      log.error('Error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Format a support ticket as a dispute object
   */
  formatTicketAsDispute(ticket) {
    const statusMap = {
      'open': 'pending',
      'in_progress': 'under_review',
      'waiting_user': 'under_review',
      'resolved': 'resolved',
      'closed': 'resolved',
    };

    const priorityMap = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'critical',
    };

    return {
      id: ticket.id,
      dispute_id: `DISP-${ticket.id.substring(0, 8).toUpperCase()}`,
      transaction_id: null, // Would need to be linked
      type: 'quality_dispute', // Default type from support ticket
      reason_code: 'QD001',
      reason: ticket.subject,
      amount: 0, // Would need to be linked to transaction
      currency: 'USD',
      status: statusMap[ticket.status] || 'pending',
      priority: priorityMap[ticket.priority] || 'medium',
      created_at: ticket.created_at,
      due_date: this.calculateDueDate(ticket.created_at),
      disputer: {
        id: ticket.user_id,
        name: ticket.profile?.full_name || 'Unknown User',
        email: ticket.profile?.email || '',
        type: ticket.profile?.user_type || 'sponsor',
        phone: '',
      },
      disputed_party: {
        id: null,
        name: 'Platform',
        email: 'support@ethiopianmaids.com',
        type: 'platform',
      },
      payment_method: 'unknown',
      card_last_four: null,
      issuing_bank: 'N/A',
      gateway: 'N/A',
      description: ticket.description,
      evidence_required: ['documentation'],
      evidence_submitted: [],
      admin_notes: '',
      timeline: [
        {
          timestamp: ticket.created_at,
          event: 'dispute_created',
          actor: ticket.profile?.full_name || 'User',
          description: 'Dispute ticket created',
        },
      ],
    };
  }

  /**
   * Calculate due date (7 days from creation)
   */
  calculateDueDate(createdAt) {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 7);
    return date.toISOString();
  }

  /**
   * Update dispute status in local database
   */
  async updateDisputeStatus(disputeId, status, notes = '') {
    try {
      log.info(`Updating dispute ${disputeId} to status ${status}`);

      const statusMap = {
        'under_review': 'in_progress',
        'escalated': 'in_progress',
        'resolved': 'resolved',
        'rejected': 'closed',
      };

      const { data } = await apolloClient.mutate({
        mutation: gql`
          mutation UpdateSupportTicket($id: uuid!, $status: String!, $admin_notes: String) {
            update_support_tickets_by_pk(
              pk_columns: { id: $id }
              _set: { status: $status, admin_notes: $admin_notes }
            ) {
              id
              status
            }
          }
        `,
        variables: {
          id: disputeId,
          status: statusMap[status] || status,
          admin_notes: notes,
        },
      });

      return data?.update_support_tickets_by_pk;
    } catch (error) {
      log.error('Error updating dispute status:', error);
      throw error;
    }
  }

  /**
   * Get dispute summary statistics
   */
  async getDisputeSummary() {
    try {
      const { data } = await apolloClient.query({
        query: gql`
          query GetDisputeSummary {
            total: support_tickets_aggregate(where: { category: { _eq: "dispute" } }) {
              aggregate { count }
            }
            pending: support_tickets_aggregate(
              where: { category: { _eq: "dispute" }, status: { _in: ["open", "in_progress"] } }
            ) {
              aggregate { count }
            }
            resolved: support_tickets_aggregate(
              where: { category: { _eq: "dispute" }, status: { _eq: "resolved" } }
            ) {
              aggregate { count }
            }
            critical: support_tickets_aggregate(
              where: { category: { _eq: "dispute" }, priority: { _eq: "urgent" } }
            ) {
              aggregate { count }
            }
          }
        `,
        fetchPolicy: 'network-only',
      });

      return {
        total: data?.total?.aggregate?.count || 0,
        pending: data?.pending?.aggregate?.count || 0,
        resolved: data?.resolved?.aggregate?.count || 0,
        critical: data?.critical?.aggregate?.count || 0,
        totalAmount: 0, // Would need transaction integration
        pendingAmount: 0,
        resolvedAmount: 0,
      };
    } catch (error) {
      log.error('Error fetching dispute summary:', error);
      return {
        total: 0,
        pending: 0,
        resolved: 0,
        critical: 0,
        totalAmount: 0,
        pendingAmount: 0,
        resolvedAmount: 0,
      };
    }
  }

  /**
   * Export disputes to CSV format
   */
  exportToCSV(disputes) {
    const headers = [
      'Dispute ID',
      'Status',
      'Priority',
      'Type',
      'Disputer',
      'Email',
      'Amount',
      'Currency',
      'Created At',
      'Due Date',
      'Description',
    ];

    const rows = disputes.map(d => [
      d.dispute_id,
      d.status,
      d.priority,
      d.type,
      d.disputer?.name || '',
      d.disputer?.email || '',
      d.amount,
      d.currency,
      new Date(d.created_at).toLocaleDateString(),
      new Date(d.due_date).toLocaleDateString(),
      `"${(d.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `disputes_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
}

export const adminDisputesService = new AdminDisputesService();
export default adminDisputesService;
