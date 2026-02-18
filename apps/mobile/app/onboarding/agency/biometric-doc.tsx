/**
 * Agency Biometric & Document Screen
 *
 * Captures company logo and business documents.
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

export default function AgencyBiometricDocScreen() {
  const { state, updateFormData, nextStep, previousStep, getProgress, awardPoints, addAchievement } = useOnboarding();

  const [logo, setLogo] = useState<string | null>(state.formData.logoUri || null);
  const [license, setLicense] = useState<string | null>(state.formData.licenseDocUri || null);
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

  const pickImage = async (type: 'logo' | 'license') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'logo') {
        setLogo(result.assets[0].uri);
      } else {
        setLicense(result.assets[0].uri);
      }
    }
  };

  const handleContinue = () => {
    updateFormData({
      logoUri: logo,
      licenseDocUri: license,
    });
    awardPoints(25);

    if (logo && license) {
      addAchievement({
        id: 'verified_agency',
        name: 'Verified Agency',
        description: 'Uploaded business documents',
        icon: 'shield-checkmark',
        points: 30,
        trigger: 'documentUpload',
        earnedAt: new Date().toISOString(),
      });
      awardPoints(30);
    }

    nextStep();
    router.push('/onboarding/agency/coverage');
  };

  const handleBack = () => {
    updateFormData({ logoUri: logo, licenseDocUri: license });
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
            <Ionicons name="image" size={32} color="#059669" />
          </View>
          <Text style={styles.subtitle}>Profile Step 2 of 9</Text>
          <Text style={styles.title}>Company Logo & Docs</Text>
          <Text style={styles.description}>
            Upload your company logo and business license
          </Text>
        </View>

        {/* Logo Upload */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Company Logo</Text>
          <TouchableOpacity
            style={[styles.uploadBox, logo && styles.uploadBoxWithImage]}
            onPress={() => pickImage('logo')}
          >
            {logo ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: logo }} style={styles.logoImage} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.changeText}>Change</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="image-outline" size={48} color="#059669" />
                <Text style={styles.uploadText}>Upload company logo</Text>
                <Text style={styles.uploadHint}>Square image recommended</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* License Upload */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Business License</Text>
          <TouchableOpacity
            style={[styles.uploadBox, license && styles.uploadBoxWithImage]}
            onPress={() => pickImage('license')}
          >
            {license ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: license }} style={styles.documentImage} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.changeText}>Change</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="document-outline" size={48} color="#059669" />
                <Text style={styles.uploadText}>Upload business license</Text>
                <Text style={styles.uploadHint}>Clear photo of your license</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="lock-closed" size={20} color="#059669" />
          <Text style={styles.securityText}>
            Documents are securely stored and used only for verification
          </Text>
        </View>

        {/* Achievement Hint */}
        {(!logo || !license) && (
          <View style={styles.hintBox}>
            <Ionicons name="bulb-outline" size={18} color="#D97706" />
            <Text style={styles.hintText}>
              Upload both to earn the "Verified Agency" badge (+30 pts)
            </Text>
          </View>
        )}

        {/* Points Info */}
        <View style={styles.pointsInfo}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.pointsText}>+25 points for completing this step</Text>
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
    backgroundColor: '#05966915',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#059669',
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
    minHeight: 150,
  },
  uploadBoxWithImage: {
    borderColor: '#059669',
    borderStyle: 'solid',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  uploadText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: 180,
    resizeMode: 'contain',
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#059669',
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
