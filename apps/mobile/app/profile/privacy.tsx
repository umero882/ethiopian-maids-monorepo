/**
 * Privacy Policy Screen
 *
 * Comprehensive GDPR-compliant Privacy Policy for Ethiopian Maids mobile app.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Section {
  id: string;
  title: string;
  content: string | string[];
}

const SECTIONS: Section[] = [
  {
    id: '1',
    title: '1. Introduction',
    content: 'Ethiopian Maids ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application, website, and related services (collectively, the "Platform").\n\nBy using our Platform, you consent to the data practices described in this policy. If you do not agree with these practices, please do not use our Platform.',
  },
  {
    id: '2',
    title: '2. Information We Collect',
    content: [
      'Personal Information:',
      '• Full name and contact details (email, phone number, address)',
      '• Date of birth and nationality',
      '• Government-issued ID and passport information',
      '• Profile photos and videos',
      '• Employment history and skills',
      '• Education and certifications',
      '• Bank account details for payments',
      '',
      'Usage Information:',
      '• Device information (type, OS, unique identifiers)',
      '• IP address and location data',
      '• App usage patterns and preferences',
      '• Search queries and browsing history',
      '• Communication records within the Platform',
    ],
  },
  {
    id: '3',
    title: '3. How We Collect Information',
    content: [
      'Direct Collection:',
      '• Account registration forms',
      '• Profile creation and updates',
      '• Job applications and bookings',
      '• Customer support interactions',
      '• Surveys and feedback forms',
      '',
      'Automatic Collection:',
      '• Cookies and tracking technologies',
      '• Analytics tools',
      '• Server logs',
      '',
      'Third-Party Sources:',
      '• Identity verification services',
      '• Background check providers',
      '• Social media platforms (if connected)',
      '• Payment processors',
    ],
  },
  {
    id: '4',
    title: '4. How We Use Your Information',
    content: [
      '• Provide and improve our services',
      '• Process bookings and payments',
      '• Verify user identities and documents',
      '• Facilitate communication between users',
      '• Send notifications and updates',
      '• Personalize your experience',
      '• Analyze usage patterns and trends',
      '• Prevent fraud and ensure security',
      '• Comply with legal obligations',
      '• Respond to support requests',
      '• Send marketing communications (with consent)',
    ],
  },
  {
    id: '5',
    title: '5. Information Sharing & Disclosure',
    content: [
      'We may share your information with:',
      '',
      '• Other Users: Profile information is shared to facilitate connections between sponsors and maids.',
      '• Service Providers: Third parties who assist in operating our Platform (hosting, analytics, payment processing).',
      '• Agencies: Licensed recruitment agencies partnering with Ethiopian Maids.',
      '• Legal Authorities: When required by law or to protect our rights.',
      '• Business Transfers: In connection with mergers, acquisitions, or asset sales.',
      '',
      'We do NOT sell your personal information to third parties for marketing purposes.',
    ],
  },
  {
    id: '6',
    title: '6. Data Retention',
    content: [
      'We retain your data for different periods based on type:',
      '',
      '• Active Account Data: Throughout your account\'s active period',
      '• Transaction Records: 7 years (legal requirements)',
      '• Communication Logs: 3 years after last interaction',
      '• Identity Documents: 5 years after verification',
      '• Usage Analytics: 2 years',
      '• Marketing Preferences: Until you opt out',
      '',
      'After the retention period, data is securely deleted or anonymized.',
    ],
  },
  {
    id: '7',
    title: '7. Data Security',
    content: 'We implement comprehensive security measures to protect your information:\n\n• SSL/TLS encryption for data in transit\n• AES-256 encryption for data at rest\n• Regular security audits and penetration testing\n• Access controls and authentication\n• Employee security training\n• Incident response procedures\n\nWhile we strive to protect your data, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.',
  },
  {
    id: '8',
    title: '8. International Data Transfers',
    content: 'Your information may be transferred to and processed in countries other than your country of residence, including Ethiopia, UAE, and other GCC countries.\n\nWe ensure appropriate safeguards are in place for such transfers, including Standard Contractual Clauses approved by relevant authorities and compliance with local data protection laws.',
  },
  {
    id: '9',
    title: '9. Your Rights',
    content: [
      'You have the following rights regarding your data:',
      '',
      '• Access: Request a copy of your personal data',
      '• Correction: Update inaccurate or incomplete data',
      '• Deletion: Request removal of your data ("right to be forgotten")',
      '• Portability: Receive your data in a portable format',
      '• Restriction: Limit how we process your data',
      '• Objection: Object to certain processing activities',
      '• Withdraw Consent: Revoke previously given consent',
      '',
      'To exercise these rights, contact us at privacy@ethiopianmaids.com or through your account settings.',
    ],
  },
  {
    id: '10',
    title: '10. Children\'s Privacy',
    content: 'Our Platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18.\n\nIf we discover that we have collected information from a child under 18, we will promptly delete it. If you believe we have information about a child, please contact us immediately.',
  },
  {
    id: '11',
    title: '11. Third-Party Links',
    content: 'Our Platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites.\n\nWe encourage you to read the privacy policies of any third-party sites you visit. Our Privacy Policy applies only to our Platform.',
  },
  {
    id: '12',
    title: '12. Cookies & Tracking',
    content: 'We use cookies and similar technologies to enhance your experience. For detailed information about our cookie practices, please refer to our Cookie Policy.\n\nYou can manage cookie preferences through your device settings or our cookie consent tool.',
  },
  {
    id: '13',
    title: '13. GDPR Compliance',
    content: 'For users in the European Economic Area (EEA), we comply with the General Data Protection Regulation (GDPR).\n\nLegal bases for processing include: consent, contract performance, legal obligations, and legitimate interests.\n\nYou may lodge a complaint with your local data protection authority if you believe your rights have been violated.',
  },
  {
    id: '14',
    title: '14. Changes to This Policy',
    content: 'We may update this Privacy Policy periodically. Material changes will be notified via email or Platform notification.\n\nContinued use after changes constitutes acceptance. We encourage you to review this policy regularly.',
  },
  {
    id: '15',
    title: '15. Contact Us',
    content: 'For privacy-related questions or to exercise your rights:\n\nData Protection Officer\nEthiopian Maids\nEmail: privacy@ethiopianmaids.com\nSupport: support@ethiopianmaids.com\nPhone: +1 717 699 8295\n\nWe aim to respond to all requests within 30 days.',
  },
];

export default function PrivacyScreen() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['1']);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const openEmail = () => {
    Linking.openURL('mailto:privacy@ethiopianmaids.com');
  };

  const openCookiePolicy = () => {
    router.push('/profile/cookies');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last updated: January 2025</Text>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.badgeText}>GDPR Compliant</Text>
          </View>
        </View>

        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Your privacy is important to us. This policy explains how Ethiopian Maids
            collects, uses, and protects your personal information.
          </Text>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <Text style={styles.quickLinksTitle}>Quick Actions</Text>
          <View style={styles.quickLinksRow}>
            <TouchableOpacity style={styles.quickLink} onPress={openCookiePolicy}>
              <Ionicons name="analytics-outline" size={20} color="#7C3AED" />
              <Text style={styles.quickLinkText}>Cookie Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink} onPress={openEmail}>
              <Ionicons name="mail-outline" size={20} color="#7C3AED" />
              <Text style={styles.quickLinkText}>Contact DPO</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sections */}
        <View style={styles.content}>
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

        {/* Your Rights Card */}
        <View style={styles.rightsCard}>
          <Ionicons name="person-circle-outline" size={32} color="#1E40AF" />
          <Text style={styles.rightsTitle}>Your Data Rights</Text>
          <Text style={styles.rightsText}>
            You have the right to access, correct, delete, or export your personal data at any time.
          </Text>
          <TouchableOpacity
            style={styles.rightsButton}
            onPress={() => router.push('/sponsor/settings')}
          >
            <Text style={styles.rightsButtonText}>Manage Your Data</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Contact Card */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Questions about your privacy?</Text>
          <Text style={styles.contactSubtitle}>
            Contact our Data Protection Officer
          </Text>
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
    backgroundColor: '#1E40AF',
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
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  quickLinks: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  quickLinksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  content: {
    padding: 16,
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
  rightsCard: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  rightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
    marginTop: 8,
    marginBottom: 8,
  },
  rightsText: {
    fontSize: 14,
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  rightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  rightsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  contactCard: {
    backgroundColor: '#EDE9FE',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#7C3AED',
    marginBottom: 16,
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
