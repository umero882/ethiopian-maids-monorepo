/**
 * WhatsApp Service
 * Handles WhatsApp message and booking operations
 * Follows Ethiopian Maids service pattern
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('WhatsAppService');

// GraphQL Queries and Mutations
const GET_WHATSAPP_MESSAGES = gql`
  query GetWhatsappMessages($phone_number: String, $sender: String, $limit: Int!, $offset: Int!) {
    whatsapp_messages(
      where: {
        _and: [
          { phone_number: { _eq: $phone_number } }
          { sender: { _eq: $sender } }
        ]
      }
      order_by: { received_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      phone_number
      message_content
      received_at
      sender
    }
    whatsapp_messages_aggregate(
      where: {
        _and: [
          { phone_number: { _eq: $phone_number } }
          { sender: { _eq: $sender } }
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GET_CONVERSATION = gql`
  query GetConversation($phone_number: String!, $limit: Int!) {
    whatsapp_messages(
      where: { phone_number: { _eq: $phone_number } }
      order_by: { received_at: asc }
      limit: $limit
    ) {
      id
      phone_number
      message_content
      received_at
      sender
    }
  }
`;

const GET_ALL_MESSAGES_FOR_CONTACTS = gql`
  query GetAllMessagesForContacts {
    whatsapp_messages(order_by: { received_at: desc }) {
      phone_number
      message_content
      received_at
      sender
    }
  }
`;

const GET_MAID_BOOKINGS = gql`
  query GetMaidBookings(
    $phone_number: String
    $status: String
    $booking_type: String
    $start_date: timestamptz
    $end_date: timestamptz
    $limit: Int!
    $offset: Int!
  ) {
    maid_bookings(
      where: {
        _and: [
          { phone_number: { _eq: $phone_number } }
          { status: { _eq: $status } }
          { booking_type: { _eq: $booking_type } }
          { booking_date: { _gte: $start_date } }
          { booking_date: { _lte: $end_date } }
        ]
      }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      phone_number
      sponsor_name
      sponsor_id
      maid_id
      maid_name
      booking_type
      booking_date
      status
      notes
      metadata
      created_at
      updated_at
    }
    maid_bookings_aggregate(
      where: {
        _and: [
          { phone_number: { _eq: $phone_number } }
          { status: { _eq: $status } }
          { booking_type: { _eq: $booking_type } }
          { booking_date: { _gte: $start_date } }
          { booking_date: { _lte: $end_date } }
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Booking statistics query using aggregations
const GET_BOOKING_STATS = gql`
  query GetBookingStats {
    total: maid_bookings_aggregate {
      aggregate {
        count
      }
    }
    pending: maid_bookings_aggregate(where: { status: { _eq: "pending" } }) {
      aggregate {
        count
      }
    }
    confirmed: maid_bookings_aggregate(where: { status: { _eq: "confirmed" } }) {
      aggregate {
        count
      }
    }
    cancelled: maid_bookings_aggregate(where: { status: { _eq: "cancelled" } }) {
      aggregate {
        count
      }
    }
    completed: maid_bookings_aggregate(where: { status: { _eq: "completed" } }) {
      aggregate {
        count
      }
    }
  }
`;

const UPDATE_BOOKING_STATUS = gql`
  mutation UpdateBookingStatus($id: uuid!, $status: String!, $notes: String, $updated_at: timestamptz!) {
    update_maid_bookings_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, notes: $notes, updated_at: $updated_at }
    ) {
      id
      status
      notes
      maid_name
      sponsor_name
      updated_at
    }
  }
`;

const UPDATE_BOOKING = gql`
  mutation UpdateBooking($id: uuid!, $updates: maid_bookings_set_input!) {
    update_maid_bookings_by_pk(pk_columns: { id: $id }, _set: $updates) {
      id
      status
      maid_name
      sponsor_name
      booking_date
      booking_type
      notes
      updated_at
    }
  }
`;

const DELETE_BOOKING = gql`
  mutation DeleteBooking($id: uuid!) {
    delete_maid_bookings_by_pk(id: $id) {
      id
    }
  }
`;

const GET_PLATFORM_SETTINGS = gql`
  query GetPlatformSettings {
    platform_settings(limit: 1) {
      id
      whatsapp_enabled
      ai_enabled
      maintenance_mode
      created_at
      updated_at
    }
  }
`;

const UPDATE_PLATFORM_SETTINGS = gql`
  mutation UpdatePlatformSettings($id: uuid!, $settings: platform_settings_set_input!) {
    update_platform_settings_by_pk(pk_columns: { id: $id }, _set: $settings) {
      id
      whatsapp_enabled
      ai_enabled
      maintenance_mode
      updated_at
    }
  }
`;

const SEARCH_MESSAGES = gql`
  query SearchMessages($search_term: String!, $limit: Int!) {
    whatsapp_messages(
      where: { message_content: { _ilike: $search_term } }
      order_by: { received_at: desc }
      limit: $limit
    ) {
      id
      phone_number
      message_content
      received_at
      sender
    }
  }
`;

/**
 * Fetch WhatsApp messages with pagination and filtering
 * @param {Object} options - Query options
 * @param {string} options.phoneNumber - Filter by phone number
 * @param {number} options.limit - Number of messages to fetch
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.sender - Filter by sender (user/assistant)
 * @returns {Promise<Object>} Messages data with pagination info
 */
export const fetchMessages = async ({
  phoneNumber = null,
  limit = 50,
  offset = 0,
  sender = null,
} = {}) => {
  try {
    const { data } = await apolloClient.query({
      query: GET_WHATSAPP_MESSAGES,
      variables: {
        phone_number: phoneNumber,
        sender: sender,
        limit,
        offset
      },
      fetchPolicy: 'network-only'
    });

    return {
      messages: data?.whatsapp_messages || [],
      total: data?.whatsapp_messages_aggregate?.aggregate?.count || 0,
      limit,
      offset,
    };
  } catch (error) {
    log.error('fetchMessages error:', error);
    throw error;
  }
};

/**
 * Fetch conversation history for a specific phone number
 * @param {string} phoneNumber - Phone number to fetch conversation for
 * @param {number} limit - Maximum number of messages
 * @returns {Promise<Array>} Array of messages
 */
export const fetchConversation = async (phoneNumber, limit = 100) => {
  try {
    const { data } = await apolloClient.query({
      query: GET_CONVERSATION,
      variables: { phone_number: phoneNumber, limit },
      fetchPolicy: 'network-only'
    });

    return data?.whatsapp_messages || [];
  } catch (error) {
    log.error('fetchConversation error:', error);
    throw error;
  }
};

/**
 * Get unique phone numbers (contacts)
 * @param {number} limit - Maximum number of contacts
 * @returns {Promise<Array>} Array of phone numbers with metadata
 */
export const fetchContacts = async (limit = 100) => {
  try {
    const { data } = await apolloClient.query({
      query: GET_ALL_MESSAGES_FOR_CONTACTS,
      fetchPolicy: 'network-only'
    });

    const messages = data?.whatsapp_messages || [];

    // Group by phone number and get latest message for each
    const contactMap = new Map();

    messages.forEach(msg => {
      if (!contactMap.has(msg.phone_number)) {
        contactMap.set(msg.phone_number, {
          phone_number: msg.phone_number,
          last_message: msg.message_content,
          last_message_at: msg.received_at,
          last_sender: msg.sender,
        });
      }
    });

    return Array.from(contactMap.values()).slice(0, limit);
  } catch (error) {
    log.error('fetchContacts error:', error);
    throw error;
  }
};

/**
 * Fetch bookings with filtering
 * @param {Object} options - Query options
 * @param {string} options.phoneNumber - Filter by phone number
 * @param {string} options.status - Filter by status
 * @param {string} options.bookingType - Filter by booking type
 * @param {Date} options.startDate - Filter by start date
 * @param {Date} options.endDate - Filter by end date
 * @param {number} options.limit - Number of bookings to fetch
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<Object>} Bookings data with pagination info
 */
export const fetchBookings = async ({
  phoneNumber = null,
  status = null,
  bookingType = null,
  startDate = null,
  endDate = null,
  limit = 50,
  offset = 0,
} = {}) => {
  try {
    const { data } = await apolloClient.query({
      query: GET_MAID_BOOKINGS,
      variables: {
        phone_number: phoneNumber,
        status: status,
        booking_type: bookingType,
        start_date: startDate?.toISOString() || null,
        end_date: endDate?.toISOString() || null,
        limit,
        offset
      },
      fetchPolicy: 'network-only'
    });

    return {
      bookings: data?.maid_bookings || [],
      total: data?.maid_bookings_aggregate?.aggregate?.count || 0,
      limit,
      offset,
    };
  } catch (error) {
    log.error('fetchBookings error:', error);
    throw error;
  }
};

/**
 * Get booking statistics
 * @returns {Promise<Object>} Booking statistics
 */
export const getBookingStats = async () => {
  try {
    const { data } = await apolloClient.query({
      query: GET_BOOKING_STATS,
      fetchPolicy: 'network-only'
    });

    return {
      total_bookings: data?.total?.aggregate?.count || 0,
      pending_bookings: data?.pending?.aggregate?.count || 0,
      confirmed_bookings: data?.confirmed?.aggregate?.count || 0,
      cancelled_bookings: data?.cancelled?.aggregate?.count || 0,
      completed_bookings: data?.completed?.aggregate?.count || 0,
    };
  } catch (error) {
    log.error('getBookingStats error:', error);
    return {
      total_bookings: 0,
      pending_bookings: 0,
      confirmed_bookings: 0,
      cancelled_bookings: 0,
      completed_bookings: 0,
    };
  }
};

/**
 * Update booking status
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} Updated booking
 */
export const updateBookingStatus = async (bookingId, status, notes = null) => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: UPDATE_BOOKING_STATUS,
      variables: {
        id: bookingId,
        status,
        notes,
        updated_at: new Date().toISOString()
      }
    });

    log.info(`Booking ${bookingId} status updated to ${status}`);
    return data?.update_maid_bookings_by_pk;
  } catch (error) {
    log.error('updateBookingStatus error:', error);
    throw error;
  }
};

/**
 * Update booking with any fields
 * @param {string} bookingId - Booking ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated booking
 */
export const updateBooking = async (bookingId, updates) => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: UPDATE_BOOKING,
      variables: {
        id: bookingId,
        updates
      }
    });

    log.info(`Booking ${bookingId} updated`);
    return { data: data?.update_maid_bookings_by_pk, error: null };
  } catch (error) {
    log.error('updateBooking error:', error);
    return { data: null, error };
  }
};

/**
 * Delete booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Result
 */
export const deleteBooking = async (bookingId) => {
  try {
    await apolloClient.mutate({
      mutation: DELETE_BOOKING,
      variables: { id: bookingId }
    });

    log.info(`Booking ${bookingId} deleted`);
    return { error: null };
  } catch (error) {
    log.error('deleteBooking error:', error);
    return { error };
  }
};

/**
 * Fetch platform settings
 * @returns {Promise<Object>} Platform settings
 */
export const getPlatformSettings = async () => {
  try {
    const { data } = await apolloClient.query({
      query: GET_PLATFORM_SETTINGS,
      fetchPolicy: 'network-only'
    });

    return data?.platform_settings?.[0] || {};
  } catch (error) {
    log.error('getPlatformSettings error:', error);
    throw error;
  }
};

/**
 * Update platform settings
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Updated settings
 */
export const updatePlatformSettings = async (settings) => {
  try {
    // First get existing settings to get the ID
    const existingSettings = await getPlatformSettings();

    if (!existingSettings?.id) {
      throw new Error('Platform settings not found');
    }

    const { data } = await apolloClient.mutate({
      mutation: UPDATE_PLATFORM_SETTINGS,
      variables: {
        id: existingSettings.id,
        settings: {
          ...settings,
          updated_at: new Date().toISOString(),
        }
      }
    });

    log.info('Platform settings updated successfully');
    return data?.update_platform_settings_by_pk;
  } catch (error) {
    log.error('updatePlatformSettings error:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time message updates
 * Note: Real-time subscriptions would require WebSocket setup with Hasura
 * For now, this returns a mock subscription object
 * @param {Function} callback - Callback function for new messages
 * @returns {Object} Subscription object
 */
export const subscribeToMessages = (callback) => {
  log.warn('Real-time subscriptions require WebSocket setup with Hasura');
  // Return a mock subscription object
  return {
    unsubscribe: () => {
      log.info('Unsubscribed from messages');
    }
  };
};

/**
 * Subscribe to real-time booking updates
 * Note: Real-time subscriptions would require WebSocket setup with Hasura
 * @param {Function} callback - Callback function for booking changes
 * @returns {Object} Subscription object
 */
export const subscribeToBookings = (callback) => {
  log.warn('Real-time subscriptions require WebSocket setup with Hasura');
  // Return a mock subscription object
  return {
    unsubscribe: () => {
      log.info('Unsubscribed from bookings');
    }
  };
};

/**
 * Unsubscribe from real-time channel
 * @param {Object} subscription - Subscription to unsubscribe
 */
export const unsubscribe = async (subscription) => {
  try {
    if (subscription && subscription.unsubscribe) {
      subscription.unsubscribe();
      log.info('Unsubscribed from channel');
    }
  } catch (error) {
    log.error('unsubscribe error:', error);
  }
};

/**
 * Search messages by content
 * @param {string} searchTerm - Search term
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Matching messages
 */
export const searchMessages = async (searchTerm, limit = 50) => {
  try {
    const { data } = await apolloClient.query({
      query: SEARCH_MESSAGES,
      variables: {
        search_term: `%${searchTerm}%`,
        limit
      },
      fetchPolicy: 'network-only'
    });

    return data?.whatsapp_messages || [];
  } catch (error) {
    log.error('searchMessages error:', error);
    throw error;
  }
};

/**
 * Export bookings to CSV format
 * @param {Object} filters - Filter options (same as fetchBookings)
 * @returns {Promise<string>} CSV string
 */
export const exportBookingsToCSV = async (filters = {}) => {
  try {
    const { bookings } = await fetchBookings({ ...filters, limit: 1000 });

    const headers = [
      'ID',
      'Phone Number',
      'Sponsor Name',
      'Maid Name',
      'Booking Type',
      'Booking Date',
      'Status',
      'Notes',
      'Created At',
    ];

    const rows = bookings.map(booking => [
      booking.id,
      booking.phone_number,
      booking.sponsor_name || 'N/A',
      booking.maid_name || booking.maid_profiles?.full_name || 'N/A',
      booking.booking_type,
      booking.booking_date || 'Not scheduled',
      booking.status,
      booking.notes || '',
      booking.created_at,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  } catch (error) {
    log.error('exportBookingsToCSV error:', error);
    throw error;
  }
};

export default {
  fetchMessages,
  fetchConversation,
  fetchContacts,
  fetchBookings,
  getBookingStats,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
  getPlatformSettings,
  updatePlatformSettings,
  subscribeToMessages,
  subscribeToBookings,
  unsubscribe,
  searchMessages,
  exportBookingsToCSV,
};
