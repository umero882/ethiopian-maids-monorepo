/**
 * Maid Media Screen
 *
 * Collects additional photos and video CV.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useOnboarding } from '../../../context/OnboardingContext';
import { ProgressBar, GamificationBadge } from '../../../components/onboarding';

interface MediaItem {
  uri: string;
  type: 'photo' | 'video';
}

export default function MaidMediaScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints, addAchievement } = useOnboarding();

  const [photos, setPhotos] = useState<MediaItem[]>(
    state.formData.additionalPhotos?.map((uri: string) => ({ uri, type: 'photo' as const })) || []
  );
  const [videoCV, setVideoCV] = useState<MediaItem | null>(
    state.formData.videoCVUri ? { uri: state.formData.videoCVUri, type: 'video' } : null
  );

  const progress = getProgress();

  const maxPhotos = 4;

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your media library to upload photos and videos.'
        );
        return false;
      }
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to record videos.'
        );
        return false;
      }
    }
    return true;
  };

  const pickPhoto = async (useCamera: boolean = false) => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Maximum Reached', `You can only upload up to ${maxPhotos} photos.`);
      return;
    }

    let hasPermission = false;

    if (useCamera) {
      hasPermission = await requestCameraPermissions();
    } else {
      hasPermission = await requestPermissions();
    }

    if (!hasPermission) return;

    let result;

    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, { uri: result.assets[0].uri, type: 'photo' }]);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => pickPhoto(true) },
        { text: 'Choose from Library', onPress: () => pickPhoto(false) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removePhoto = (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPhotos((prev) => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const pickVideo = async (useCamera: boolean = false) => {
    let hasPermission = false;

    if (useCamera) {
      hasPermission = await requestCameraPermissions();
    } else {
      hasPermission = await requestPermissions();
    }

    if (!hasPermission) return;

    let result;

    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: 60,
        quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: 60,
        quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });
    }

    if (!result.canceled && result.assets[0]) {
      setVideoCV({ uri: result.assets[0].uri, type: 'video' });
    }
  };

  const showVideoOptions = () => {
    Alert.alert(
      'Video CV',
      'Choose an option',
      [
        { text: 'Record Video', onPress: () => pickVideo(true) },
        { text: 'Choose from Library', onPress: () => pickVideo(false) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeVideo = () => {
    Alert.alert(
      'Remove Video',
      'Are you sure you want to remove this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setVideoCV(null),
        },
      ]
    );
  };

  const handleContinue = () => {
    updateFormData({
      additionalPhotos: photos.map((p) => p.uri),
      videoCVUri: videoCV?.uri,
    });
    awardPoints(20);

    // Award video star achievement
    if (videoCV) {
      addAchievement({
        id: 'video_star',
        name: 'Video Star',
        description: 'Uploaded a video CV',
        icon: 'videocam',
        points: 35,
        trigger: 'videoUpload',
        earnedAt: new Date().toISOString(),
      });
      awardPoints(35);
    }

    nextStep();
    router.push('/onboarding/maid/consents');
  };

  const handleBack = () => {
    updateFormData({
      additionalPhotos: photos.map((p) => p.uri),
      videoCVUri: videoCV?.uri,
    });
    previousStep();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} showLabel={false} />
          </View>
          <GamificationBadge
            points={state.gamification.points}
            level={state.gamification.level}
            compact
          />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="images" size={32} color="#9333EA" />
          </View>
          <Text style={styles.subtitle}>Profile Step 9 of 10</Text>
          <Text style={styles.title}>Photos & Video</Text>
          <Text style={styles.description}>
            Add more photos and an optional video to make your profile stand out
          </Text>
        </View>

        {/* Additional Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Additional Photos</Text>
            <Text style={styles.sectionCount}>{photos.length}/{maxPhotos}</Text>
          </View>
          <Text style={styles.sectionHint}>
            Show families more about yourself (optional but recommended)
          </Text>

          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoCard}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}

            {photos.length < maxPhotos && (
              <TouchableOpacity
                style={styles.addPhotoCard}
                onPress={showPhotoOptions}
              >
                <View style={styles.addIconContainer}>
                  <Ionicons name="add-circle" size={40} color="#9333EA" />
                </View>
                <Text style={styles.addText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Video CV Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Video CV</Text>
            {!videoCV && (
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalText}>Optional</Text>
              </View>
            )}
          </View>
          <Text style={styles.sectionHint}>
            Record a short video introducing yourself (up to 60 seconds)
          </Text>

          {videoCV ? (
            <View style={styles.videoCard}>
              <View style={styles.videoPreview}>
                <Ionicons name="videocam" size={48} color="#9333EA" />
                <Text style={styles.videoText}>Video CV Uploaded</Text>
                <Text style={styles.videoSubtext}>Tap to change</Text>
              </View>
              <View style={styles.videoActions}>
                <TouchableOpacity
                  style={styles.videoActionButton}
                  onPress={showVideoOptions}
                >
                  <Ionicons name="refresh" size={20} color="#6B7280" />
                  <Text style={styles.videoActionText}>Replace</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.videoActionButton, styles.removeVideoButton]}
                  onPress={removeVideo}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  <Text style={[styles.videoActionText, styles.removeVideoText]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.videoUploadCard}
              onPress={showVideoOptions}
            >
              <View style={styles.videoIconContainer}>
                <Ionicons name="videocam-outline" size={48} color="#9333EA" />
              </View>
              <Text style={styles.videoUploadTitle}>Record or Upload Video</Text>
              <Text style={styles.videoUploadSubtext}>
                Profiles with videos get 3x more views
              </Text>
            </TouchableOpacity>
          )}

          {/* Video Achievement Hint */}
          {!videoCV ? (
            <View style={styles.achievementHint}>
              <Ionicons name="bulb-outline" size={18} color="#D97706" />
              <Text style={styles.achievementHintText}>
                Upload a video to earn the "Video Star" achievement (+35 pts)
              </Text>
            </View>
          ) : (
            <View style={[styles.achievementHint, styles.achievementEarned]}>
              <Ionicons name="trophy" size={18} color="#059669" />
              <Text style={[styles.achievementHintText, styles.achievementEarnedText]}>
                You qualify for the "Video Star" achievement (+35 pts)
              </Text>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsBox}>
          <Ionicons name="film-outline" size={20} color="#1E40AF" />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Video Tips</Text>
            <Text style={styles.tipsText}>
              • Look at the camera and smile{'\n'}
              • Speak clearly in good lighting{'\n'}
              • Keep it under 60 seconds{'\n'}
              • Mention your key skills
            </Text>
          </View>
        </View>

        {/* Points Info */}
        <View style={styles.pointsInfo}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>+20 points for completing this step</Text>
        </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  progressContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleContainer: {
    marginBottom: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#9333EA15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#9333EA',
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  optionalBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  optionalText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: '47%',
    aspectRatio: 4/3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addPhotoCard: {
    width: '47%',
    aspectRatio: 4/3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  addIconContainer: {
    marginBottom: 8,
  },
  addText: {
    fontSize: 14,
    color: '#9333EA',
    fontWeight: '500',
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#9333EA',
    overflow: 'hidden',
  },
  videoPreview: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F3FF',
  },
  videoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B21B6',
    marginTop: 8,
  },
  videoSubtext: {
    fontSize: 13,
    color: '#7C3AED',
    marginTop: 4,
  },
  videoActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  videoActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 6,
  },
  videoActionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  removeVideoButton: {
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  removeVideoText: {
    color: '#DC2626',
  },
  videoUploadCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    padding: 32,
  },
  videoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  videoUploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  videoUploadSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  achievementHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  achievementEarned: {
    backgroundColor: '#D1FAE5',
  },
  achievementHintText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
  achievementEarnedText: {
    color: '#065F46',
  },
  tipsBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 6,
  },
  tipsText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 20,
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  pointsText: {
    fontSize: 14,
    color: '#92400E',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#F9FAFB',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9333EA',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
