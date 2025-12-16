/**
 * Booking Service - GraphQL Implementation
 * Uses inline gql documents to bypass codegen requirement
 *
 * This service handles all booking_requests operations via GraphQL/Hasura
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('BookingService.GraphQL');

// =====================================================
// INLINE GRAPHQL DOCUMENTS
// Using inline documents until codegen runs successfully
// =====================================================

const GetBookingRequestCompleteDocument = gql`
  query GetBookingRequestComplete($id: uuid!) {
    booking_requests_by_pk(id: $id) {
      id
      maid_id
      sponsor_id
      agency_id
      status
      requested_start_date
      requested_duration_months
      offered_salary
      currency
      message
      rejection_reason
      start_date
      end_date
      special_requirements
      amount
      payment_status
      payment_method
      payment_date
      payment_reference
      created_at
      updated_at
      responded_at
    }
  }
`;

const GetBookingRequestDocument = gql`
  query GetBookingRequest($id: uuid!) {
    booking_requests_by_pk(id: $id) {
      id
      maid_id
      sponsor_id
      status
      start_date
      end_date
      message
      special_requirements
      amount
      currency
      payment_status
      created_at
      updated_at
    }
  }
`;

const ListBookingRequestsDocument = gql`
  query ListBookingRequests(
    $limit: Int = 20
    $offset: Int = 0
    $where: booking_requests_bool_exp
    $orderBy: [booking_requests_order_by!] = [{created_at: desc}]
  ) {
    booking_requests(
      limit: $limit
      offset: $offset
      where: $where
      order_by: $orderBy
    ) {
      id
      maid_id
      sponsor_id
      status
      start_date
      end_date
      message
      amount
      currency
      payment_status
      created_at
      updated_at
    }
    booking_requests_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

const GetSponsorBookingsDocument = gql`
  query GetSponsorBookings(
    $sponsorId: String!
    $limit: Int = 20
    $offset: Int = 0
  ) {
    booking_requests(
      where: {sponsor_id: {_eq: $sponsorId}}
      limit: $limit
      offset: $offset
      order_by: [{created_at: desc}]
    ) {
      id
      maid_id
      sponsor_id
      status
      start_date
      end_date
      message
      amount
      currency
      payment_status
      created_at
      updated_at
    }
    booking_requests_aggregate(where: {sponsor_id: {_eq: $sponsorId}}) {
      aggregate {
        count
      }
    }
  }
`;

const CreateBookingRequestDocument = gql`
  mutation CreateBookingRequest($data: booking_requests_insert_input!) {
    insert_booking_requests_one(object: $data) {
      id
      maid_id
      sponsor_id
      status
      start_date
      end_date
      message
      special_requirements
      amount
      currency
      payment_status
      created_at
    }
  }
`;

const UpdateBookingRequestDocument = gql`
  mutation UpdateBookingRequest($id: uuid!, $data: booking_requests_set_input!) {
    update_booking_requests_by_pk(
      pk_columns: {id: $id}
      _set: $data
    ) {
      id
      maid_id
      sponsor_id
      status
      start_date
      end_date
      message
      special_requirements
      amount
      currency
      payment_status
      updated_at
    }
  }
`;

const UpdateBookingStatusDocument = gql`
  mutation UpdateBookingStatus($id: uuid!, $status: String!) {
    update_booking_requests_by_pk(
      pk_columns: {id: $id}
      _set: {status: $status}
    ) {
      id
      status
      updated_at
    }
  }
`;

const AcceptBookingRequestDocument = gql`
  mutation AcceptBookingRequest($id: uuid!) {
    update_booking_requests_by_pk(
      pk_columns: {id: $id}
      _set: {status: "accepted", responded_at: "now()"}
    ) {
      id
      status
      responded_at
      updated_at
    }
  }
`;

const RejectBookingRequestDocument = gql`
  mutation RejectBookingRequest($id: uuid!, $rejectionReason: String) {
    update_booking_requests_by_pk(
      pk_columns: {id: $id}
      _set: {
        status: "rejected"
        rejection_reason: $rejectionReason
        responded_at: "now()"
      }
    ) {
      id
      status
      rejection_reason
      responded_at
      updated_at
    }
  }
`;

const CancelBookingRequestDocument = gql`
  mutation CancelBookingRequest($id: uuid!) {
    update_booking_requests_by_pk(
      pk_columns: {id: $id}
      _set: {status: "cancelled"}
    ) {
      id
      status
      updated_at
    }
  }
`;

const DeleteBookingRequestDocument = gql`
  mutation DeleteBookingRequest($id: uuid!) {
    delete_booking_requests_by_pk(id: $id) {
      id
      status
    }
  }
`;

// =====================================================
// SERVICE IMPLEMENTATION
// =====================================================

export const graphqlBookingService = {
  /**
   * Create a booking request
   */
  async createBookingRequest(sponsorId, bookingData) {
    try {
      log.info('➕ [GraphQL] Creating booking request for sponsor:', sponsorId);

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateBookingRequestDocument,
        variables: {
          data: {
            sponsor_id: sponsorId,
            maid_id: bookingData.maid_id || bookingData.maidId,
            start_date: bookingData.start_date || bookingData.startDate,
            end_date: bookingData.end_date || bookingData.endDate,
            message: bookingData.message || '',
            special_requirements: bookingData.special_requirements || bookingData.specialRequirements || null,
            amount: parseFloat(bookingData.amount) || 0,
            currency: bookingData.currency || 'USD',
            payment_status: bookingData.payment_status || bookingData.paymentStatus || 'pending',
            status: 'pending',
          },
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const booking = data?.insert_booking_requests_one;
      log.info('✅ [GraphQL] Booking request created successfully:', booking?.id);
      return { data: booking, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error creating booking request:', error);
      return { data: null, error };
    }
  },

  /**
   * Get a booking by ID
   */
  async getBookingById(bookingId) {
    try {
      log.info('🔍 [GraphQL] Fetching booking:', bookingId);

      const { data, errors } = await apolloClient.query({
        query: GetBookingRequestDocument,
        variables: { id: bookingId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const booking = data?.booking_requests_by_pk;

      if (!booking) {
        return {
          data: null,
          error: { code: 'BOOKING_NOT_FOUND', message: 'Booking request not found' },
        };
      }

      log.info('✅ [GraphQL] Booking fetched successfully');
      return { data: booking, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching booking:', error);
      return { data: null, error };
    }
  },

  /**
   * Get all bookings for a sponsor
   */
  async getSponsorBookings(sponsorId, options = {}) {
    try {
      log.info('📋 [GraphQL] Fetching bookings for sponsor:', sponsorId);

      const { data, errors } = await apolloClient.query({
        query: GetSponsorBookingsDocument,
        variables: {
          sponsorId,
          limit: options.limit || 20,
          offset: options.offset || 0,
        },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const bookings = data?.booking_requests || [];
      const totalCount = data?.booking_requests_aggregate?.aggregate?.count || 0;

      log.info(`✅ [GraphQL] Fetched ${bookings.length} bookings (total: ${totalCount})`);
      return { data: bookings, count: totalCount, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching sponsor bookings:', error);
      return { data: [], count: 0, error };
    }
  },

  /**
   * Update a booking request
   */
  async updateBookingRequest(bookingId, updates) {
    try {
      log.info('✏️ [GraphQL] Updating booking:', bookingId);

      // Map field names to match database schema
      const updateData = {};
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.start_date || updates.startDate) updateData.start_date = updates.start_date || updates.startDate;
      if (updates.end_date || updates.endDate) updateData.end_date = updates.end_date || updates.endDate;
      if (updates.message !== undefined) updateData.message = updates.message;
      if (updates.special_requirements || updates.specialRequirements) {
        updateData.special_requirements = updates.special_requirements || updates.specialRequirements;
      }
      if (updates.amount !== undefined) updateData.amount = parseFloat(updates.amount);
      if (updates.currency !== undefined) updateData.currency = updates.currency;
      if (updates.payment_status || updates.paymentStatus) {
        updateData.payment_status = updates.payment_status || updates.paymentStatus;
      }

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateBookingRequestDocument,
        variables: {
          id: bookingId,
          data: updateData,
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const booking = data?.update_booking_requests_by_pk;
      log.info('✅ [GraphQL] Booking updated successfully');
      return { data: booking, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error updating booking:', error);
      return { data: null, error };
    }
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId, status) {
    try {
      log.info(`📝 [GraphQL] Updating booking status to: ${status}`);

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateBookingStatusDocument,
        variables: {
          id: bookingId,
          status,
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const booking = data?.update_booking_requests_by_pk;
      log.info('✅ [GraphQL] Booking status updated successfully');
      return { data: booking, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error updating booking status:', error);
      return { data: null, error };
    }
  },

  /**
   * Accept a booking request
   */
  async acceptBookingRequest(bookingId) {
    try {
      log.info('✅ [GraphQL] Accepting booking request:', bookingId);

      const { data, errors } = await apolloClient.mutate({
        mutation: AcceptBookingRequestDocument,
        variables: { id: bookingId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const booking = data?.update_booking_requests_by_pk;
      log.info('✅ [GraphQL] Booking accepted successfully');
      return { data: booking, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error accepting booking:', error);
      return { data: null, error };
    }
  },

  /**
   * Reject a booking request
   */
  async rejectBookingRequest(bookingId, rejectionReason = null) {
    try {
      log.info('❌ [GraphQL] Rejecting booking request:', bookingId);

      const { data, errors } = await apolloClient.mutate({
        mutation: RejectBookingRequestDocument,
        variables: {
          id: bookingId,
          rejectionReason,
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const booking = data?.update_booking_requests_by_pk;
      log.info('✅ [GraphQL] Booking rejected successfully');
      return { data: booking, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error rejecting booking:', error);
      return { data: null, error };
    }
  },

  /**
   * Cancel a booking request
   */
  async cancelBookingRequest(bookingId) {
    try {
      log.info('🚫 [GraphQL] Cancelling booking request:', bookingId);

      const { data, errors } = await apolloClient.mutate({
        mutation: CancelBookingRequestDocument,
        variables: { id: bookingId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const booking = data?.update_booking_requests_by_pk;
      log.info('✅ [GraphQL] Booking cancelled successfully');
      return { data: booking, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error cancelling booking:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a booking request
   */
  async deleteBookingRequest(bookingId) {
    try {
      log.info('🗑️ [GraphQL] Deleting booking request:', bookingId);

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteBookingRequestDocument,
        variables: { id: bookingId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const booking = data?.delete_booking_requests_by_pk;
      log.info('✅ [GraphQL] Booking deleted successfully');
      return { data: booking, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error deleting booking:', error);
      return { data: null, error };
    }
  },
};

export default graphqlBookingService;
