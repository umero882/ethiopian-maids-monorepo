/**
 * User List Modal Component
 *
 * Displays a list of users by type for starting conversations.
 * Shows online status and allows sending interests or starting chats.
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  User,
  Building2,
  Heart,
  MessageSquare,
  RefreshCw,
  Loader2,
  AlertCircle,
  Check,
  Crown,
  Sparkles,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import interestService from '@/services/interestService';
import subscriptionService from '@/services/subscriptionService';
import UpgradePromptModal from '@/components/UpgradePromptModal';

// GraphQL Query for browsable users with real-time updates
// Using full_name instead of name (profiles table uses full_name)
const GET_BROWSABLE_USERS = gql`
  query GetBrowsableUsers($userType: String!, $searchQuery: String, $limit: Int = 30) {
    profiles(
      where: {
        user_type: { _eq: $userType }
        is_active: { _eq: true }
        _or: [
          { full_name: { _ilike: $searchQuery } }
          { country: { _ilike: $searchQuery } }
          { email: { _ilike: $searchQuery } }
        ]
      }
      order_by: [{ is_online: desc }, { last_activity_at: desc_nulls_last }]
      limit: $limit
    ) {
      id
      full_name
      email
      user_type
      avatar_url
      country
      is_online
      last_activity_at
    }
  }
`;

// Subscription for real-time online status
const ONLINE_STATUS_SUBSCRIPTION = gql`
  subscription OnlineStatusUpdates($userType: String!) {
    profiles(
      where: { user_type: { _eq: $userType }, is_active: { _eq: true } }
      order_by: [{ is_online: desc }, { last_activity_at: desc_nulls_last }]
      limit: 50
    ) {
      id
      is_online
      last_activity_at
    }
  }
`;

const UserTypeIcon = ({ type }) => {
  switch (type) {
    case 'agency':
      return <Building2 className="h-5 w-5" />;
    case 'maid':
      return <User className="h-5 w-5" />;
    default:
      return <User className="h-5 w-5" />;
  }
};

const OnlineIndicator = ({ isOnline }) => (
  <span
    className={cn(
      'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
      isOnline ? 'bg-green-500' : 'bg-gray-300'
    )}
  />
);

const UserCard = ({
  user,
  isPaidUser,
  existingConnection,
  onSendInterest,
  onStartChat,
  loading,
}) => {
  const getActionButton = () => {
    // If conversation exists, show "Open Chat"
    if (existingConnection?.type === 'conversation') {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onStartChat(existingConnection.id)}
          className="gap-1"
        >
          <MessageSquare className="h-4 w-4" />
          Open Chat
        </Button>
      );
    }

    // If interest exists
    if (existingConnection?.type === 'interest') {
      const { status, isSender } = existingConnection;

      if (status === 'pending') {
        return (
          <Badge variant="secondary" className="gap-1">
            {isSender ? 'Interest Sent' : 'Sent You Interest'}
          </Badge>
        );
      }

      if (status === 'accepted') {
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <Check className="h-3 w-3" />
            Accepted
          </Badge>
        );
      }
    }

    // Paid user can start chat directly
    if (isPaidUser) {
      return (
        <Button
          size="sm"
          onClick={() => onStartChat(null, user)}
          disabled={loading}
          className="gap-1 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          Start Chat
        </Button>
      );
    }

    // Free user can only send interest
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onSendInterest(user)}
        disabled={loading}
        className="gap-1"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className="h-4 w-4" />
        )}
        Send Interest
      </Button>
    );
  };

  // Get display name from full_name or email
  const displayName = user.full_name || user.email?.split('@')[0] || user.id?.substring(0, 8) + '...';

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer group">
      <div className="relative">
        <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-200 transition-all">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600">
            <UserTypeIcon type={user.user_type} />
          </AvatarFallback>
        </Avatar>
        <OnlineIndicator isOnline={user.is_online} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
            {displayName}
          </p>
          {user.is_online && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50 animate-pulse">
              Online
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">
          {user.country || 'Location not specified'}
        </p>
      </div>

      <div className="flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
        {getActionButton()}
      </div>
    </div>
  );
};

const UserListModal = ({
  isOpen,
  onClose,
  selectedUserType,
  onConversationCreated,
}) => {
  const { user, userType: authUserType } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [existingConnections, setExistingConnections] = useState({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Get the current user's type for the upgrade modal
  const currentUserType = authUserType || user?.user_type || 'agency';

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (user?.uid) {
        const subscription = await subscriptionService.getActiveSubscription(user.uid);
        const planType = subscriptionService.getPlanType(subscription);
        setIsPaidUser(planType !== 'free');
      }
    };
    checkSubscription();
  }, [user?.uid]);

  // Query for users
  const {
    data,
    loading,
    error,
    refetch,
  } = useQuery(GET_BROWSABLE_USERS, {
    variables: {
      userType: selectedUserType,
      searchQuery: searchQuery ? `%${searchQuery}%` : '%',
    },
    skip: !selectedUserType || !isOpen,
    fetchPolicy: 'cache-and-network',
  });

  // Real-time subscription for online status
  useSubscription(ONLINE_STATUS_SUBSCRIPTION, {
    variables: { userType: selectedUserType },
    skip: !selectedUserType || !isOpen,
    onData: () => {
      // Refetch to update online status
      refetch();
    },
  });

  const users = data?.profiles || [];

  // Check existing connections for displayed users
  useEffect(() => {
    const checkConnections = async () => {
      if (!users.length || !user?.uid) return;

      const connections = {};
      for (const u of users) {
        const connection = await interestService.checkExistingConnection(u.id);
        if (connection) {
          connections[u.id] = connection;
        }
      }
      setExistingConnections(connections);
    };

    checkConnections();
  }, [users, user?.uid]);

  const handleSendInterest = async (targetUser) => {
    try {
      setLoadingUserId(targetUser.id);

      await interestService.sendInterest(
        targetUser.id,
        targetUser.user_type,
        null // No intro message for now
      );

      const displayName = targetUser.full_name || targetUser.email?.split('@')[0] || 'the user';
      toast({
        title: 'Interest Sent',
        description: `Your interest has been sent to ${displayName}. They will be notified.`,
      });

      // Update local state
      setExistingConnections(prev => ({
        ...prev,
        [targetUser.id]: { type: 'interest', status: 'pending', isSender: true },
      }));
    } catch (error) {
      console.error('Error sending interest:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send interest. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleStartChat = async (existingConversationId, targetUser = null) => {
    try {
      if (existingConversationId) {
        // Navigate to existing conversation
        onConversationCreated?.(existingConversationId);
        onClose();
        return;
      }

      if (!targetUser) return;

      setLoadingUserId(targetUser.id);

      // Create new conversation
      const conversation = await interestService.createConversation(
        targetUser.id,
        targetUser.user_type
      );

      if (conversation?.id) {
        toast({
          title: 'Conversation Started',
          description: 'You can now send messages.',
        });
        onConversationCreated?.(conversation.id);
        onClose();
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start conversation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingUserId(null);
    }
  };

  const getUserTypeLabel = (type) => {
    switch (type) {
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

  const handleUpgrade = () => {
    // Show upgrade modal with user-type-specific benefits
    setShowUpgradeModal(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <UserTypeIcon type={selectedUserType} />
              </div>
              <span>Browse {getUserTypeLabel(selectedUserType)}</span>
              {users.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {users.length} found
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search ${getUserTypeLabel(selectedUserType).toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Subscription hint with Upgrade button */}
        {!isPaidUser && (
          <div className="mx-6 mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-amber-100">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">Free Account</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Send interest to connect. Upgrade to Pro for direct messaging.
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1 shadow-md hover:shadow-lg transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Upgrade
              </Button>
            </div>
          </div>
        )}

        {/* Scrollable User List */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
        >
          {loading && users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              </div>
              <p className="text-sm text-gray-500 mt-4">Loading {getUserTypeLabel(selectedUserType).toLowerCase()}...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-red-50 mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">Error loading users</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[250px] text-center">{error.message}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-4 gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-gray-100 mb-4">
                <User className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                {searchQuery
                  ? 'No users found'
                  : `No ${getUserTypeLabel(selectedUserType).toLowerCase()} available`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {searchQuery ? 'Try a different search term' : 'Check back later for new users'}
              </p>
            </div>
          ) : (
            <div className="border rounded-xl divide-y overflow-hidden shadow-sm bg-white">
              {users.map((u, index) => (
                <div
                  key={u.id}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  <UserCard
                    user={u}
                    isPaidUser={isPaidUser}
                    existingConnection={existingConnections[u.id]}
                    onSendInterest={handleSendInterest}
                    onStartChat={handleStartChat}
                    loading={loadingUserId === u.id}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Footer with count */}
        {users.length > 0 && (
          <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {users.length} {getUserTypeLabel(selectedUserType).toLowerCase()}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="gap-1 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Upgrade Modal with user-type-specific benefits */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userType={currentUserType}
      />
    </Dialog>
  );
};

export default UserListModal;
