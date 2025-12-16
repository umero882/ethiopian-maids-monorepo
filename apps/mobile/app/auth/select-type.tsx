/**
 * User Type Selection Screen
 *
 * Shown when user clicks "Sign Up" - allows them to select their account type
 * before proceeding to the registration form.
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type UserType = 'sponsor' | 'maid' | 'agency';

interface UserTypeOption {
  type: UserType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: [string, string];
}

const userTypes: UserTypeOption[] = [
  {
    type: 'sponsor',
    title: 'Family/Sponsor',
    description: 'Looking to hire domestic workers',
    icon: 'person-outline',
    gradientColors: ['#3B82F6', '#06B6D4'],
  },
  {
    type: 'maid',
    title: 'Domestic Worker',
    description: 'Seeking employment opportunities',
    icon: 'briefcase-outline',
    gradientColors: ['#8B5CF6', '#EC4899'],
  },
  {
    type: 'agency',
    title: 'Recruitment Agency',
    description: 'Connecting workers with families',
    icon: 'business-outline',
    gradientColors: ['#10B981', '#059669'],
  },
];

export default function SelectTypeScreen() {
  const handleSelectType = (type: UserType) => {
    router.push({
      pathname: '/auth/register',
      params: { userType: type },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Ionicons name="people" size={48} color="#1E40AF" />
        </View>
        <Text style={styles.title}>Join Ethiopian Maids</Text>
        <Text style={styles.subtitle}>Choose your account type to get started</Text>
      </View>

      <View style={styles.optionsContainer}>
        {userTypes.map((option) => (
          <TouchableOpacity
            key={option.type}
            style={styles.optionCard}
            onPress={() => handleSelectType(option.type)}
            activeOpacity={0.8}
          >
            <View style={styles.optionContent}>
              <View style={[styles.iconContainer, { backgroundColor: option.gradientColors[0] + '20' }]}>
                <Ionicons
                  name={option.icon}
                  size={28}
                  color={option.gradientColors[0]}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/auth/login" asChild>
          <TouchableOpacity>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    padding: 8,
    zIndex: 1,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingBottom: 40,
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
});
