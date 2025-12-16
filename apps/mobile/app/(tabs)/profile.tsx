/**
 * Profile Screen
 *
 * Shows role-based dashboard for authenticated users.
 * For sponsors: Sponsor dashboard with bookings, favorites, etc.
 * For maids: Maid dashboard with applications, profile, etc.
 * For agencies: Agency dashboard with maids management, jobs, etc.
 * For guests: Sign in/Sign up options.
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../hooks/useAuth';
import { SponsorDashboard, MaidDashboard, AgencyDashboard } from '../../components/dashboard';

// Key to track if user just signed out (to skip biometric auto-prompt)
const JUST_SIGNED_OUT_KEY = 'just_signed_out';

type UserType = 'sponsor' | 'maid' | 'agency';

export default function ProfileScreen() {
  const { user, userType, isAuthenticated, isLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    // Set flag to skip biometric auto-prompt on login page
    await SecureStore.setItemAsync(JUST_SIGNED_OUT_KEY, 'true');
    await signOut();
    router.replace('/auth/login');
  };

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  const handleSignUp = () => {
    router.push('/auth/select-type');
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show role-based dashboard for authenticated users
  if (isAuthenticated && user) {
    switch (userType) {
      case 'sponsor':
        return <SponsorDashboard user={user} onSignOut={handleSignOut} />;
      case 'maid':
        return <MaidDashboard user={user} onSignOut={handleSignOut} />;
      case 'agency':
        return <AgencyDashboard user={user} onSignOut={handleSignOut} />;
      default:
        // Show default sponsor dashboard if type is unknown
        // This handles cases where user_type wasn't set during registration
        return <SponsorDashboard user={user} onSignOut={handleSignOut} />;
    }
  }

  // Guest View - Not authenticated
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.guestAvatar}>
          <Ionicons name="person-outline" size={40} color="#9CA3AF" />
        </View>
        <Text style={styles.guestTitle}>Welcome to Ethiopian Maids</Text>
        <Text style={styles.guestSubtitle}>
          Sign in to access your personalized dashboard
        </Text>
      </View>

      <View style={styles.authPrompt}>
        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Ionicons name="log-in-outline" size={22} color="#fff" />
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Ionicons name="person-add-outline" size={22} color="#1E40AF" />
          <Text style={styles.signUpButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresSectionTitle}>Why Join Us?</Text>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconContainer, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="search" size={24} color="#3B82F6" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Find Domestic Workers</Text>
            <Text style={styles.featureDescription}>
              Browse verified maids and agencies in your area
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconContainer, { backgroundColor: '#F5F3FF' }]}>
            <Ionicons name="briefcase" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Post & Find Jobs</Text>
            <Text style={styles.featureDescription}>
              Post job listings or find employment opportunities
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconContainer, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Verified Profiles</Text>
            <Text style={styles.featureDescription}>
              All profiles are verified for your safety
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconContainer, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="chatbubbles" size={24} color="#F59E0B" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Direct Communication</Text>
            <Text style={styles.featureDescription}>
              Message directly with potential hires or employers
            </Text>
          </View>
        </View>
      </View>

      {/* Guest Settings */}
      <View style={styles.guestMenuSection}>
        <Text style={styles.guestMenuTitle}>Settings</Text>
        {[
          { icon: 'help-circle-outline', title: 'Help & Support', route: '/profile/help' },
          { icon: 'document-text-outline', title: 'Terms of Service', route: '/profile/terms' },
          { icon: 'shield-outline', title: 'Privacy Policy', route: '/profile/privacy' },
          { icon: 'analytics-outline', title: 'Cookie Policy', route: '/profile/cookies' },
          { icon: 'information-circle-outline', title: 'About', route: '/profile/about' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.guestMenuItem}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.guestMenuItemLeft}>
              <Ionicons name={item.icon as any} size={22} color="#6B7280" />
              <Text style={styles.guestMenuItemText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.version}>Ethiopian Maids v1.0.0</Text>
    </ScrollView>
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
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  guestAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  authPrompt: {
    padding: 20,
    gap: 12,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1E40AF',
    gap: 10,
  },
  signUpButtonText: {
    color: '#1E40AF',
    fontSize: 17,
    fontWeight: '600',
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  featuresSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  guestMenuSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  guestMenuTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  guestMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  guestMenuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guestMenuItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  version: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    paddingVertical: 24,
  },
});
