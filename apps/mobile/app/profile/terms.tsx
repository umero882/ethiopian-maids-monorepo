/**
 * Terms of Service Screen
 *
 * Comprehensive Terms of Service for Ethiopian Maids mobile app.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Section {
  id: string;
  title: string;
  content: string | string[];
}

const SECTIONS: Section[] = [
  {
    id: '1',
    title: '1. Introduction & Acceptance',
    content: 'Welcome to Ethiopian Maids. By accessing or using our platform, mobile application, or any related services (collectively, the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Platform.\n\nThese Terms constitute a legally binding agreement between you and Ethiopian Maids. We reserve the right to modify these Terms at any time, and such modifications will be effective immediately upon posting. Your continued use of the Platform following any changes constitutes acceptance of those changes.',
  },
  {
    id: '2',
    title: '2. Definitions',
    content: [
      '• "Platform" refers to the Ethiopian Maids website, mobile applications, and all related services.',
      '• "User" refers to any individual or entity that accesses or uses the Platform.',
      '• "Sponsor" refers to employers or families seeking domestic workers.',
      '• "Maid" refers to domestic workers offering their services through the Platform.',
      '• "Agency" refers to recruitment agencies partnering with Ethiopian Maids.',
      '• "Services" refers to all features and functionalities provided through the Platform.',
      '• "Content" refers to all text, images, videos, and other materials posted on the Platform.',
    ],
  },
  {
    id: '3',
    title: '3. Account Registration & Eligibility',
    content: 'To use certain features of our Platform, you must register for an account. You must be at least 18 years old to create an account. By registering, you represent that all information you provide is accurate, current, and complete.\n\nYou are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.',
  },
  {
    id: '4',
    title: '4. User Responsibilities',
    content: [
      'All Users must:',
      '• Provide accurate and truthful information',
      '• Comply with all applicable laws and regulations',
      '• Respect the rights of other users',
      '• Not engage in fraudulent or deceptive practices',
      '• Not harass, threaten, or discriminate against others',
      '• Not post inappropriate or offensive content',
      '',
      'Sponsors must:',
      '• Provide safe working conditions',
      '• Pay agreed wages on time',
      '• Respect workers\' rights and dignity',
      '• Comply with labor laws in their jurisdiction',
      '',
      'Maids must:',
      '• Provide accurate skill and experience information',
      '• Maintain valid documentation',
      '• Perform duties professionally',
      '• Communicate schedule conflicts promptly',
    ],
  },
  {
    id: '5',
    title: '5. Platform Services',
    content: 'Ethiopian Maids provides a platform to facilitate connections between domestic workers and employers. Our services include profile creation and management, search and matching features, secure messaging, document verification, booking management, and payment processing.\n\nWe act solely as an intermediary and are not a party to any employment agreement between users. We do not guarantee employment outcomes or the conduct of any user.',
  },
  {
    id: '6',
    title: '6. Payment Terms & Fees',
    content: 'Certain features may require payment of subscription fees or service charges. All fees are displayed in your local currency where available. Payment is processed securely through our third-party payment providers.\n\nSubscription fees are billed in advance on a recurring basis. You authorize us to charge your payment method automatically for each billing period. Refunds are subject to our refund policy.',
  },
  {
    id: '7',
    title: '7. Booking & Placement Process',
    content: 'The booking process involves profile browsing, sending booking requests, maid acceptance, document verification, and placement confirmation. Ethiopian Maids facilitates this process but does not guarantee successful placements.\n\nAll placements are subject to verification of documents, background checks where applicable, and mutual agreement between parties.',
  },
  {
    id: '8',
    title: '8. Cancellation & Refund Policy',
    content: [
      'Cancellation policies vary by service type:',
      '',
      '• Subscription Cancellation: Cancel anytime through account settings. Access continues until the end of the billing period.',
      '• Booking Cancellation: Free cancellation within 24 hours of booking. After 24 hours, cancellation fees may apply.',
      '• Refund Eligibility: Full refund if cancelled within 7 days and no maid assigned. Partial refund for cancellations after maid assignment.',
      '• 30-Day Replacement Guarantee: Free replacement within 30 days if unsatisfied with placement.',
    ],
  },
  {
    id: '9',
    title: '9. Intellectual Property',
    content: 'All content on the Platform, including but not limited to text, graphics, logos, icons, images, and software, is the property of Ethiopian Maids or its licensors and is protected by intellectual property laws.\n\nYou may not reproduce, distribute, modify, or create derivative works from any content without our prior written consent.',
  },
  {
    id: '10',
    title: '10. User Content & Conduct',
    content: 'Users retain ownership of content they post but grant Ethiopian Maids a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content in connection with our services.\n\nYou are solely responsible for your content and must ensure it does not violate any laws or third-party rights. We reserve the right to remove any content that violates these Terms.',
  },
  {
    id: '11',
    title: '11. Privacy',
    content: 'Your privacy is important to us. Our collection, use, and disclosure of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to our data practices as described in the Privacy Policy.',
  },
  {
    id: '12',
    title: '12. Dispute Resolution',
    content: 'We encourage users to resolve disputes directly. If you have a dispute with another user, please contact our support team. We may facilitate mediation but are not obligated to do so.\n\nFor disputes with Ethiopian Maids, we agree to first attempt resolution through informal negotiation. If unsuccessful, disputes will be resolved through binding arbitration in accordance with applicable arbitration rules.',
  },
  {
    id: '13',
    title: '13. Limitation of Liability',
    content: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, ETHIOPIAN MAIDS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL.\n\nOUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.',
  },
  {
    id: '14',
    title: '14. Indemnification',
    content: 'You agree to indemnify, defend, and hold harmless Ethiopian Maids, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights.',
  },
  {
    id: '15',
    title: '15. Termination',
    content: 'We may suspend or terminate your account at any time for violation of these Terms or for any other reason at our sole discretion. You may terminate your account at any time through account settings.\n\nUpon termination, your right to use the Platform ceases immediately. Provisions that by their nature should survive termination will remain in effect.',
  },
  {
    id: '16',
    title: '16. Governing Law',
    content: 'These Terms are governed by the laws of the Federal Democratic Republic of Ethiopia. For users in GCC countries, local labor laws and regulations regarding domestic workers also apply.\n\nAny legal action must be brought in courts located in Addis Ababa, Ethiopia, and you consent to the jurisdiction of such courts.',
  },
  {
    id: '17',
    title: '17. Contact Information',
    content: 'If you have questions about these Terms, please contact us:\n\nEthiopian Maids\nEmail: support@ethiopianmaids.com\nPhone: +1 717 699 8295\nWebsite: ethiopianmaids.com',
  },
];

export default function TermsScreen() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['1']);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const openEmail = () => {
    Linking.openURL('mailto:support@ethiopianmaids.com');
  };

  const openPhone = () => {
    Linking.openURL('tel:+17176998295');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Terms of Service' }} />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.lastUpdated}>Last updated: January 2025</Text>
        </View>

        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Please read these Terms of Service carefully before using Ethiopian Maids.
            By using our platform, you agree to be bound by these terms.
          </Text>
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

        {/* Contact Card */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Questions?</Text>
          <Text style={styles.contactSubtitle}>Contact our support team</Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
              <Ionicons name="mail-outline" size={20} color="#7C3AED" />
              <Text style={styles.contactButtonText}>Email Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={openPhone}>
              <Ionicons name="call-outline" size={20} color="#7C3AED" />
              <Text style={styles.contactButtonText}>Call Us</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#7C3AED',
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
  contactCard: {
    backgroundColor: '#EDE9FE',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#7C3AED',
    marginBottom: 16,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
