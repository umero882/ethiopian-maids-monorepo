/**
 * Interests Screen
 *
 * Manages sent and received interest requests.
 * Shows pending, accepted, and rejected interests.
 */

import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import {
  useMyInterests,
  useRespondToInterest,
  useCancelInterest,
  InterestRequest,
} from '../../hooks/useInterests';

type TabType = 'received' | 'sent';

export default function InterestsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [refreshing, setRefreshing] = useState(false);

  const { sent, received, loading, error, refetch } = useMyInterests();
  const { acceptInterest, rejectInterest, loading: responding } = useRespondToInterest();
  const { cancelInterest, loading: cancelling } = useCancelInterest();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAccept = async (interest: InterestRequest) => {
    try {
      await acceptInterest(interest.id);
      Alert.alert(
        'Interest Accepted',
        'A conversation has been created. You can now chat!',
        [
          { text: 'OK', onPress: () => refetch() },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept interest');
    }
  };

  const handleReject = async (interest: InterestRequest) => {
    Alert.alert(
      'Reject Interest',
      'Are you sure you want to reject this interest?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectInterest(interest.id);
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reject interest');
            }
          },
        },
      ]
    );
  };

  const handleCancel = async (interest: InterestRequest) => {
    Alert.alert(
      'Cancel Interest',
      'Are you sure you want to cancel this interest request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelInterest(interest.id);
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel interest');
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'accepted':
        return { text: 'Accepted', color: '#10B981', bgColor: '#D1FAE5' };
      case 'rejected':
        return { text: 'Rejected', color: '#EF4444', bgColor: '#FEE2E2' };
      case 'expired':
        return { text: 'Expired', color: '#6B7280', bgColor: '#F3F4F6' };
      case 'cancelled':
        return { text: 'Cancelled', color: '#6B7280', bgColor: '#F3F4F6' };
      default:
        return { text: status, color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const renderReceivedItem = ({ item }: { item: InterestRequest }) => {
    const badge = getStatusBadge(item.status);
    const isPending = item.status === 'pending';

    return (
      <View style={styles.interestCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={24} color="#1E40AF" />
          </View>
        </View>

        <View style={styles.interestInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.interestName}>
              {item.sender_id?.substring(0, 8)}...
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.bgColor }]}>
              <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                {badge.text}
              </Text>
            </View>
          </View>
          <Text style={styles.interestType}>
            {item.sender_type?.charAt(0).toUpperCase() + item.sender_type?.slice(1)}
          </Text>
          {item.message && (
            <Text style={styles.interestMessage} numberOfLines={2}>
              "{item.message}"
            </Text>
          )}
          <Text style={styles.interestTime}>{formatTime(item.created_at)}</Text>
        </View>

        {isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAccept(item)}
              disabled={responding}
            >
              {responding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark" size={20} color="#fff" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleReject(item)}
              disabled={responding}
            >
              <Ionicons name="close" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderSentItem = ({ item }: { item: InterestRequest }) => {
    const badge = getStatusBadge(item.status);
    const isPending = item.status === 'pending';

    return (
      <View style={styles.interestCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={24} color="#1E40AF" />
          </View>
        </View>

        <View style={styles.interestInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.interestName}>
              {item.recipient_id?.substring(0, 8)}...
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.bgColor }]}>
              <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                {badge.text}
              </Text>
            </View>
          </View>
          <Text style={styles.interestType}>
            {item.recipient_type?.charAt(0).toUpperCase() + item.recipient_type?.slice(1)}
          </Text>
          <Text style={styles.interestTime}>{formatTime(item.created_at)}</Text>
        </View>

        {isPending && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancel(item)}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!user) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Interests',
            headerShown: true,
          }}
        />
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Please sign in</Text>
          <Text style={styles.emptySubtitle}>Sign in to view your interests</Text>
        </View>
      </>
    );
  }

  const currentData = activeTab === 'received' ? received : sent;
  const pendingReceivedCount = received.filter(i => i.status === 'pending').length;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Interests',
          headerShown: true,
          headerStyle: { backgroundColor: '#1E40AF' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBack}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'received' && styles.activeTab]}
            onPress={() => setActiveTab('received')}
          >
            <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
              Received
            </Text>
            {pendingReceivedCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingReceivedCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
            onPress={() => setActiveTab('sent')}
          >
            <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
              Sent
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading && currentData.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E40AF" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>Error loading interests</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : currentData.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'received' ? 'No interests received' : 'No interests sent'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'received'
                ? 'When someone sends you an interest, it will appear here'
                : 'Send interests to connect with other users'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={(item) => item.id}
            renderItem={activeTab === 'received' ? renderReceivedItem : renderSentItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1E40AF']}
              />
            }
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </>
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
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  headerBack: {
    marginLeft: 8,
    padding: 4,
  },
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
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1E40AF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1E40AF',
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  interestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  interestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  interestType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  interestMessage: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 4,
  },
  interestTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
