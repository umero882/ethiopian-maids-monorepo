/**
 * Sponsor Biometric & Document Screen
 *
 * Captures photo and ID document for verification.
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

export default function SponsorBiometricDocScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints, addAchievement } = useOnboarding();

  const [profilePhoto, setProfilePhoto] = useState<string | null>(state.formData.profilePhotoUri || null);
  const [idPhoto, setIdPhoto] = useState<string | null>(state.formData.idPhotoUri || null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return false;
      }
    }
    return true;
  };

  const pickImage = async (type: 'profile' | 'id', useCamera: boolean = false) => {
    const hasPermission = useCamera
      ? (await ImagePicker.requestCameraPermissionsAsync()).status === 'granted'
      : await requestPermissions();

    if (!hasPermission) return;

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: type === 'profile' ? [1, 1] : [4, 3],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: type === 'profile' ? [1, 1] : [4, 3],
          quality: 0.8,
        });

    if (!result.canceled && result.assets[0]) {
      if (type === 'profile') {
        setProfilePhoto(result.assets[0].uri);
        setErrors((prev) => ({ ...prev, profilePhoto: '' }));
      } else {
        setIdPhoto(result.assets[0].uri);
        setErrors((prev) => ({ ...prev, idPhoto: '' }));
      }
    }
  };

  const showImageOptions = (type: 'profile' | 'id') => {
    Alert.alert(
      type === 'profile' ? 'Profile Photo' : 'ID Document',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => pickImage(type, true) },
        { text: 'Choose from Library', onPress: () => pickImage(type, false) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleContinue = () => {
    updateFormData({
      profilePhotoUri: profilePhoto,
      idPhotoUri: idPhoto,
    });
    awardPoints(20);

    if (profilePhoto && idPhoto) {
      addAchievement({
        id: 'verified_sponsor',
        name: 'Verified Sponsor',
        description: 'Completed identity verification',
        icon: 'shield-checkmark',
        points: 25,
        trigger: 'documentUpload',
        earnedAt: new Date().toISOString(),
      });
      awardPoints(25);
    }

    nextStep();
    router.push('/onboarding/sponsor/location');
  };

  const handleBack = () => {
    updateFormData({ profilePhotoUri: profilePhoto, idPhotoUri: idPhoto });
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
            <Ionicons name="camera" size={32} color="#1E40AF" />
          </View>
          <Text style={styles.subtitle}>Profile Step 2 of 9</Text>
          <Text style={styles.title}>Photo & ID (Optional)</Text>
          <Text style={styles.description}>
            Verified profiles build trust with domestic workers
          </Text>
        </View>

        {/* Profile Photo Upload */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <TouchableOpacity
            style={[styles.uploadBox, profilePhoto && styles.uploadBoxWithImage]}
            onPress={() => showImageOptions('profile')}
          >
            {profilePhoto ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: profilePhoto }} style={styles.previewImage} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.changeText}>Change</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="person-circle-outline" size={48} color="#1E40AF" />
                <Text style={styles.uploadText}>Add profile photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ID Upload */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Emirates ID or Passport</Text>
          <TouchableOpacity
            style={[styles.uploadBox, idPhoto && styles.uploadBoxWithImage]}
            onPress={() => showImageOptions('id')}
          >
            {idPhoto ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: idPhoto }} style={styles.documentImage} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.changeText}>Change</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="card-outline" size={48} color="#1E40AF" />
                <Text style={styles.uploadText}>Add ID document</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="lock-closed" size={20} color="#059669" />
          <Text style={styles.securityText}>
            Your documents are encrypted and never shared without your consent
          </Text>
        </View>

        {/* Achievement Hint */}
        {(!profilePhoto || !idPhoto) && (
          <View style={styles.hintBox}>
            <Ionicons name="bulb-outline" size={18} color="#D97706" />
            <Text style={styles.hintText}>
              Upload both photos to earn the "Verified Sponsor" badge (+25 pts)
            </Text>
          </View>
        )}

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
          <TouchableOpacity style={styles.skipButton} onPress={handleContinue}>
            <Text style={styles.skipText}>Skip for now</Text>
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
    backgroundColor: '#1E40AF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#1E40AF',
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
  uploadSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  uploadBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 160,
  },
  uploadBoxWithImage: {
    borderColor: '#1E40AF',
    borderStyle: 'solid',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  uploadText: {
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: '500',
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  documentImage: {
    width: '100%',
    height: 180,
    resizeMode: 'contain',
    backgroundColor: '#F3F4F6',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  changeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
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
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
