/**
 * Notifications Screen
 *
 * Display user notifications with real-time updates via GraphQL subscriptions.
 * Synced with web notification features including:
 * - Real-time updates with connection status
 * - Filter tabs (All, Unread, Messages, Applications, Jobs)
 * - Delete notification functionality
 * - Settings tab for notification preferences
 */

import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { router } from 'expo-router';

// Filter types matching web
type FilterType = 'all' | 'unread' | 'message' | 'application' | 'job' | 'booking';

// Tab types
type TabType = 'notifications' | 'settings';

export default function NotificationsScreen() {
  const { isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('notifications');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    loadMore,
    hasMore,
  } = useNotifications({ limit: 50, enableSubscription: true });

  // Connection status (simulated based on loading/error state)
  const connectionStatus = useMemo(() => {
    if (loading && notifications.length === 0) return 'connecting';
    if (error) return 'offline';
    return 'live';
  }, [loading, error, notifications.length]);

  // Filter notifications based on selected filter
  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => {
      const type = n.type?.toLowerCase() || '';
      return type.startsWith(filter) || type.includes(filter);
    });
  }, [notifications, filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    await markAsRead(notificationId);
  }, [markAsRead]);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteNotification(notificationId);
          },
        },
      ]
    );
  }, [deleteNotification]);

  // Open modal to show notification details
  const handleNotificationPress = useCallback((notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    // Always open modal first to show full details
    setSelectedNotification(notification);
    setModalVisible(true);
  }, [handleMarkAsRead]);

  // Navigate from modal to the appropriate screen
  const handleNavigateFromModal = useCallback(() => {
    if (!selectedNotification) return;

    setModalVisible(false);
    const notification = selectedNotification;

    // Handle profile notifications - go to profile screen
    if (notification.type === 'profile_rejected' || notification.type === 'profile_approved') {
      router.push('/profile' as any);
      return;
    }

    // Handle message notifications - navigate to specific conversation
    if (notification.type === 'message_received') {
      const conversationId = notification.related_id ||
        notification.link?.match(/conversation=([^&]+)/)?.[1];

      if (conversationId) {
        router.push(`/chat/${conversationId}` as any);
        return;
      }
      router.push('/messages' as any);
      return;
    }

    // Handle link-based navigation
    if (notification.link) {
      const link = notification.link;

      // Handle profile links
      if (link.includes('/profile')) {
        router.push('/profile' as any);
        return;
      }

      // Handle message links
      if (link.includes('/messages')) {
        const conversationMatch = link.match(/conversation=([^&]+)/);
        if (conversationMatch) {
          router.push(`/chat/${conversationMatch[1]}` as any);
          return;
        }
        router.push('/messages' as any);
        return;
      }

      // Handle maids links (for agency)
      if (link.includes('/maids/')) {
        const maidIdMatch = link.match(/\/maids\/([^\/\?]+)/);
        if (maidIdMatch) {
          router.push(`/maid/${maidIdMatch[1]}` as any);
          return;
        }
      }

      // Handle booking links
      if (link.includes('/booking')) {
        router.push('/sponsor/bookings' as any);
        return;
      }

      // Handle job links
      if (link.includes('/job')) {
        router.push('/sponsor/jobs' as any);
        return;
      }
    }

    // Handle related_type/related_id based navigation
    if (notification.related_type && notification.related_id) {
      switch (notification.related_type) {
        case 'maid':
        case 'maid_profile':
          router.push(`/maid/${notification.related_id}` as any);
          break;
        case 'job':
          router.push(`/job/${notification.related_id}` as any);
          break;
        case 'message':
        case 'conversation':
          router.push(`/chat/${notification.related_id}` as any);
          break;
        case 'application':
          router.push('/agency/applicants' as any);
          break;
        case 'booking':
          router.push('/sponsor/bookings' as any);
          break;
        default:
          console.log('[Notifications] Unknown related_type:', notification.related_type);
      }
    }
  }, [selectedNotification]);

  // Close the modal
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedNotification(null);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Icon mapping matching web
  const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      booking: 'calendar',
      booking_created: 'calendar',
      booking_accepted: 'calendar-outline',
      booking_rejected: 'calendar-outline',
      application: 'briefcase',
      application_received: 'briefcase',
      application_accepted: 'checkmark-circle',
      application_rejected: 'close-circle',
      application_reviewed: 'eye',
      application_shortlisted: 'star',
      message: 'chatbubble',
      message_received: 'chatbubble',
      profile: 'person',
      profile_approved: 'checkmark-circle',
      profile_rejected: 'close-circle',
      job: 'briefcase',
      job_posted: 'briefcase',
      job_closed: 'briefcase-outline',
      review: 'star',
      payment: 'card',
      payment_received: 'card',
      system: 'notifications',
      system_announcement: 'megaphone',
    };
    // Try exact match first
    if (iconMap[type]) return iconMap[type];
    // Try prefix match
    const prefix = type?.split('_')[0];
    return iconMap[prefix] || 'notifications';
  };

  // Color mapping matching web
  const getNotificationColor = (type: string) => {
    const colorMap: Record<string, string> = {
      booking: '#3B82F6', // blue
      application: '#6366F1', // indigo
      message: '#10B981', // green
      profile: '#8B5CF6', // purple
      job: '#F97316', // orange
      review: '#F59E0B', // yellow
      payment: '#14B8A6', // teal
      system: '#6B7280', // gray
    };
    // Try exact match first
    if (colorMap[type]) return colorMap[type];
    // Try prefix match
    const prefix = type?.split('_')[0];
    return colorMap[prefix] || '#6B7280';
  };

  // Filter buttons data
  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: `All (${notifications.length})` },
    { key: 'unread', label: `Unread (${unreadCount})` },
    { key: 'message', label: 'Messages' },
    { key: 'application', label: 'Applications' },
    { key: 'job', label: 'Jobs' },
  ];

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyText}>Please sign in to view notifications</Text>
      </View>
    );
  }

  // Render notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const iconColor = getNotificationColor(item.type);

    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={24}
            color={iconColor}
          />
        </View>
        <View style={styles.content}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
          <View style={styles.cardFooter}>
            {!item.read && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>New</Text>
              </View>
            )}
            {item.priority === 'urgent' || item.priority === 'high' ? (
              <View style={[styles.priorityBadge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.priorityText, { color: '#DC2626' }]}>
                  {item.priority === 'urgent' ? 'Urgent' : 'High Priority'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.actions}>
          {!item.read && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleMarkAsRead(item.id);
              }}
            >
              <Ionicons name="checkmark" size={18} color="#8B5CF6" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteNotification(item.id);
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
          onPress={() => setActiveTab('notifications')}
        >
          <Ionicons
            name="notifications"
            size={18}
            color={activeTab === 'notifications' ? '#8B5CF6' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name="settings-outline"
            size={18}
            color={activeTab === 'settings' ? '#8B5CF6' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'notifications' ? (
        <>
          {/* Connection status */}
          <View style={[
            styles.connectionStatus,
            connectionStatus === 'live' && styles.connectionLive,
            connectionStatus === 'offline' && styles.connectionOffline,
            connectionStatus === 'connecting' && styles.connectionConnecting,
          ]}>
            <Ionicons
              name={
                connectionStatus === 'live'
                  ? 'wifi'
                  : connectionStatus === 'offline'
                  ? 'wifi-outline'
                  : 'refresh'
              }
              size={12}
              color={
                connectionStatus === 'live'
                  ? '#059669'
                  : connectionStatus === 'offline'
                  ? '#DC2626'
                  : '#D97706'
              }
            />
            <Text style={[
              styles.connectionText,
              connectionStatus === 'live' && { color: '#059669' },
              connectionStatus === 'offline' && { color: '#DC2626' },
              connectionStatus === 'connecting' && { color: '#D97706' },
            ]}>
              {connectionStatus === 'live' ? 'Live' : connectionStatus === 'offline' ? 'Offline' : 'Connecting...'}
            </Text>
          </View>

          {/* Filter buttons */}
          <View style={styles.filterContainer}>
            <FlatList
              data={filterButtons}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.filterButton, filter === item.key && styles.filterButtonActive]}
                  onPress={() => setFilter(item.key)}
                >
                  <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <View style={styles.markAllContainer}>
              <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
                <Ionicons name="checkmark-done" size={16} color="#8B5CF6" />
                <Text style={styles.markAllText}>Mark All Read</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notifications list */}
          {loading && notifications.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>Error loading notifications</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => refresh()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredNotifications}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
              }
              renderItem={renderNotificationItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              onEndReached={hasMore ? loadMore : undefined}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="notifications-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>
                    {filter === 'unread'
                      ? "You're all caught up!"
                      : 'No notifications found'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {filter === 'unread'
                      ? 'No unread notifications.'
                      : "You'll see updates about your activity here"}
                  </Text>
                </View>
              }
              ListFooterComponent={
                filteredNotifications.length > 0 ? (
                  <Text style={styles.footerText}>
                    Showing {filteredNotifications.length} of {notifications.length} notifications
                  </Text>
                ) : null
              }
            />
          )}
        </>
      ) : (
        // Settings tab - link to notification preferences
        <View style={styles.settingsContainer}>
          <TouchableOpacity
            style={styles.settingsCard}
            onPress={() => router.push('/profile/notifications')}
          >
            <View style={styles.settingsIconContainer}>
              <Ionicons name="options-outline" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsTitle}>Notification Preferences</Text>
              <Text style={styles.settingsSubtitle}>
                Customize how and when you receive notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.settingsInfo}>
            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
            <Text style={styles.settingsInfoText}>
              Your notification preferences are synced across all your devices.
            </Text>
          </View>
        </View>
      )}

      {/* Notification Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          {/* Tap outside to close */}
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCloseModal}
          />

          {/* Modal Content */}
          <View style={styles.modalContent}>
            {/* Drag indicator to show it's scrollable */}
            <View style={styles.modalDragIndicator} />

            {selectedNotification && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={[
                    styles.modalIconContainer,
                    { backgroundColor: `${getNotificationColor(selectedNotification.type)}15` }
                  ]}>
                    <Ionicons
                      name={getNotificationIcon(selectedNotification.type)}
                      size={28}
                      color={getNotificationColor(selectedNotification.type)}
                    />
                  </View>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={handleCloseModal}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Modal Body - Using FlatList for better scroll performance */}
                <FlatList
                  data={[selectedNotification]}
                  keyExtractor={() => 'notification-detail'}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                  style={styles.modalBody}
                  contentContainerStyle={styles.modalBodyContent}
                  keyboardShouldPersistTaps="handled"
                  renderItem={() => (
                    <View>
                      {/* From label */}
                      <Text style={styles.modalFromLabel}>From Ethiopian Maids</Text>

                      <Text style={[
                        styles.modalTitle,
                        selectedNotification.type === 'profile_rejected' && styles.modalTitleRejected
                      ]}>
                        {selectedNotification.title}
                      </Text>
                      <Text style={styles.modalTime}>{formatDate(selectedNotification.created_at)}</Text>

                      {/* Full Message */}
                      <View style={styles.modalMessageContainer}>
                        {selectedNotification.type === 'profile_rejected' ? (
                          <>
                            <View style={styles.requiredInfoHeader}>
                              <Ionicons name="alert-circle" size={18} color="#92400E" />
                              <Text style={styles.requiredInfoLabel}>Required Information</Text>
                            </View>
                            {/* Parse message and show each item with yellow background */}
                            {selectedNotification.message.split(/[-•\n]/).filter((item: string) => item.trim()).map((item: string, index: number) => (
                              <View key={index} style={styles.requiredItem}>
                                <Ionicons name="chevron-forward" size={16} color="#92400E" />
                                <Text style={styles.requiredItemText}>{item.trim()}</Text>
                              </View>
                            ))}
                          </>
                        ) : (
                          <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                        )}
                      </View>

                      {/* Priority Badge */}
                      {(selectedNotification.priority === 'urgent' || selectedNotification.priority === 'high') && (
                        <View style={[
                          styles.modalPriorityBadge,
                          { backgroundColor: selectedNotification.priority === 'urgent' ? '#FEE2E2' : '#FEF3C7' }
                        ]}>
                          <Ionicons
                            name="warning"
                            size={16}
                            color={selectedNotification.priority === 'urgent' ? '#DC2626' : '#D97706'}
                          />
                          <Text style={[
                            styles.modalPriorityText,
                            { color: selectedNotification.priority === 'urgent' ? '#DC2626' : '#D97706' }
                          ]}>
                            {selectedNotification.priority === 'urgent' ? 'Urgent' : 'High Priority'}
                          </Text>
                        </View>
                      )}

                      {/* Additional Details */}
                      {selectedNotification.type && (
                        <View style={styles.modalDetailRow}>
                          <Text style={styles.modalDetailLabel}>Type</Text>
                          <Text style={styles.modalDetailValue}>
                            {selectedNotification.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </Text>
                        </View>
                      )}

                      {/* Show rejection/approval context */}
                      {(selectedNotification.type === 'profile_rejected' || selectedNotification.type === 'profile_approved') && (
                        <View style={styles.modalContextBox}>
                          <Ionicons
                            name={selectedNotification.type === 'profile_approved' ? 'checkmark-circle' : 'information-circle'}
                            size={20}
                            color={selectedNotification.type === 'profile_approved' ? '#059669' : '#DC2626'}
                          />
                          <Text style={[
                            styles.modalContextText,
                            { color: selectedNotification.type === 'profile_approved' ? '#059669' : '#DC2626' }
                          ]}>
                            {selectedNotification.type === 'profile_approved'
                              ? 'Your profile has been approved and is now visible to employers.'
                              : 'Please review the feedback above and update your profile accordingly.'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                />

                {/* Modal Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCloseButtonLarge}
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#8B5CF6',
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  // Connection status
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  connectionLive: {
    backgroundColor: '#ECFDF5',
  },
  connectionOffline: {
    backgroundColor: '#FEF2F2',
  },
  connectionConnecting: {
    backgroundColor: '#FFFBEB',
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Filters
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  filterTextActive: {
    color: '#fff',
  },
  // Mark all
  markAllContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  // List
  list: {
    padding: 12,
  },
  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
    flex: 1,
    marginRight: 8,
  },
  titleUnread: {
    fontWeight: '600',
    color: '#1F2937',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  newBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Actions
  actions: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty state
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  // Loading/Error
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9CA3AF',
    paddingVertical: 16,
  },
  // Settings tab
  settingsContainer: {
    padding: 16,
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  settingsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 8,
  },
  settingsInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 34, // Safe area padding
  },
  modalDragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flexGrow: 1,
    flexShrink: 1,
  },
  modalBodyContent: {
    padding: 20,
    paddingBottom: 10,
  },
  modalFromLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalTitleRejected: {
    color: '#DC2626',
  },
  modalTime: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  modalMessageContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  requiredInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  requiredInfoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  requiredItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#78350F',
    lineHeight: 20,
  },
  modalMessage: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  modalPriorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
  },
  modalPriorityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  modalContextBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  modalContextText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalCloseButtonLarge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
