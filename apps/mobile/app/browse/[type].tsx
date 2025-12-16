/**
 * Browse Users Screen
 *
 * Shows list of users by type (sponsors, agencies, maids)
 * with online status and interest/chat actions.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../context/ToastContext';
import UpgradePromptModal from '../../components/UpgradePromptModal';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import {
  useBrowsableUsers,
  useSendInterest,
  useCreateConversation,
  useCheckConnection,
  BrowsableUser,
} from '../../hooks/useInterests';

export default function BrowseUsersScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { user } = useAuth();
  const { subscription, currentPlan, loading: subscriptionLoading, userType: currentUserType } = useSubscription();
  const { showSuccess, showError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { users, loading, error, refetch } = useBrowsableUsers(type || '', 50);
  const { sendInterest, loading: sendingInterest } = useSendInterest();
  const { createConversation, loading: creatingConversation } = useCreateConversation();
  const { connection } = useCheckConnection(selectedUserId);

  const [refreshing, setRefreshing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lastSentToUser, setLastSentToUser] = useState<string | null>(null);

  // Check if user has paid subscription
  // Note: useSubscription returns planType (camelCase), not plan_type
  const isPaidUser = subscription?.planType && subscription.planType !== 'free';

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getUserTypeLabel = (userType: string | undefined) => {
    switch (userType) {
      case 'maid':
        return 'Maids';
      case 'sponsor':
        return 'Sponsors';
      case 'agency':
        return 'Agencies';
      default:
        return 'Users';
    }
  };

  const getUserTypeIcon = (userType: string | undefined) => {
    switch (userType) {
      case 'agency':
        return 'business-outline';
      default:
        return 'person-outline';
    }
  };

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const name = u.name?.toLowerCase() || '';
    const country = u.country?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || country.includes(query);
  });

  const handleSendInterest = async (targetUser: BrowsableUser) => {
    try {
      await sendInterest(targetUser.id, targetUser.user_type);
      const userName = targetUser.name || 'the user';
      setLastSentToUser(userName);
      // Show success toast
      showSuccess('Interest Sent!', `Your interest has been sent to ${userName}`);
      // Show upgrade modal for free users after sending interest
      setShowUpgradeModal(true);
      refetch();
    } catch (err: any) {
      showError('Error', err.message || 'Failed to send interest');
      Alert.alert('Error', err.message || 'Failed to send interest');
    }
  };

  const handleStartChat = async (targetUser: BrowsableUser) => {
    try {
      const conversation = await createConversation(
        targetUser.id,
        targetUser.user_type
      );
      if (conversation?.id) {
        router.push(`/chat/${conversation.id}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start conversation');
    }
  };

  const handleShowUpgradePrompt = () => {
    // Show the upgrade modal with user-type-specific benefits
    setShowUpgradeModal(true);
  };

  const renderUserCard = ({ item }: { item: BrowsableUser }) => {
    const isOnline = item.is_online;

    return (
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons
              name={getUserTypeIcon(item.user_type) as any}
              size={24}
              color="#1E40AF"
            />
          </View>
          <View
            style={[
              styles.onlineIndicator,
              isOnline ? styles.online : styles.offline,
            ]}
          />
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>
              {item.name || item.id?.substring(0, 8) + '...'}
            </Text>
            {isOnline && (
              <View style={styles.onlineBadge}>
                <Text style={styles.onlineBadgeText}>Online</Text>
              </View>
            )}
          </View>
          <Text style={styles.userLocation}>
            {item.country || 'Location not specified'}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          {isPaidUser ? (
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => handleStartChat(item)}
              disabled={creatingConversation}
            >
              {creatingConversation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="chatbubble" size={16} color="#fff" />
                  <Text style={styles.chatButtonText}>Chat</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.interestButton}
              onPress={() => handleSendInterest(item)}
              disabled={sendingInterest}
            >
              {sendingInterest ? (
                <ActivityIndicator size="small" color="#1E40AF" />
              ) : (
                <>
                  <Ionicons name="heart-outline" size={16} color="#1E40AF" />
                  <Text style={styles.interestButtonText}>Interest</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <>
        <Stack.Screen
          options={{
            title: `Browse ${getUserTypeLabel(type)}`,
            headerShown: true,
          }}
        />
        <View style={styles.empty}>
          <Ionicons name="person-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Please sign in</Text>
          <Text style={styles.emptySubtitle}>Sign in to browse users</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Browse ${getUserTypeLabel(type)}`,
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
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${getUserTypeLabel(type)?.toLowerCase()}...`}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Subscription hint for free users with Upgrade button */}
        {!isPaidUser && !subscriptionLoading && (
          <View style={styles.upgradeHint}>
            <View style={styles.upgradeHintIcon}>
              <Ionicons name="diamond" size={20} color="#D97706" />
            </View>
            <View style={styles.upgradeHintContent}>
              <Text style={styles.upgradeHintTitle}>Free Account</Text>
              <Text style={styles.upgradeHintText}>
                Send interest to connect. Upgrade to Pro for direct messaging.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.upgradeHintButton}
              onPress={handleShowUpgradePrompt}
            >
              <Ionicons name="sparkles" size={14} color="#fff" />
              <Text style={styles.upgradeHintButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* User List */}
        {loading && users.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E40AF" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>Error loading users</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different search'
                : `No ${getUserTypeLabel(type)?.toLowerCase()} available`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderUserCard}
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

      {/* Premium Upgrade Modal with user-type-specific benefits */}
      <UpgradePromptModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userType={(currentUserType as 'agency' | 'maid' | 'sponsor') || 'sponsor'}
        currentPlan={currentPlan}
        showSuccessHeader={!!lastSentToUser}
        successMessage={lastSentToUser ? `Your interest has been sent to ${lastSentToUser}. They will be notified.` : ''}
        title="Skip the wait with Pro!"
        subtitle="Unlock direct messaging and more powerful features"
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1F2937',
  },
  upgradeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  upgradeHintIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeHintContent: {
    flex: 1,
  },
  upgradeHintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 2,
  },
  upgradeHintText: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  upgradeHintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeHintButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  userCard: {
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
    position: 'relative',
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
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  online: {
    backgroundColor: '#22C55E',
  },
  offline: {
    backgroundColor: '#9CA3AF',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  onlineBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  onlineBadgeText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '500',
  },
  userLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  actionContainer: {
    marginLeft: 12,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E40AF',
    gap: 4,
  },
  interestButtonText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
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
  // Upgrade Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  upgradeModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 34,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconContainer: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  waitingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  waitingText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  premiumSection: {
    marginBottom: 20,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresScroll: {
    maxHeight: 280,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  modalActions: {
    gap: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  laterButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
});
