/**
 * useSupport Hook
 *
 * Hook for managing Help & Support functionality.
 * Provides FAQ items, support ticket creation, and contact methods.
 */

import { useCallback, useState } from 'react';
import { Linking, Platform, Alert } from 'react-native';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from './useAuth';

// Simple clipboard helper - we'll just show the number in an alert as fallback
const copyToClipboard = async (text: string): Promise<void> => {
  // On modern RN, we could use react-native Clipboard
  // For now, we just inform the user
  return Promise.resolve();
};

// Support phone number
const SUPPORT_PHONE = '+17176998295';

// Business hours
const BUSINESS_HOURS = {
  start: 8, // 8 AM
  end: 22, // 10 PM
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  timezone: 'GST',
};

// FAQ Items (matching web app)
export const FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    question: 'How long does it take to find a maid?',
    answer: 'On average, it takes 5-7 business days to match you with a suitable maid based on your requirements. Premium subscribers may receive matches within 2-3 days.',
    category: 'general',
  },
  {
    id: '2',
    question: 'What if I am not satisfied with the maid?',
    answer: 'We offer a 30-day replacement guarantee. If you are not satisfied with your maid within the first 30 days, we will find you a replacement at no additional cost.',
    category: 'general',
  },
  {
    id: '3',
    question: 'How do I upgrade my subscription?',
    answer: 'You can upgrade your subscription from your Dashboard. Go to Account Settings > Subscriptions and select the plan that best suits your needs.',
    category: 'billing',
  },
  {
    id: '4',
    question: 'Is my payment information secure?',
    answer: 'Yes, we use industry-standard encryption and secure payment processing through Stripe. Your payment information is never stored on our servers.',
    category: 'billing',
  },
  {
    id: '5',
    question: 'How do I contact a maid directly?',
    answer: 'Once you have a booking or the maid accepts your job application, you can message them directly through our in-app messaging system.',
    category: 'general',
  },
  {
    id: '6',
    question: 'What documents do maids need to provide?',
    answer: 'Maids must provide valid ID, passport (for international placements), medical certificate, and police clearance. All documents are verified by our team.',
    category: 'general',
  },
  {
    id: '7',
    question: 'How do refunds work?',
    answer: 'Refunds are processed within 5-7 business days. If you cancel within the first 7 days and no maid has been assigned, you are eligible for a full refund.',
    category: 'billing',
  },
  {
    id: '8',
    question: 'Can I hire a maid for a short period?',
    answer: 'Yes, we offer flexible hiring options including part-time, full-time, and temporary placements. Specify your requirements when posting a job.',
    category: 'general',
  },
];

// Support categories
export const SUPPORT_CATEGORIES: SupportCategory[] = [
  { id: 'general', label: 'General Inquiry', icon: 'help-circle-outline' },
  { id: 'technical', label: 'Technical Support', icon: 'construct-outline' },
  { id: 'billing', label: 'Billing & Payments', icon: 'card-outline' },
  { id: 'account', label: 'Account Issues', icon: 'person-outline' },
  { id: 'maid_placement', label: 'Maid Placement', icon: 'people-outline' },
  { id: 'urgent', label: 'Urgent Issue', icon: 'alert-circle-outline' },
];

// GraphQL mutation for creating support ticket
const CREATE_SUPPORT_TICKET = gql`
  mutation CreateSupportTicket(
    $userId: String!
    $userEmail: String!
    $userName: String
    $userType: String
    $subject: String!
    $message: String!
    $category: String!
    $priority: String
  ) {
    insert_support_tickets_one(
      object: {
        user_id: $userId
        user_email: $userEmail
        user_name: $userName
        user_type: $userType
        subject: $subject
        message: $message
        category: $category
        priority: $priority
        status: "open"
      }
    ) {
      id
      subject
      status
      created_at
    }
  }
`;

// GraphQL query for user's support tickets
const GET_USER_TICKETS = gql`
  query GetUserSupportTickets($userId: String!) {
    support_tickets(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: 20
    ) {
      id
      subject
      message
      category
      priority
      status
      created_at
      updated_at
      first_response_at
    }
  }
`;

// Types
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface SupportCategory {
  id: string;
  label: string;
  icon: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at?: string;
  first_response_at?: string;
}

export interface CreateTicketInput {
  subject: string;
  message: string;
  category: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Hook for FAQ functionality
 */
export function useFAQ() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQ items based on search
  const filteredFAQ = searchQuery.trim()
    ? FAQ_ITEMS.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FAQ_ITEMS;

  // Get FAQ by category
  const getFAQByCategory = useCallback((category: string) => {
    return FAQ_ITEMS.filter((item) => item.category === category);
  }, []);

  return {
    faqItems: filteredFAQ,
    allFAQItems: FAQ_ITEMS,
    searchQuery,
    setSearchQuery,
    getFAQByCategory,
  };
}

/**
 * Hook for support tickets
 */
export function useSupportTickets() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);

  // Get profile ID from email
  const GET_PROFILE_BY_EMAIL = gql`
    query GetProfileByEmail($email: String!) {
      profiles(where: { email: { _eq: $email } }, limit: 1) {
        id
      }
    }
  `;

  useQuery(GET_PROFILE_BY_EMAIL, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  // Fetch user's tickets
  const {
    data,
    loading,
    error,
    refetch,
  } = useQuery(GET_USER_TICKETS, {
    variables: { userId: profileId },
    skip: !profileId,
    fetchPolicy: 'cache-and-network',
  });

  const tickets: SupportTicket[] = data?.support_tickets || [];

  // Create ticket mutation
  const [createTicketMutation, { loading: creating }] = useMutation(CREATE_SUPPORT_TICKET);

  const createTicket = useCallback(async (input: CreateTicketInput) => {
    if (!profileId || !user?.email) {
      throw new Error('Please sign in to create a support ticket');
    }

    try {
      const result = await createTicketMutation({
        variables: {
          userId: profileId,
          userEmail: user.email,
          userName: user.displayName || user.email.split('@')[0],
          userType: 'sponsor', // Default, can be dynamic based on user type
          subject: input.subject,
          message: input.message,
          category: input.category,
          priority: input.priority || 'medium',
        },
      });

      await refetch();
      return result.data?.insert_support_tickets_one;
    } catch (err) {
      console.error('[Support] Error creating ticket:', err);
      throw err;
    }
  }, [profileId, user, createTicketMutation, refetch]);

  return {
    tickets,
    loading,
    error,
    creating,
    createTicket,
    refetch,
  };
}

/**
 * Hook for contact support methods
 */
export function useContactSupport() {
  const [calling, setCalling] = useState(false);

  // Check if within business hours
  const isWithinBusinessHours = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });

    const isBusinessDay = BUSINESS_HOURS.days.includes(day);
    const isBusinessHour = hour >= BUSINESS_HOURS.start && hour < BUSINESS_HOURS.end;

    return isBusinessDay && isBusinessHour;
  }, []);

  // Call support
  const callSupport = useCallback(async () => {
    setCalling(true);
    try {
      const phoneUrl = `tel:${SUPPORT_PHONE}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);

      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        // Show the number in an alert as fallback
        Alert.alert(
          'Support Number',
          `Please call our support at ${SUPPORT_PHONE}`
        );
      }
    } catch (err) {
      console.error('[Support] Error calling support:', err);
      Alert.alert('Error', 'Unable to initiate call. Please try again.');
    } finally {
      setCalling(false);
    }
  }, []);

  // Email support
  const emailSupport = useCallback(async (subject?: string) => {
    const email = 'support@ethiopianmaids.com';
    const emailUrl = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

    try {
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        // Show the email in an alert as fallback
        Alert.alert(
          'Support Email',
          `Please email us at ${email}`
        );
      }
    } catch (err) {
      console.error('[Support] Error opening email:', err);
      Alert.alert('Error', 'Unable to open email app. Please try again.');
    }
  }, []);

  // Open WhatsApp
  const openWhatsApp = useCallback(async (message?: string) => {
    const whatsappNumber = SUPPORT_PHONE.replace('+', '');
    const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}${message ? `&text=${encodeURIComponent(message)}` : ''}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert(
          'WhatsApp Not Available',
          'Please install WhatsApp to use this feature, or call us directly.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Call Instead', onPress: callSupport },
          ]
        );
      }
    } catch (err) {
      console.error('[Support] Error opening WhatsApp:', err);
    }
  }, [callSupport]);

  return {
    supportPhone: SUPPORT_PHONE,
    businessHours: BUSINESS_HOURS,
    isWithinBusinessHours,
    callSupport,
    emailSupport,
    openWhatsApp,
    calling,
  };
}

/**
 * Combined support hook
 */
export function useSupport() {
  const faq = useFAQ();
  const tickets = useSupportTickets();
  const contact = useContactSupport();

  return {
    // FAQ
    faqItems: faq.faqItems,
    searchQuery: faq.searchQuery,
    setSearchQuery: faq.setSearchQuery,

    // Tickets
    tickets: tickets.tickets,
    ticketsLoading: tickets.loading,
    createTicket: tickets.createTicket,
    creatingTicket: tickets.creating,

    // Contact
    supportPhone: contact.supportPhone,
    businessHours: contact.businessHours,
    isWithinBusinessHours: contact.isWithinBusinessHours,
    callSupport: contact.callSupport,
    emailSupport: contact.emailSupport,
    openWhatsApp: contact.openWhatsApp,

    // Categories
    categories: SUPPORT_CATEGORIES,
  };
}
