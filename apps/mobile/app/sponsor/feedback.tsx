/**
 * Sponsor Reviews & Feedback Screen
 *
 * Displays reviews the sponsor has given to maids.
 * Allows sponsors to view, edit, and manage their reviews.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useReviewsGiven,
  useReviewMutations,
  Review,
  formatReviewDate,
} from '../../hooks';

// Star rating component
const StarRating = ({
  rating,
  size = 16,
  editable = false,
  onRatingChange,
}: {
  rating: number;
  size?: number;
  editable?: boolean;
  onRatingChange?: (rating: number) => void;
}) => {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          disabled={!editable}
          onPress={() => onRatingChange?.(star)}
          style={styles.starButton}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? '#F59E0B' : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function SponsorFeedbackScreen() {
  const {
    reviews,
    totalCount,
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
    profileId,
  } = useReviewsGiven();

  const { updateReview, deleteReview, isProcessing } = useReviewMutations();

  const [refreshing, setRefreshing] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Open edit modal
  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  // Save edited review
  const handleSaveEdit = async () => {
    if (!editingReview) return;

    if (editRating < 1) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      await updateReview(editingReview.id, {
        rating: editRating,
        comment: editComment,
      });

      Alert.alert('Success', 'Review updated successfully');
      setEditingReview(null);
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update review');
    }
  };

  // Delete review
  const handleDeleteReview = (review: Review) => {
    const maidName = review.maid_profile?.full_name || 'this maid';

    Alert.alert(
      'Delete Review',
      `Are you sure you want to delete your review for ${maidName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReview(review.id);
              Alert.alert('Success', 'Review deleted successfully');
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete review');
            }
          },
        },
      ]
    );
  };

  // Show review actions
  const showActions = (review: Review) => {
    const maidName = review.maid_profile?.full_name || 'Unknown Maid';

    Alert.alert('Review Options', maidName, [
      {
        text: 'Edit Review',
        onPress: () => handleEditReview(review),
      },
      {
        text: 'Delete Review',
        style: 'destructive',
        onPress: () => handleDeleteReview(review),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Render review card
  const renderReview = ({ item: review }: { item: Review }) => {
    const maid = review.maid_profile;

    return (
      <TouchableOpacity
        style={styles.reviewCard}
        onPress={() => showActions(review)}
        activeOpacity={0.7}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.maidInfo}>
            {maid?.profile_photo_url ? (
              <Image source={{ uri: maid.profile_photo_url }} style={styles.maidAvatar} />
            ) : (
              <View style={styles.maidAvatarPlaceholder}>
                <Text style={styles.maidAvatarText}>
                  {maid?.full_name?.charAt(0) || 'M'}
                </Text>
              </View>
            )}
            <View style={styles.maidDetails}>
              <Text style={styles.maidName}>{maid?.full_name || 'Unknown Maid'}</Text>
              <Text style={styles.reviewDate}>{formatReviewDate(review.created_at)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton} onPress={() => showActions(review)}>
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.ratingRow}>
          <StarRating rating={review.rating} size={18} />
          <Text style={styles.ratingText}>{review.rating}.0</Text>
        </View>

        {review.comment && (
          <Text style={styles.reviewComment} numberOfLines={3}>
            {review.comment}
          </Text>
        )}

        <View style={styles.reviewFooter}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditReview(review)}
          >
            <Ionicons name="pencil-outline" size={16} color="#3B82F6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewMaidButton}
            onPress={() => router.push(`/maid/${review.maid_id}`)}
          >
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={styles.viewMaidButtonText}>View Maid</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Calculate stats
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // Loading state
  if (loading && !reviews.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Reviews & Feedback',
        }}
      />

      <View style={styles.container}>
        {/* Summary Header */}
        <View style={styles.summaryHeader}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{averageRating}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{totalCount}</Text>
            <Text style={styles.statLabel}>Reviews Given</Text>
          </View>
        </View>

        {/* Reviews List */}
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
            />
          }
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="star-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Reviews Yet</Text>
              <Text style={styles.emptySubtitle}>
                Reviews you give to maids after completing bookings will appear here
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push('/(tabs)/maids')}
              >
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.browseButtonText}>Browse Maids</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            ) : null
          }
        />

        {/* Edit Review Modal */}
        <Modal
          visible={!!editingReview}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditingReview(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditingReview(null)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Review</Text>
              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={isProcessing}
              >
                <Text style={[styles.modalSave, isProcessing && styles.modalSaveDisabled]}>
                  {isProcessing ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {editingReview?.maid_profile && (
                <View style={styles.editMaidInfo}>
                  {editingReview.maid_profile.profile_photo_url ? (
                    <Image
                      source={{ uri: editingReview.maid_profile.profile_photo_url }}
                      style={styles.editMaidAvatar}
                    />
                  ) : (
                    <View style={[styles.maidAvatarPlaceholder, styles.editMaidAvatar]}>
                      <Text style={styles.maidAvatarText}>
                        {editingReview.maid_profile.full_name?.charAt(0) || 'M'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.editMaidName}>
                    {editingReview.maid_profile.full_name}
                  </Text>
                </View>
              )}

              {/* Rating */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rating</Text>
                <View style={styles.ratingInput}>
                  <StarRating
                    rating={editRating}
                    size={36}
                    editable
                    onRatingChange={setEditRating}
                  />
                  <Text style={styles.ratingInputText}>{editRating} / 5</Text>
                </View>
              </View>

              {/* Comment */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Review</Text>
                <TextInput
                  style={styles.commentInput}
                  value={editComment}
                  onChangeText={setEditComment}
                  placeholder="Share your experience..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Tips */}
              <View style={styles.tipsCard}>
                <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                <View style={styles.tipsContent}>
                  <Text style={styles.tipsTitle}>Writing a helpful review</Text>
                  <Text style={styles.tipsText}>
                    Be specific about what you liked or didn't like. Mention punctuality, work quality, and communication.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  summaryHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  maidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  maidAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  maidAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maidAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  maidDetails: {
    marginLeft: 12,
    flex: 1,
  },
  maidName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  starContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 4,
    paddingTop: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  viewMaidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewMaidButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  editMaidInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
  },
  editMaidAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  editMaidName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  ratingInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  ratingInputText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
  },
});
