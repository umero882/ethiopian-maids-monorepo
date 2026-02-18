/**
 * Maid Biometric & Document Screen
 *
 * Captures photo and passport/ID document.
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

interface DocumentUpload {
  uri: string;
  type: 'photo' | 'passport';
  uploaded: boolean;
}

export default function MaidBiometricDocScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints, addAchievement } = useOnboarding();

  const [profilePhoto, setProfilePhoto] = useState<DocumentUpload | null>(
    state.formData.profilePhotoUri ? { uri: state.formData.profilePhotoUri, type: 'photo', uploaded: true } : null
  );
  const [passportPhoto, setPassportPhoto] = useState<DocumentUpload | null>(
    state.formData.passportPhotoUri ? { uri: state.formData.passportPhotoUri, type: 'passport', uploaded: true } : null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = getProgress();

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload documents.'
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
          'Please allow camera access to take photos.'
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async (type: 'photo' | 'passport', useCamera: boolean = false) => {
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
        aspect: type === 'photo' ? [3, 4] : [4, 3],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'photo' ? [3, 4] : [4, 3],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      const upload: DocumentUpload = {
        uri: result.assets[0].uri,
        type,
        uploaded: true,
      };

      if (type === 'photo') {
        setProfilePhoto(upload);
        setErrors((prev) => ({ ...prev, profilePhoto: '' }));
      } else {
        setPassportPhoto(upload);
        setErrors((prev) => ({ ...prev, passportPhoto: '' }));
      }
    }
  };

  const showImageOptions = (type: 'photo' | 'passport') => {
    Alert.alert(
      type === 'photo' ? 'Profile Photo' : 'Document Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => pickImage(type, true) },
        { text: 'Choose from Library', onPress: () => pickImage(type, false) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profilePhoto) {
      newErrors.profilePhoto = 'Profile photo is required';
    }

    if (!passportPhoto) {
      newErrors.passportPhoto = 'Passport/ID photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({
        profilePhotoUri: profilePhoto?.uri,
        passportPhotoUri: passportPhoto?.uri,
      });
      awardPoints(25);

      // Award verified profile achievement
      addAchievement({
        id: 'verified_profile',
        name: 'Verified Profile',
        description: 'Uploaded profile photo and documents',
        icon: 'shield-checkmark',
        points: 30,
        trigger: 'documentUpload',
        earnedAt: new Date().toISOString(),
      });

      nextStep();
      router.push('/onboarding/maid/address');
    }
  };

  const handleBack = () => {
    updateFormData({
      profilePhotoUri: profilePhoto?.uri,
      passportPhotoUri: passportPhoto?.uri,
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
            <Ionicons name="camera" size={32} color="#9333EA" />
          </View>
          <Text style={styles.subtitle}>Profile Step 2 of 10</Text>
          <Text style={styles.title}>Photo & Documents</Text>
          <Text style={styles.description}>
            Upload a clear photo and your passport or ID for verification
          </Text>
        </View>

        {/* Profile Photo Upload */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>
            Profile Photo <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionHint}>
            A clear, front-facing photo helps families trust your profile
          </Text>

          <TouchableOpacity
            style={[
              styles.uploadBox,
              profilePhoto && styles.uploadBoxWithImage,
              errors.profilePhoto && styles.uploadBoxError,
            ]}
            onPress={() => showImageOptions('photo')}
          >
            {profilePhoto ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: profilePhoto.uri }} style={styles.previewImage} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.changeText}>Change Photo</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadIconContainer}>
                  <Ionicons name="person-circle-outline" size={48} color="#9333EA" />
                </View>
                <Text style={styles.uploadText}>Tap to upload profile photo</Text>
                <Text style={styles.uploadSubtext}>JPG, PNG up to 5MB</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.profilePhoto && (
            <Text style={styles.errorText}>{errors.profilePhoto}</Text>
          )}
        </View>

        {/* Passport/ID Upload */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>
            Passport or ID <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionHint}>
            Required for identity verification. Your document is kept secure.
          </Text>

          <TouchableOpacity
            style={[
              styles.uploadBox,
              passportPhoto && styles.uploadBoxWithImage,
              errors.passportPhoto && styles.uploadBoxError,
            ]}
            onPress={() => showImageOptions('passport')}
          >
            {passportPhoto ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: passportPhoto.uri }} style={styles.documentImage} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.changeText}>Change Document</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadIconContainer}>
                  <Ionicons name="card-outline" size={48} color="#9333EA" />
                </View>
                <Text style={styles.uploadText}>Tap to upload passport/ID</Text>
                <Text style={styles.uploadSubtext}>Clear photo of the main page</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.passportPhoto && (
            <Text style={styles.errorText}>{errors.passportPhoto}</Text>
          )}
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Your documents are secure</Text>
            <Text style={styles.securityText}>
              We use encryption to protect your personal information and never share it without your consent.
            </Text>
          </View>
        </View>

        {/* Points Info */}
        <View style={styles.pointsInfo}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>+25 points + "Verified Profile" achievement</Text>
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
  uploadSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  required: {
    color: '#DC2626',
  },
  sectionHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  uploadBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 180,
  },
  uploadBoxWithImage: {
    borderColor: '#9333EA',
    borderStyle: 'solid',
  },
  uploadBoxError: {
    borderColor: '#DC2626',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9333EA10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  imageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  documentImage: {
    width: '100%',
    height: 200,
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
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 8,
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  securityText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
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
