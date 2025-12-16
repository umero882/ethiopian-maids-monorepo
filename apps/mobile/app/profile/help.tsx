/**
 * Help & Support Screen
 *
 * Provides FAQ, contact options, and support ticket creation.
 * Matches the web app Help & Support functionality.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useSupport,
  useSupportTickets,
  useContactSupport,
  SUPPORT_CATEGORIES,
} from '../../hooks';
import { useAuth } from '../../hooks/useAuth';

// FAQ Accordion Item
interface FAQItemProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const FAQItem = ({ question, answer, isExpanded, onToggle }: FAQItemProps) => (
  <TouchableOpacity style={styles.faqItem} onPress={onToggle} activeOpacity={0.7}>
    <View style={styles.faqHeader}>
      <Text style={styles.faqQuestion}>{question}</Text>
      <Ionicons
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        size={20}
        color="#6B7280"
      />
    </View>
    {isExpanded && <Text style={styles.faqAnswer}>{answer}</Text>}
  </TouchableOpacity>
);

// Contact Option Card
interface ContactOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  loading?: boolean;
}

const ContactOption = ({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  loading,
}: ContactOptionProps) => (
  <TouchableOpacity
    style={styles.contactOption}
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.7}
  >
    <View style={[styles.contactIconContainer, { backgroundColor: `${iconColor}15` }]}>
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <Ionicons name={icon} size={24} color={iconColor} />
      )}
    </View>
    <View style={styles.contactTextContainer}>
      <Text style={styles.contactTitle}>{title}</Text>
      <Text style={styles.contactSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
  </TouchableOpacity>
);

// Section Header
const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
  </View>
);

export default function HelpSupportScreen() {
  const { isAuthenticated } = useAuth();
  const {
    faqItems,
    searchQuery,
    setSearchQuery,
    businessHours,
    isWithinBusinessHours,
  } = useSupport();

  const {
    tickets,
    loading: ticketsLoading,
    creating: creatingTicket,
    createTicket,
  } = useSupportTickets();

  const { callSupport, emailSupport, openWhatsApp, calling, supportPhone } = useContactSupport();

  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState('general');

  // Toggle FAQ expansion
  const toggleFAQ = useCallback((id: string) => {
    setExpandedFAQ((prev) => (prev === id ? null : id));
  }, []);

  // Handle contact options
  const handleCall = useCallback(() => {
    if (!isWithinBusinessHours()) {
      Alert.alert(
        'Outside Business Hours',
        `Our support team is available ${businessHours.days.join(', ')} from ${businessHours.start}:00 to ${businessHours.end}:00 ${businessHours.timezone}.\n\nYou can still call and leave a voicemail, or try WhatsApp/Email.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call Anyway', onPress: callSupport },
        ]
      );
    } else {
      callSupport();
    }
  }, [isWithinBusinessHours, businessHours, callSupport]);

  const handleEmail = useCallback(() => {
    emailSupport('Support Request');
  }, [emailSupport]);

  const handleWhatsApp = useCallback(() => {
    openWhatsApp('Hello, I need help with Ethiopian Maids app.');
  }, [openWhatsApp]);

  // Handle ticket submission
  const handleSubmitTicket = useCallback(async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      Alert.alert('Required Fields', 'Please fill in both subject and message.');
      return;
    }

    try {
      await createTicket({
        subject: ticketSubject.trim(),
        message: ticketMessage.trim(),
        category: ticketCategory,
        priority: ticketCategory === 'urgent' ? 'high' : 'medium',
      });

      Alert.alert(
        'Ticket Submitted',
        'Your support ticket has been submitted. We will respond within 24-48 hours.',
        [{ text: 'OK', onPress: () => setShowTicketModal(false) }]
      );

      // Reset form
      setTicketSubject('');
      setTicketMessage('');
      setTicketCategory('general');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit ticket. Please try again.');
    }
  }, [ticketSubject, ticketMessage, ticketCategory, createTicket]);

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#3B82F6';
      case 'in_progress':
        return '#F59E0B';
      case 'resolved':
        return '#10B981';
      case 'closed':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Help & Support' }} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="help-buoy" size={40} color="#3B82F6" />
          </View>
          <Text style={styles.headerTitle}>How can we help?</Text>
          <Text style={styles.headerSubtitle}>
            Search our FAQ or contact our support team
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQ..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Contact Options */}
        <SectionHeader
          title="Contact Us"
          subtitle={
            isWithinBusinessHours()
              ? 'We are available now'
              : `Available ${businessHours.start}:00-${businessHours.end}:00 ${businessHours.timezone}`
          }
        />
        <View style={styles.contactSection}>
          <ContactOption
            icon="call-outline"
            iconColor="#10B981"
            title="Call Support"
            subtitle={supportPhone}
            onPress={handleCall}
            loading={calling}
          />
          <ContactOption
            icon="logo-whatsapp"
            iconColor="#25D366"
            title="WhatsApp"
            subtitle="Chat with us instantly"
            onPress={handleWhatsApp}
          />
          <ContactOption
            icon="mail-outline"
            iconColor="#3B82F6"
            title="Email"
            subtitle="support@ethiopianmaids.com"
            onPress={handleEmail}
          />
        </View>

        {/* Support Tickets (for authenticated users) */}
        {isAuthenticated && (
          <>
            <SectionHeader title="Support Tickets" />
            <View style={styles.ticketSection}>
              <TouchableOpacity
                style={styles.createTicketButton}
                onPress={() => setShowTicketModal(true)}
              >
                <Ionicons name="create-outline" size={22} color="#fff" />
                <Text style={styles.createTicketText}>Create New Ticket</Text>
              </TouchableOpacity>

              {tickets.length > 0 && (
                <TouchableOpacity
                  style={styles.viewTicketsButton}
                  onPress={() => setShowTicketsModal(true)}
                >
                  <View style={styles.viewTicketsContent}>
                    <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
                    <Text style={styles.viewTicketsText}>
                      View My Tickets ({tickets.length})
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* FAQ Section */}
        <SectionHeader
          title="Frequently Asked Questions"
          subtitle={`${faqItems.length} ${faqItems.length === 1 ? 'result' : 'results'}`}
        />
        <View style={styles.faqSection}>
          {faqItems.length > 0 ? (
            faqItems.map((item) => (
              <FAQItem
                key={item.id}
                question={item.question}
                answer={item.answer}
                isExpanded={expandedFAQ === item.id}
                onToggle={() => toggleFAQ(item.id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No matching FAQ found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try different keywords or contact support
              </Text>
            </View>
          )}
        </View>

        {/* Business Hours Info */}
        <View style={styles.businessHoursCard}>
          <View style={styles.businessHoursHeader}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text style={styles.businessHoursTitle}>Business Hours</Text>
          </View>
          <Text style={styles.businessHoursText}>
            {businessHours.days.join(', ')}
          </Text>
          <Text style={styles.businessHoursText}>
            {businessHours.start}:00 AM - {businessHours.end > 12 ? businessHours.end - 12 : businessHours.end}:00 PM ({businessHours.timezone})
          </Text>
        </View>

        <View style={styles.footer} />
      </ScrollView>

      {/* Create Ticket Modal */}
      <Modal
        visible={showTicketModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTicketModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTicketModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Support Ticket</Text>
            <TouchableOpacity onPress={handleSubmitTicket} disabled={creatingTicket}>
              <Text style={[styles.modalSave, creatingTicket && styles.modalSaveDisabled]}>
                {creatingTicket ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {SUPPORT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      ticketCategory === cat.id && styles.categoryChipActive,
                    ]}
                    onPress={() => setTicketCategory(cat.id)}
                  >
                    <Ionicons
                      name={cat.icon as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={ticketCategory === cat.id ? '#fff' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        ticketCategory === cat.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Subject */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                value={ticketSubject}
                onChangeText={setTicketSubject}
                placeholder="Brief description of your issue"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
            </View>

            {/* Message */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={ticketMessage}
                onChangeText={setTicketMessage}
                placeholder="Please describe your issue in detail..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.ticketNote}>
              We typically respond within 24-48 hours. For urgent issues, please call our support line.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* View Tickets Modal */}
      <Modal
        visible={showTicketsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTicketsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTicketsModal(false)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>My Tickets</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {ticketsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : tickets.length > 0 ? (
              tickets.map((ticket) => (
                <View key={ticket.id} style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketSubject} numberOfLines={1}>
                      {ticket.subject}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(ticket.status)}15` },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: getStatusColor(ticket.status) }]}
                      >
                        {ticket.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.ticketMessage} numberOfLines={2}>
                    {ticket.message}
                  </Text>
                  <View style={styles.ticketFooter}>
                    <Text style={styles.ticketCategory}>{ticket.category}</Text>
                    <Text style={styles.ticketDate}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No tickets yet</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  contactSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  ticketSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  createTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createTicketText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  viewTicketsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewTicketsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewTicketsText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  faqSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  businessHoursCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  businessHoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  businessHoursTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  businessHoursText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  footer: {
    height: 40,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 140,
    paddingTop: 14,
  },
  categoryScroll: {
    marginBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  ticketNote: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketSubject: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ticketMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  ticketDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
