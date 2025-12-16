/**
 * Subscription Hooks Tests
 * Unit tests for real-time subscription hooks
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the generated subscription hooks from api-client
const mockUseOnNotificationsUpdatedSubscription = vi.fn();
const mockUseOnUnreadNotificationCountSubscription = vi.fn();
const mockUseOnNewMessagesSubscription = vi.fn();
const mockUseOnConversationMessagesSubscription = vi.fn();
const mockUseOnNewApplicationsSubscription = vi.fn();
const mockUseOnApplicationStatusChangeSubscription = vi.fn();
const mockUseOnBookingUpdatesSubscription = vi.fn();
const mockUseOnBookingRequestsSubscription = vi.fn();

vi.mock('@ethio/api-client', () => ({
  useOnNotificationsUpdatedSubscription: (...args) => mockUseOnNotificationsUpdatedSubscription(...args),
  useOnUnreadNotificationCountSubscription: (...args) => mockUseOnUnreadNotificationCountSubscription(...args),
  useOnNewMessagesSubscription: (...args) => mockUseOnNewMessagesSubscription(...args),
  useOnConversationMessagesSubscription: (...args) => mockUseOnConversationMessagesSubscription(...args),
  useOnNewApplicationsSubscription: (...args) => mockUseOnNewApplicationsSubscription(...args),
  useOnApplicationStatusChangeSubscription: (...args) => mockUseOnApplicationStatusChangeSubscription(...args),
  useOnBookingUpdatesSubscription: (...args) => mockUseOnBookingUpdatesSubscription(...args),
  useOnBookingRequestsSubscription: (...args) => mockUseOnBookingRequestsSubscription(...args),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', userType: 'sponsor' },
  })),
}));

vi.mock('@/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Import hooks after mocking
import {
  useNotificationSubscription,
  useUnreadNotificationCount,
  useMessageSubscription,
  useConversationSubscription,
  useJobApplicationSubscription,
  useApplicationStatusSubscription,
  useBookingSubscription,
  useBookingRequestSubscription,
} from '../useSubscriptions';

describe('Subscription Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock return values
    mockUseOnNotificationsUpdatedSubscription.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });
    mockUseOnUnreadNotificationCountSubscription.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });
    mockUseOnNewMessagesSubscription.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });
    mockUseOnConversationMessagesSubscription.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });
    mockUseOnNewApplicationsSubscription.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });
    mockUseOnApplicationStatusChangeSubscription.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });
    mockUseOnBookingUpdatesSubscription.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });
    mockUseOnBookingRequestsSubscription.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });
  });

  describe('useNotificationSubscription', () => {
    it('should return empty notifications when loading', () => {
      mockUseOnNotificationsUpdatedSubscription.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      const { result } = renderHook(() => useNotificationSubscription());

      expect(result.current.notifications).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should return notifications when data is available', () => {
      const mockNotifications = [
        { id: '1', title: 'Test', message: 'Test message', read: false },
        { id: '2', title: 'Test 2', message: 'Test message 2', read: true },
      ];

      mockUseOnNotificationsUpdatedSubscription.mockReturnValue({
        data: { notifications: mockNotifications },
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useNotificationSubscription());

      expect(result.current.notifications).toEqual(mockNotifications);
      expect(result.current.loading).toBe(false);
    });

    it('should pass userId to subscription variables', () => {
      mockUseOnNotificationsUpdatedSubscription.mockReturnValue({
        data: { notifications: [] },
        loading: false,
        error: null,
      });

      renderHook(() => useNotificationSubscription());

      // Check that subscription was called with correct variables
      expect(mockUseOnNotificationsUpdatedSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ userId: 'test-user-id' }),
        })
      );
    });

    it('should call onNewNotification callback when new notification arrives', async () => {
      const onNewNotification = vi.fn();
      const mockNotification = { id: '1', title: 'New', message: 'New message' };

      mockUseOnNotificationsUpdatedSubscription.mockImplementation((options) => {
        // Simulate onData callback
        if (options?.onData) {
          setTimeout(() => {
            options.onData({
              data: { data: { notifications: [mockNotification] } },
            });
          }, 0);
        }
        return {
          data: { notifications: [mockNotification] },
          loading: false,
          error: null,
        };
      });

      const { result } = renderHook(() =>
        useNotificationSubscription({ onNewNotification })
      );

      // Wait for callback
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.notifications).toHaveLength(1);
    });
  });

  describe('useUnreadNotificationCount', () => {
    it('should return 0 when no data', () => {
      mockUseOnUnreadNotificationCountSubscription.mockReturnValue({
        data: null,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useUnreadNotificationCount());

      expect(result.current.count).toBe(0);
    });

    it('should return correct count from aggregate', () => {
      mockUseOnUnreadNotificationCountSubscription.mockReturnValue({
        data: {
          notifications_aggregate: {
            aggregate: { count: 5 },
          },
        },
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useUnreadNotificationCount());

      expect(result.current.count).toBe(5);
    });
  });

  describe('useMessageSubscription', () => {
    it('should return empty messages when no data', () => {
      mockUseOnNewMessagesSubscription.mockReturnValue({
        data: null,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useMessageSubscription());

      expect(result.current.messages).toEqual([]);
      expect(result.current.lastMessage).toBe(null);
    });

    it('should return messages when data is available', () => {
      const mockMessages = [
        { id: '1', content: 'Hello', sender_id: 'user1' },
        { id: '2', content: 'Hi', sender_id: 'user2' },
      ];

      mockUseOnNewMessagesSubscription.mockReturnValue({
        data: { messages: mockMessages },
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useMessageSubscription());

      expect(result.current.messages).toEqual(mockMessages);
    });
  });

  describe('useConversationSubscription', () => {
    it('should skip when no otherUserId provided', () => {
      renderHook(() => useConversationSubscription(null));

      expect(mockUseOnConversationMessagesSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ skip: true })
      );
    });

    it('should subscribe when otherUserId is provided', () => {
      const otherUserId = 'other-user-123';

      renderHook(() => useConversationSubscription(otherUserId));

      expect(mockUseOnConversationMessagesSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ otherUserId }),
          skip: false,
        })
      );
    });
  });

  describe('useJobApplicationSubscription', () => {
    it('should return applications for sponsor', () => {
      const mockApplications = [
        { id: '1', status: 'pending', job: { title: 'Job 1' } },
      ];

      mockUseOnNewApplicationsSubscription.mockReturnValue({
        data: { applications: mockApplications },
        loading: false,
        error: null,
      });

      const { result } = renderHook(() =>
        useJobApplicationSubscription('sponsor-id')
      );

      expect(result.current.applications).toEqual(mockApplications);
    });

    it('should skip when no sponsorId', () => {
      renderHook(() => useJobApplicationSubscription(null));

      expect(mockUseOnNewApplicationsSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ skip: true })
      );
    });
  });

  describe('useApplicationStatusSubscription', () => {
    it('should return application status changes for maid', () => {
      const mockApplications = [
        { id: '1', status: 'accepted', job: { title: 'Job 1' } },
      ];

      mockUseOnApplicationStatusChangeSubscription.mockReturnValue({
        data: { applications: mockApplications },
        loading: false,
        error: null,
      });

      const { result } = renderHook(() =>
        useApplicationStatusSubscription('maid-id')
      );

      expect(result.current.applications).toEqual(mockApplications);
    });
  });

  describe('useBookingSubscription', () => {
    it('should return bookings for sponsor', () => {
      const mockBookings = [
        { id: '1', status: 'confirmed', maid_profile: { full_name: 'Test Maid' } },
      ];

      mockUseOnBookingUpdatesSubscription.mockReturnValue({
        data: { bookings: mockBookings },
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useBookingSubscription('sponsor-id'));

      expect(result.current.bookings).toEqual(mockBookings);
    });
  });

  describe('useBookingRequestSubscription', () => {
    it('should return booking requests for maid', () => {
      const mockBookings = [
        { id: '1', status: 'pending', profile: { email: 'test@example.com' } },
      ];

      mockUseOnBookingRequestsSubscription.mockReturnValue({
        data: { bookings: mockBookings },
        loading: false,
        error: null,
      });

      const { result } = renderHook(() =>
        useBookingRequestSubscription('maid-id')
      );

      expect(result.current.bookings).toEqual(mockBookings);
    });
  });
});

describe('Subscription Hook Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle subscription errors gracefully', () => {
    const mockError = new Error('Subscription failed');

    mockUseOnNotificationsUpdatedSubscription.mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useNotificationSubscription());

    expect(result.current.error).toBe(mockError);
    expect(result.current.notifications).toEqual([]);
  });

  it('should handle network disconnection', () => {
    mockUseOnNewMessagesSubscription.mockReturnValue({
      data: null,
      loading: true,
      error: new Error('WebSocket disconnected'),
    });

    const { result } = renderHook(() => useMessageSubscription());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeDefined();
  });
});
