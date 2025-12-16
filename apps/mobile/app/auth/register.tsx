/**
 * Register Screen
 *
 * Receives userType from select-type screen via route params.
 */

import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

type UserType = 'sponsor' | 'maid' | 'agency';

const userTypeLabels: Record<UserType, string> = {
  sponsor: 'Family/Sponsor',
  maid: 'Domestic Worker',
  agency: 'Recruitment Agency',
};

// GCC and common countries for Ethiopian workers
const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'OTHER', name: 'Other', flag: '🌍' },
];

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ userType: UserType }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<typeof COUNTRIES[0] | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>((params.userType as UserType) || 'sponsor');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleCountrySelect = (countryItem: typeof COUNTRIES[0]) => {
    setSelectedCountry(countryItem);
    setCountry(countryItem.name);
    setShowCountryModal(false);
  };

  const { signUp, isLoading } = useAuth();

  // Redirect to select-type if no userType param provided
  useEffect(() => {
    if (!params.userType) {
      router.replace('/auth/select-type');
    }
  }, [params.userType]);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    const result = await signUp(email, password, {
      name,
      user_type: userType,
      phone,
      country,
    });

    if (result.success) {
      // Route to the appropriate dashboard based on user type
      switch (userType) {
        case 'maid':
          router.replace('/maid/dashboard');
          break;
        case 'agency':
          router.replace('/agency/dashboard');
          break;
        case 'sponsor':
        default:
          router.replace('/sponsor/dashboard');
          break;
      }
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Ionicons name="person-add" size={64} color="#1E40AF" />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Register as {userTypeLabels[userType]}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Selected User Type Display */}
          <TouchableOpacity
            style={styles.selectedTypeContainer}
            onPress={() => router.back()}
          >
            <View style={styles.selectedTypeContent}>
              <Ionicons
                name={
                  userType === 'sponsor'
                    ? 'person-outline'
                    : userType === 'maid'
                    ? 'briefcase-outline'
                    : 'business-outline'
                }
                size={20}
                color="#1E40AF"
              />
              <Text style={styles.selectedTypeText}>
                {userTypeLabels[userType]}
              </Text>
            </View>
            <Text style={styles.changeTypeText}>Change</Text>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number (optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Country Dropdown */}
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowCountryModal(true)}
          >
            <Ionicons name="globe-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <View style={styles.dropdownContent}>
              {selectedCountry ? (
                <Text style={styles.dropdownText}>
                  {selectedCountry.flag} {selectedCountry.name}
                </Text>
              ) : (
                <Text style={styles.dropdownPlaceholder}>Select Country (optional)</Text>
              )}
            </View>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setShowCountryModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry?.code === item.code && styles.countryItemSelected,
                  ]}
                  onPress={() => handleCountrySelect(item)}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.countryName,
                      selectedCountry?.code === item.code && styles.countryNameSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedCountry?.code === item.code && (
                    <Ionicons name="checkmark" size={20} color="#1E40AF" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    padding: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
  selectedTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E40AF',
    padding: 14,
    marginBottom: 20,
  },
  selectedTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  changeTypeText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  button: {
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  linkText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Dropdown styles
  dropdownContent: {
    flex: 1,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countryItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  countryNameSelected: {
    fontWeight: '600',
    color: '#1E40AF',
  },
});
