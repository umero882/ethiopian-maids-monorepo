/**
 * About Screen
 *
 * Comprehensive About page for Ethiopian Maids mobile app.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Stat {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface Country {
  name: string;
  flag: string;
}

const STATS: Stat[] = [
  { value: '4,200+', label: 'Registered Users', icon: 'people', color: '#7C3AED' },
  { value: '97%', label: 'Success Rate', icon: 'thumbs-up', color: '#10B981' },
  { value: '6', label: 'GCC Countries', icon: 'globe', color: '#3B82F6' },
  { value: '4.8/5', label: 'User Rating', icon: 'star', color: '#F59E0B' },
];

const FEATURES: Feature[] = [
  {
    icon: 'shield-checkmark',
    title: 'Verified Profiles',
    description: 'All profiles undergo thorough background checks',
    color: '#10B981',
  },
  {
    icon: 'search',
    title: 'Advanced Search',
    description: 'Find the perfect match with smart filters',
    color: '#3B82F6',
  },
  {
    icon: 'chatbubbles',
    title: 'Secure Messaging',
    description: 'Direct communication within the platform',
    color: '#8B5CF6',
  },
  {
    icon: 'card',
    title: 'Safe Payments',
    description: 'Secure transactions with Stripe',
    color: '#F59E0B',
  },
  {
    icon: 'star',
    title: 'Reviews & Ratings',
    description: 'Make informed decisions with real feedback',
    color: '#EC4899',
  },
  {
    icon: 'notifications',
    title: 'Real-time Updates',
    description: 'Stay informed with instant notifications',
    color: '#EF4444',
  },
];

const VALUES = [
  {
    icon: 'shield',
    title: 'Trust & Safety',
    description: 'Every maid undergoes thorough verification to ensure your family\'s safety.',
    color: '#7C3AED',
  },
  {
    icon: 'ribbon',
    title: 'Quality Service',
    description: 'We maintain high standards through continuous training and monitoring.',
    color: '#3B82F6',
  },
  {
    icon: 'heart',
    title: 'Care & Support',
    description: '24/7 customer support for both sponsors and maids.',
    color: '#EC4899',
  },
  {
    icon: 'checkmark-circle',
    title: 'Reliability',
    description: '30-day replacement guarantee and transparent processes.',
    color: '#10B981',
  },
];

const COUNTRIES: Country[] = [
  { name: 'UAE', flag: '🇦🇪' },
  { name: 'Saudi Arabia', flag: '🇸🇦' },
  { name: 'Qatar', flag: '🇶🇦' },
  { name: 'Kuwait', flag: '🇰🇼' },
  { name: 'Bahrain', flag: '🇧🇭' },
  { name: 'Oman', flag: '🇴🇲' },
];

const CERTIFICATIONS = [
  'Ethiopian Ministry of Labor Licensed',
  'GCC Regulatory Authority Approved',
  'MOLSA Certified Agency Partner',
  'ISO 9001:2015 Quality Management',
];

export default function AboutScreen() {
  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open link:', error);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'About' }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="people" size={48} color="#fff" />
          </View>
          <Text style={styles.appName}>Ethiopian Maids</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>
            Connecting Ethiopian domestic workers with families across the Gulf region since 2019
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            {STATS.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mission & Vision */}
        <View style={styles.section}>
          <View style={styles.missionCard}>
            <View style={styles.missionHeader}>
              <Ionicons name="flag" size={24} color="#7C3AED" />
              <Text style={styles.missionTitle}>Our Mission</Text>
            </View>
            <Text style={styles.missionText}>
              To provide dignified employment opportunities for Ethiopian domestic workers while
              delivering exceptional household support to families in the Gulf region. We create
              meaningful connections built on trust, respect, and mutual benefit.
            </Text>
          </View>

          <View style={styles.visionCard}>
            <View style={styles.missionHeader}>
              <Ionicons name="eye" size={24} color="#1E40AF" />
              <Text style={[styles.missionTitle, { color: '#1E40AF' }]}>Our Vision</Text>
            </View>
            <Text style={styles.missionText}>
              To become the most trusted platform for domestic worker placement in the Middle East,
              setting industry standards for transparency, worker welfare, and employer satisfaction.
            </Text>
          </View>
        </View>

        {/* Our Story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <View style={styles.storyCard}>
            <Text style={styles.storyText}>
              Ethiopian Maids was founded in 2019 with a simple yet powerful vision: to bridge
              the gap between Ethiopian domestic workers seeking better opportunities and Gulf
              families in need of reliable household support.
            </Text>
            <Text style={styles.storyText}>
              Today, we operate across all six GCC countries, partnering with licensed agencies
              in Ethiopia and maintaining strong relationships with labor authorities in both
              origin and destination countries.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
                  <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Our Values */}
        <View style={styles.valuesSection}>
          <Text style={styles.valuesSectionTitle}>Our Values</Text>
          <View style={styles.valuesGrid}>
            {VALUES.map((value, index) => (
              <View key={index} style={styles.valueCard}>
                <Ionicons name={value.icon as any} size={28} color={value.color} />
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDescription}>{value.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Coverage Area */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where We Operate</Text>
          <View style={styles.countriesCard}>
            <Text style={styles.countriesSubtitle}>
              Serving families across all GCC countries
            </Text>
            <View style={styles.countriesGrid}>
              {COUNTRIES.map((country, index) => (
                <View key={index} style={styles.countryItem}>
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.name}</Text>
                </View>
              ))}
            </View>
            <View style={styles.officesRow}>
              <Ionicons name="location" size={16} color="#7C3AED" />
              <Text style={styles.officesText}>
                Headquarters: Addis Ababa | Regional: Dubai
              </Text>
            </View>
          </View>
        </View>

        {/* Certifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications & Licenses</Text>
          <View style={styles.certificationsCard}>
            {CERTIFICATIONS.map((cert, index) => (
              <View key={index} style={styles.certificationItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.certificationText}>{cert}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <View style={styles.contactCard}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => openLink('mailto:support@ethiopianmaids.com')}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="mail" size={20} color="#7C3AED" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>support@ethiopianmaids.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => openLink('tel:+17176998295')}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="call" size={20} color="#10B981" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>+1 717 699 8295</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => openLink('https://wa.me/17176998295')}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactValue}>Chat with us</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={[styles.contactItem, { borderBottomWidth: 0 }]}>
              <View style={styles.contactIcon}>
                <Ionicons name="time" size={20} color="#F59E0B" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Business Hours</Text>
                <Text style={styles.contactValue}>Mon-Sat: 8AM - 10PM GST</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow Us</Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={24} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-instagram" size={24} color="#E4405F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-linkedin" size={24} color="#0A66C2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-youtube" size={24} color="#FF0000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.legalSection}>
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => router.push('/profile/terms')}
          >
            <Ionicons name="document-text-outline" size={18} color="#6B7280" />
            <Text style={styles.legalLinkText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => router.push('/profile/privacy')}
          >
            <Ionicons name="shield-outline" size={18} color="#6B7280" />
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => router.push('/profile/cookies')}
          >
            <Ionicons name="analytics-outline" size={18} color="#6B7280" />
            <Text style={styles.legalLinkText}>Cookie Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} Ethiopian Maids
          </Text>
          <Text style={styles.footerSubtext}>All rights reserved.</Text>
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
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: -24,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  missionCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  visionCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  missionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#7C3AED',
  },
  missionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  storyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  storyText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  featureCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  valuesSection: {
    backgroundColor: '#7C3AED',
    paddingVertical: 32,
    paddingHorizontal: 16,
    marginTop: 24,
  },
  valuesSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  valueCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 16,
    alignItems: 'center',
  },
  valueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  valueDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  countriesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  countriesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  countriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  countryItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countryFlag: {
    fontSize: 32,
    marginBottom: 4,
  },
  countryName: {
    fontSize: 12,
    color: '#4B5563',
  },
  officesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  officesText: {
    fontSize: 13,
    color: '#6B7280',
  },
  certificationsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  certificationText: {
    fontSize: 14,
    color: '#374151',
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  legalSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 16,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legalLinkText: {
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  copyright: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
