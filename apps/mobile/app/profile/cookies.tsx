/**
 * Cookie Policy Screen
 *
 * Comprehensive Cookie Policy for Ethiopian Maids mobile app.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Switch } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Section {
  id: string;
  title: string;
  content: string | string[];
}

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  icon: string;
  color: string;
}

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'essential',
    name: 'Essential Cookies',
    description: 'Required for basic platform functionality. Cannot be disabled.',
    required: true,
    icon: 'lock-closed',
    color: '#EF4444',
  },
  {
    id: 'functional',
    name: 'Functional Cookies',
    description: 'Remember your preferences and settings for a better experience.',
    required: false,
    icon: 'settings',
    color: '#3B82F6',
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    description: 'Help us understand how users interact with our platform.',
    required: false,
    icon: 'analytics',
    color: '#10B981',
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description: 'Used to deliver personalized advertisements.',
    required: false,
    icon: 'megaphone',
    color: '#F59E0B',
  },
];

const SECTIONS: Section[] = [
  {
    id: '1',
    title: '1. What Are Cookies?',
    content: 'Cookies are small text files stored on your device when you visit websites or use applications. They help websites remember your preferences, keep you logged in, and improve your overall experience.\n\nSimilar technologies include web beacons, pixels, and local storage, which we collectively refer to as "cookies" in this policy.',
  },
  {
    id: '2',
    title: '2. Essential Cookies',
    content: [
      'These cookies are necessary for the Platform to function and cannot be disabled.',
      '',
      '• auth_token - Maintains your login session (expires: session)',
      '• csrf_token - Protects against cross-site request forgery (expires: session)',
      '• user_preferences - Stores language and region settings (expires: 1 year)',
      '• cookie_consent - Records your cookie preferences (expires: 1 year)',
    ],
  },
  {
    id: '3',
    title: '3. Functional Cookies',
    content: [
      'These cookies enhance your experience by remembering your preferences.',
      '',
      '• theme_preference - Remembers dark/light mode setting (expires: 1 year)',
      '• notification_settings - Stores notification preferences (expires: 1 year)',
      '• recent_searches - Saves your recent search queries (expires: 30 days)',
      '• saved_filters - Remembers your filter preferences (expires: 90 days)',
    ],
  },
  {
    id: '4',
    title: '4. Analytics Cookies',
    content: [
      'These cookies help us understand how users interact with our Platform.',
      '',
      '• _ga, _gid - Google Analytics tracking (expires: 2 years / 24 hours)',
      '• _fbp - Facebook Pixel for conversion tracking (expires: 90 days)',
      '• mixpanel_id - Mixpanel user behavior analytics (expires: 1 year)',
      '',
      'Analytics data is anonymized and used only to improve our services.',
    ],
  },
  {
    id: '5',
    title: '5. Marketing Cookies',
    content: [
      'These cookies are used for advertising and remarketing purposes.',
      '',
      '• _gcl_au - Google Ads conversion tracking (expires: 90 days)',
      '• fr - Facebook advertising cookie (expires: 90 days)',
      '',
      'You can opt out of personalized advertising through your device settings or the Digital Advertising Alliance.',
    ],
  },
  {
    id: '6',
    title: '6. Third-Party Cookies',
    content: [
      'We work with third-party services that may set cookies:',
      '',
      '• Google (Analytics, Ads, Maps)',
      '• Facebook/Meta (Pixel, Login)',
      '• Stripe (Payment processing)',
      '• Intercom (Customer support)',
      '• Cloudflare (Security, CDN)',
      '',
      'Each third party has their own privacy and cookie policies.',
    ],
  },
  {
    id: '7',
    title: '7. Cookie Duration',
    content: [
      'Session Cookies: Deleted when you close the app or browser',
      '',
      'Persistent Cookies: Remain for a set period:',
      '• Short-term: 24 hours to 30 days',
      '• Medium-term: 30 days to 1 year',
      '• Long-term: 1 to 2 years',
      '',
      'You can clear cookies at any time through your device settings.',
    ],
  },
  {
    id: '8',
    title: '8. Managing Cookies',
    content: [
      'You can control cookies through:',
      '',
      '• App Settings: Toggle cookie preferences in the app',
      '• Device Settings: Clear app data or cookies',
      '• Browser Settings: Block or delete cookies',
      '',
      'Note: Disabling certain cookies may affect Platform functionality.',
    ],
  },
  {
    id: '9',
    title: '9. Do Not Track',
    content: 'Some browsers send "Do Not Track" signals. We currently do not respond to DNT signals, but we respect your cookie preferences set through our consent mechanism.\n\nYou can opt out of tracking by adjusting your cookie settings within the app.',
  },
  {
    id: '10',
    title: '10. Mobile-Specific Tracking',
    content: [
      'On mobile devices, we may use:',
      '',
      '• Advertising ID (IDFA/GAID) for analytics',
      '• Device fingerprinting for fraud prevention',
      '• Push notification tokens for messaging',
      '',
      'You can reset your advertising ID or limit ad tracking in your device settings.',
    ],
  },
  {
    id: '11',
    title: '11. Updates to This Policy',
    content: 'We may update this Cookie Policy periodically. Changes will be posted on this page with a new "Last Updated" date.\n\nSignificant changes will be communicated through app notifications or email.',
  },
  {
    id: '12',
    title: '12. Contact Us',
    content: 'For questions about our cookie practices:\n\nEthiopian Maids\nEmail: privacy@ethiopianmaids.com\nSupport: support@ethiopianmaids.com\nPhone: +1 717 699 8295',
  },
];

export default function CookiesScreen() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['1']);
  const [cookiePreferences, setCookiePreferences] = useState({
    functional: true,
    analytics: true,
    marketing: false,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleCookiePreference = (id: string) => {
    if (id === 'essential') return; // Cannot toggle essential
    setCookiePreferences((prev) => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  const openEmail = () => {
    Linking.openURL('mailto:privacy@ethiopianmaids.com');
  };

  const openPrivacyPolicy = () => {
    router.push('/profile/privacy');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Cookie Policy' }} />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="analytics" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>Cookie Policy</Text>
          <Text style={styles.lastUpdated}>Last updated: January 2025</Text>
        </View>

        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            We use cookies and similar technologies to provide, protect, and improve our services.
            This policy explains what cookies are and how we use them.
          </Text>
        </View>

        {/* Cookie Preferences */}
        <View style={styles.preferencesSection}>
          <Text style={styles.preferencesTitle}>Your Cookie Preferences</Text>
          <Text style={styles.preferencesSubtitle}>
            Manage which cookies you allow
          </Text>
          {COOKIE_CATEGORIES.map((category) => (
            <View key={category.id} style={styles.preferenceCard}>
              <View style={styles.preferenceHeader}>
                <View style={[styles.preferenceIcon, { backgroundColor: `${category.color}20` }]}>
                  <Ionicons name={category.icon as any} size={20} color={category.color} />
                </View>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceName}>{category.name}</Text>
                  <Text style={styles.preferenceDescription}>{category.description}</Text>
                </View>
                <Switch
                  value={category.required || cookiePreferences[category.id as keyof typeof cookiePreferences]}
                  onValueChange={() => toggleCookiePreference(category.id)}
                  disabled={category.required}
                  trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                  thumbColor={category.required ? '#9CA3AF' : '#fff'}
                />
              </View>
              {category.required && (
                <View style={styles.requiredBadge}>
                  <Ionicons name="lock-closed" size={12} color="#6B7280" />
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Sections */}
        <View style={styles.content}>
          <Text style={styles.contentTitle}>Detailed Cookie Information</Text>
          {SECTIONS.map((section) => (
            <View key={section.id} style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Ionicons
                  name={expandedSections.includes(section.id) ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
              {expandedSections.includes(section.id) && (
                <View style={styles.sectionContent}>
                  {Array.isArray(section.content) ? (
                    section.content.map((item, index) => (
                      <Text key={index} style={[styles.text, item === '' && styles.spacer]}>
                        {item}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.text}>{section.content}</Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Related Links */}
        <View style={styles.relatedCard}>
          <Text style={styles.relatedTitle}>Related Policies</Text>
          <TouchableOpacity style={styles.relatedLink} onPress={openPrivacyPolicy}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#7C3AED" />
            <Text style={styles.relatedLinkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.relatedLink} onPress={() => router.push('/profile/terms')}>
            <Ionicons name="document-text-outline" size={20} color="#7C3AED" />
            <Text style={styles.relatedLinkText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Contact Card */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Questions about cookies?</Text>
          <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
            <Ionicons name="mail-outline" size={20} color="#7C3AED" />
            <Text style={styles.contactButtonText}>privacy@ethiopianmaids.com</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Ethiopian Maids. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#059669',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  introCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
  },
  preferencesSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  preferencesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  preferenceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 12,
  },
  preferenceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  requiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 4,
  },
  requiredText: {
    fontSize: 12,
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    paddingRight: 8,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  text: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 4,
  },
  spacer: {
    height: 8,
  },
  relatedCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  relatedLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  relatedLinkText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  contactCard: {
    backgroundColor: '#ECFDF5',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
