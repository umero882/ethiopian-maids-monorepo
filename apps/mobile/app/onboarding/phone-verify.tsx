/**
 * Phone Verification Screen
 *
 * Collects and verifies phone number via OTP.
 * Includes country code picker with inline search.
 * Uses expo-firebase-recaptcha for native phone auth support.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from 'expo-firebase-recaptcha';
import { useOnboarding } from '../../context/OnboardingContext';
import { usePhoneAuth } from '../../hooks/usePhoneAuth';
import { ProgressBar, GamificationBadge } from '../../components/onboarding';
import { COUNTRY_CODES, DEFAULT_COUNTRY, CountryCode } from '../../data/countryCodes';
import { app, firebaseConfig } from '../../utils/firebaseConfig';

export default function PhoneVerifyScreen() {
  const { state, updateAccountData, nextStep, previousStep, getProgress, awardPoints, addAchievement } = useOnboarding();
  const { sendVerificationCode, verifyCode, isLoading, error, setRecaptchaVerifier } = usePhoneAuth();

  const [phone, setPhone] = useState(state.account.phone);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  const otpInputs = useRef<(TextInput | null)[]>([]);
  const searchInputRef = useRef<TextInput>(null);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal | null>(null);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRY_CODES;
    const query = countrySearch.toLowerCase();
    return COUNTRY_CODES.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.dial_code.includes(countrySearch) ||
      c.code.toLowerCase().includes(query)
    );
  }, [countrySearch]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // Focus search input when modal opens
  useEffect(() => {
    if (showCountryPicker) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setCountrySearch('');
    }
  }, [showCountryPicker]);

  const getFullPhoneNumber = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `${selectedCountry.dial_code}${cleanPhone}`;
  };

  const handleSendCode = async () => {
    if (!phone || phone.length < 6) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      const fullPhone = getFullPhoneNumber();

      // For native platforms, get the verifier from the reCAPTCHA modal
      let verifier = undefined;
      if (Platform.OS !== 'web' && recaptchaVerifier.current) {
        verifier = recaptchaVerifier.current;
      }

      const result = await sendVerificationCode(fullPhone, verifier as any);
      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId);
        setCodeSent(true);
        setCountdown(60);
        setRecaptchaError(null);
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification code');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send verification code');
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (newOtp.every((digit) => digit) && newOtp.join('').length === 6) {
      handleVerifyCode(newOtp.join(''));
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (!verificationId) return;

    try {
      const result = await verifyCode(verificationId, code);
      if (result.success) {
        // Update account data with full phone number
        updateAccountData({
          phone: getFullPhoneNumber(),
          phoneVerified: true,
        });

        // Award points for phone verification
        awardPoints(50);
        addAchievement({
          id: 'verified_member',
          name: 'Verified Member',
          description: 'Phone number verified',
          icon: 'shield-checkmark',
          points: 50,
          trigger: 'phoneVerified',
          earnedAt: new Date().toISOString(),
        });

        nextStep();
        router.push('/onboarding/subscription');
      } else {
        Alert.alert('Error', result.error || 'Invalid verification code');
        setOtp(['', '', '', '', '', '']);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to verify code');
    }
  };

  const handleBack = () => {
    updateAccountData({ phone: getFullPhoneNumber() });
    previousStep();
    router.back();
  };

  const handleSkip = () => {
    // Allow skipping for now (can be made mandatory later)
    updateAccountData({ phone: getFullPhoneNumber(), phoneVerified: false });
    nextStep();
    router.push('/onboarding/subscription');
  };

  const handleSelectCountry = (country: CountryCode) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
  };

  const progress = getProgress();

  const renderCountryItem = ({ item }: { item: CountryCode }) => (
    <Pressable
      style={({ pressed }) => [
        styles.countryItem,
        pressed && styles.countryItemPressed,
        item.code === selectedCountry.code && styles.countryItemSelected,
      ]}
      onPress={() => handleSelectCountry(item)}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.countryDialCode}>{item.dial_code}</Text>
      {item.code === selectedCountry.code && (
        <Ionicons name="checkmark" size={20} color="#1E40AF" />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Firebase reCAPTCHA Modal for native platforms */}
      {Platform.OS !== 'web' && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification={true}
          title="Verify you're human"
          cancelLabel="Cancel"
        />
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Progress */}
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
              <Ionicons name="call" size={32} color="#1E40AF" />
            </View>
            <Text style={styles.subtitle}>Step 4 of 4</Text>
            <Text style={styles.title}>Verify Your Phone</Text>
            <Text style={styles.description}>
              {codeSent
                ? `Enter the 6-digit code sent to ${selectedCountry.dial_code} ${phone}`
                : 'We\'ll send you a verification code to secure your account'}
            </Text>
          </View>

          {!codeSent ? (
            /* Phone Input */
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneInputContainer}>
                  {/* Country Code Picker Button */}
                  <TouchableOpacity
                    style={styles.countryCodeButton}
                    onPress={() => setShowCountryPicker(true)}
                  >
                    <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCodeText}>{selectedCountry.dial_code}</Text>
                    <Ionicons name="chevron-down" size={16} color="#6B7280" />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter phone number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={15}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Send Code Button */}
              <TouchableOpacity
                style={[styles.sendButton, isLoading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text style={styles.sendButtonText}>Sending...</Text>
                ) : (
                  <>
                    <Text style={styles.sendButtonText}>Send Code</Text>
                    <Ionicons name="send" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* OTP Input */
            <View style={styles.form}>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputs.current[index] = ref)}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                    ]}
                    value={digit}
                    onChangeText={(value) =>
                      handleOtpChange(value.replace(/[^0-9]/g, ''), index)
                    }
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Resend Code */}
              <View style={styles.resendContainer}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Resend code in {countdown}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSendCode} disabled={isLoading}>
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Change Number */}
              <TouchableOpacity
                style={styles.changeNumberButton}
                onPress={() => {
                  setCodeSent(false);
                  setOtp(['', '', '', '', '', '']);
                }}
              >
                <Ionicons name="pencil" size={16} color="#6B7280" />
                <Text style={styles.changeNumberText}>Change phone number</Text>
              </TouchableOpacity>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (isLoading || otp.some((d) => !d)) && styles.buttonDisabled,
                ]}
                onPress={() => handleVerifyCode(otp.join(''))}
                disabled={isLoading || otp.some((d) => !d)}
              >
                <Text style={styles.verifyButtonText}>
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Skip Option */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.infoText}>
              Phone verification adds an extra layer of security and earns you 50 bonus points!
            </Text>
          </View>

          {/* reCAPTCHA Banner for native platforms */}
          {Platform.OS !== 'web' && (
            <View style={styles.recaptchaBanner}>
              <FirebaseRecaptchaBanner />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search country or code..."
              value={countrySearch}
              onChangeText={setCountrySearch}
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
              returnKeyType="search"
            />
            {countrySearch.length > 0 && (
              <TouchableOpacity
                style={styles.searchClearButton}
                onPress={() => setCountrySearch('')}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Results Count */}
          {countrySearch.length > 0 && (
            <Text style={styles.resultsCount}>
              {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'} found
            </Text>
          )}

          {/* Country List */}
          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item.code}
            style={styles.countryList}
            contentContainerStyle={styles.countryListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No countries found</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
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
    paddingBottom: 40,
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
    marginBottom: 32,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
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
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countryFlag: {
    fontSize: 20,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#1F2937',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  otpInputFilled: {
    borderColor: '#1E40AF',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  countdownText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  changeNumberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  changeNumberText: {
    fontSize: 14,
    color: '#6B7280',
  },
  verifyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 14,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1F2937',
  },
  searchClearButton: {
    padding: 4,
  },
  resultsCount: {
    fontSize: 13,
    color: '#6B7280',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  countryList: {
    flex: 1,
  },
  countryListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countryItemPressed: {
    backgroundColor: '#F3F4F6',
  },
  countryItemSelected: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  countryDialCode: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    minWidth: 50,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  recaptchaBanner: {
    marginTop: 16,
    alignItems: 'center',
  },
});
