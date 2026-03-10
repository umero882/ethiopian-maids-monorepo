/**
 * AdminSponsorsPage - Production Version
 * Manages sponsor profiles with GraphQL/Hasura data
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import logger from '@/utils/logger';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Filter,
  MoreHorizontal,
  Home,
  Eye,
  FileText,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  Loader2,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX,
  Briefcase,
  Building2,
  Heart,
  Baby,
  Shield,
  Globe,
  Languages,
  Banknote,
  BedDouble,
  Wifi,
  Camera,
  Image as ImageIcon,
  ExternalLink,
  MessageSquare,
  Send
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Notification mutation
const CREATE_NOTIFICATION_MUTATION = gql`
  mutation CreateNotification($data: notifications_insert_input!) {
    insert_notifications_one(object: $data) {
      id
      user_id
      type
      title
      message
      priority
      created_at
    }
  }
`;

// WhatsApp message mutation (for logging/tracking)
const CREATE_WHATSAPP_MESSAGE = gql`
  mutation CreateWhatsAppMessage($data: whatsapp_messages_insert_input!) {
    insert_whatsapp_messages_one(object: $data) {
      id
      phone_number
      message_content
      message_type
      created_at
    }
  }
`;

// Standalone verification status update mutation
const UPDATE_SPONSOR_VERIFICATION = gql`
  mutation UpdateSponsorVerification($id: String!, $status: String!) {
    update_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { verification_status: $status, updated_at: "now()" }
    ) {
      id
      verification_status
    }
  }
`;

const AdminSponsorsPage = () => {
  const { logAdminActivity } = useAdminAuth();
  const [sponsorsData, setSponsorsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    premium: 0,
    monthly: 0
  });
  const itemsPerPage = 20;

  // Verification dialog state
  const [verificationDialog, setVerificationDialog] = useState({
    open: false,
    sponsor: null,
    action: '', // 'approve', 'reject', 'pending'
    message: ''
  });
  const [verificationProcessing, setVerificationProcessing] = useState(false);

  // Default messages for verification actions (sponsor-specific)
  const defaultMessages = {
    approve: `Dear {name},

Congratulations! Your profile has been verified and approved on Ethiopian Maids Platform.

You can now:
- Browse and contact verified domestic workers
- Post job requirements and receive applications
- Access all premium platform features

Welcome to our community! We wish you success in finding the perfect domestic helper.

Best regards,
Ethiopian Maids Platform Team`,

    reject: `Dear {name},

We regret to inform you that your profile verification was not successful at this time.

Reason: [Please specify the reason]

To improve your profile, please:
- Ensure all information is accurate and complete
- Upload clear identity documents (Emirates ID / Passport)
- Provide valid contact information
- Complete all required fields

You can resubmit your profile for review after making the necessary updates.

Best regards,
Ethiopian Maids Platform Team`,

    pending: `Dear {name},

Thank you for registering on Ethiopian Maids Platform.

Your profile is currently under review by our admin team. This process typically takes 24-48 hours.

While waiting, you can:
- Complete any missing profile information
- Upload identity documents
- Set up your hiring preferences

We will notify you once your profile has been reviewed.

Best regards,
Ethiopian Maids Platform Team`
  };

  // Sponsor profile requirements configuration
  const sponsorProfileRequirements = [
    // REQUIRED
    { key: 'full_name', label: 'Full Name', check: (s) => !!(s.full_name && s.full_name !== 'Unknown'), required: true },
    { key: 'email', label: 'Email Address', check: (s) => !!(s.email && s.email !== 'N/A'), required: true },
    { key: 'phone', label: 'Phone Number', check: (s) => !!(s.phone && s.phone !== 'N/A'), required: true },
    { key: 'location', label: 'Location (City/Country)', check: (s) => !!(s.location && !s.location.includes('Unknown')), required: true },
    { key: 'avatar_url', label: 'Profile Photo', check: (s) => !!s.avatar_url, required: true },
    { key: 'id_document', label: 'ID Document (Front)', check: (s) => !!s._docVerification?.id_file_front_url, required: true },
    // OPTIONAL
    { key: 'id_back', label: 'ID Document (Back)', check: (s) => !!s._docVerification?.id_file_back_url, required: false },
    { key: 'employment_proof', label: 'Employment Proof', check: (s) => !!s._docVerification?.employment_proof_url, required: false },
    { key: 'occupation', label: 'Occupation', check: (s) => !!s.occupation, required: false },
    { key: 'company', label: 'Company', check: (s) => !!s.company, required: false },
    { key: 'address', label: 'Full Address', check: (s) => !!s.address, required: false },
    { key: 'accommodation_type', label: 'Accommodation Type', check: (s) => !!s.accommodation_type, required: false },
    { key: 'household_size', label: 'Household Size', check: (s) => !!s.household_size, required: false },
    { key: 'preferred_nationality', label: 'Preferred Nationality', check: (s) => (s.preferred_nationality || []).length > 0, required: false },
    { key: 'required_skills', label: 'Required Skills', check: (s) => (s.required_skills || []).length > 0, required: false },
    { key: 'salary_budget', label: 'Salary Budget', check: (s) => !!(s.salary_budget_min || s.salary_budget_max), required: false },
    { key: 'contract_duration', label: 'Contract Duration', check: (s) => !!s.contract_duration, required: false },
    { key: 'live_in_required', label: 'Live-in/Live-out Preference', check: (s) => s.live_in_required !== null && s.live_in_required !== undefined, required: false },
    { key: 'religion', label: 'Religion', check: (s) => !!s.religion, required: false },
    { key: 'onboarding_completed', label: 'Onboarding Completed', check: (s) => !!s.onboarding_completed, required: false },
  ];

  // Open verification dialog with personalized message
  const openVerificationDialog = (sponsor, action) => {
    const personalizedMessage = defaultMessages[action].replace(/{name}/g, sponsor.full_name || 'User');
    setVerificationDialog({
      open: true,
      sponsor,
      action,
      message: personalizedMessage
    });
  };

  // Send in-app notification to user
  const sendInAppNotification = async (userId, type, title, message, priority = 'high', actionUrl = null) => {
    try {
      const result = await apolloClient.mutate({
        mutation: CREATE_NOTIFICATION_MUTATION,
        variables: {
          data: {
            user_id: userId,
            type,
            title,
            message,
            priority,
            related_type: 'sponsor_profile',
            link: actionUrl,
            action_url: actionUrl,
            read: false
          }
        }
      });
      logger.info(`In-app notification sent to user ${userId}:`, { type, title, id: result.data?.insert_notifications_one?.id });
      return true;
    } catch (error) {
      logger.error('Failed to send in-app notification:', error);
      return false;
    }
  };

  // Send WhatsApp message (creates record for external service to process)
  const sendWhatsAppMessage = async (phoneNumber, messageContent) => {
    if (!phoneNumber) return false;

    // Clean phone number - keep + and digits
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) return false;

    try {
      await apolloClient.mutate({
        mutation: CREATE_WHATSAPP_MESSAGE,
        variables: {
          data: {
            phone_number: cleanPhone,
            message_content: messageContent,
            message_type: 'text',
            sender: 'assistant',
            processed: false
          }
        }
      });
      logger.info(`WhatsApp message queued for ${cleanPhone}`);
      return true;
    } catch (error) {
      logger.error('Failed to queue WhatsApp message:', error);
      return false;
    }
  };

  // Handle verification action with message (WhatsApp + in-app notifications)
  const handleVerificationWithMessage = async () => {
    if (!verificationDialog.sponsor || !verificationDialog.action) return;

    setVerificationProcessing(true);
    try {
      const { action, sponsor, message } = verificationDialog;
      let newStatus;

      switch (action) {
        case 'approve':
          newStatus = 'verified';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        case 'pending':
          newStatus = 'pending';
          break;
        default:
          newStatus = 'pending';
      }

      // 1. Update verification status in database
      const { errors } = await apolloClient.mutate({
        mutation: UPDATE_SPONSOR_VERIFICATION,
        variables: {
          id: sponsor.id,
          status: newStatus
        }
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      // Optimistic UI update
      setSponsorsData(prev =>
        prev.map(s =>
          s.id === sponsor.id
            ? { ...s, verification_status: newStatus }
            : s
        )
      );

      // Update stats
      fetchStats();

      await logAdminActivity(`sponsor_verification_${action}`, 'sponsor', sponsor.id);

      // Track notification channels used
      const notificationChannels = [];

      // 2. Send in-app notification to sponsor
      const actionTitles = {
        approve: 'Profile Approved!',
        reject: 'Profile Rejected',
        pending: 'Profile Under Review'
      };

      const sponsorName = sponsor.full_name || 'there';
      let sponsorMessage;
      if (action === 'reject') {
        sponsorMessage = `Dear ${sponsorName},\n\nYour profile has been rejected due to the following reasons:\n\n${message}\n\nPlease update your profile and resubmit for verification.`;
      } else if (action === 'approve') {
        sponsorMessage = `Dear ${sponsorName},\n\nCongratulations! Your profile has been approved. You can now browse and hire domestic workers.\n\n${message}`;
      } else {
        sponsorMessage = `Dear ${sponsorName},\n\nYour profile is currently under review.\n\n${message}`;
      }

      const notificationSent = await sendInAppNotification(
        sponsor.id,
        action === 'approve' ? 'profile_approved' : action === 'reject' ? 'profile_rejected' : 'system_announcement',
        actionTitles[action],
        sponsorMessage,
        action === 'reject' ? 'urgent' : 'high',
        '/dashboard/sponsor/profile'
      );
      if (notificationSent) notificationChannels.push('in-app');

      // 3. Send WhatsApp to sponsor if phone available
      const sponsorPhone = sponsor.phone && sponsor.phone !== 'N/A' ? sponsor.phone : null;
      if (sponsorPhone) {
        const whatsappSent = await sendWhatsAppMessage(sponsorPhone, sponsorMessage);
        if (whatsappSent) notificationChannels.push('whatsapp');
      }

      const actionLabels = {
        approve: 'approved',
        reject: 'rejected',
        pending: 'set to pending'
      };

      // Build success message with channels used
      let successDescription = `${sponsor.full_name} has been ${actionLabels[action]}.`;
      if (notificationChannels.length > 0) {
        successDescription += ` Notifications sent via: ${notificationChannels.join(', ')}.`;
      }

      toast({
        title: 'Verification Updated',
        description: successDescription,
      });

      // Close dialog
      setVerificationDialog({ open: false, sponsor: null, action: '', message: '' });
    } catch (error) {
      logger.error('Failed to update verification status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status.',
        variant: 'destructive',
      });
      // Refetch to get correct state
      fetchSponsors();
    } finally {
      setVerificationProcessing(false);
    }
  };

  // GraphQL query for sponsors - using profiles table with sponsor_profile relation
  const GET_SPONSORS = gql`
    query GetSponsors($limit: Int!, $offset: Int!, $where: profiles_bool_exp) {
      profiles(
        where: $where
        order_by: { created_at: desc }
        limit: $limit
        offset: $offset
      ) {
        id
        email
        full_name
        phone
        country
        location
        avatar_url
        created_at
        last_seen
        user_type
        verification_status
        subscription_status
        profile_completion
        rating
        total_reviews
        total_spent
        sponsor_profile {
          id
          full_name
          phone_number
          city
          country
          address
          occupation
          company
          religion
          household_size
          number_of_children
          children_ages
          elderly_care_needed
          accommodation_type
          preferred_nationality
          preferred_languages
          required_skills
          salary_budget_min
          salary_budget_max
          currency
          payment_frequency
          contract_duration
          additional_benefits
          live_in_required
          working_hours_per_day
          days_off_per_week
          room_amenities
          identity_verified
          background_check_completed
          profile_completed
          onboarding_completed
          total_hires
          average_rating
          active_job_postings
          created_at
          updated_at
        }
      }
      profiles_aggregate(where: $where) {
        aggregate {
          count
        }
      }
    }
  `;

  // Stats query for summary cards
  const GET_SPONSOR_STATS = gql`
    query GetSponsorStats {
      total: profiles_aggregate(where: { user_type: { _eq: "sponsor" } }) {
        aggregate { count }
      }
      verified: profiles_aggregate(where: {
        user_type: { _eq: "sponsor" },
        verification_status: { _eq: "verified" }
      }) {
        aggregate { count }
      }
      pending: profiles_aggregate(where: {
        user_type: { _eq: "sponsor" },
        _or: [
          { verification_status: { _is_null: true } },
          { verification_status: { _eq: "pending" } },
          { verification_status: { _eq: "" } }
        ]
      }) {
        aggregate { count }
      }
      rejected: profiles_aggregate(where: {
        user_type: { _eq: "sponsor" },
        verification_status: { _eq: "rejected" }
      }) {
        aggregate { count }
      }
      premium: profiles_aggregate(where: {
        user_type: { _eq: "sponsor" },
        subscription_status: { _ilike: "premium" }
      }) {
        aggregate { count }
      }
      monthly: profiles_aggregate(where: {
        user_type: { _eq: "sponsor" },
        subscription_status: { _ilike: "monthly" }
      }) {
        aggregate { count }
      }
    }
  `;

  // Query for sponsor document verification (ID documents, employment proof)
  const GET_SPONSOR_DOC_VERIFICATION = gql`
    query GetSponsorDocVerification($sponsor_id: uuid!) {
      sponsor_document_verification(where: { sponsor_id: { _eq: $sponsor_id } }) {
        id
        sponsor_id
        id_type
        id_number
        residence_country
        contact_phone
        employment_proof_type
        verification_status
        last_submission_at
        submission_count
        id_file_front_url
        id_file_front_name
        id_file_back_url
        id_file_back_name
        employment_proof_url
        employment_proof_name
      }
    }
  `;

  // Fetch sponsors via GraphQL
  const fetchSponsors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build where clause
      const conditions = { user_type: { _eq: 'sponsor' } };

      if (searchTerm) {
        conditions._or = [
          { full_name: { _ilike: `%${searchTerm}%` } },
          { email: { _ilike: `%${searchTerm}%` } },
          { phone: { _ilike: `%${searchTerm}%` } }
        ];
      }

      if (verificationFilter !== 'all') {
        if (verificationFilter === 'pending') {
          conditions._and = [
            { _or: [
              { verification_status: { _is_null: true } },
              { verification_status: { _eq: 'pending' } },
              { verification_status: { _eq: '' } }
            ]}
          ];
        } else {
          conditions.verification_status = { _eq: verificationFilter };
        }
      }

      if (subscriptionFilter !== 'all') {
        conditions.subscription_status = { _ilike: subscriptionFilter };
      }

      const { data, errors } = await apolloClient.query({
        query: GET_SPONSORS,
        variables: {
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          where: conditions
        },
        fetchPolicy: 'network-only'
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to fetch sponsors');

      const profilesData = data?.profiles || [];
      const count = data?.profiles_aggregate?.aggregate?.count || 0;

      // Transform data - merge profile and sponsor_profile data
      const transformedData = profilesData.map(profile => {
        const sponsorProfile = profile.sponsor_profile || {};

        // Determine verification status
        let verificationStatus = profile.verification_status || 'pending';
        if (!verificationStatus || verificationStatus === '') {
          verificationStatus = 'pending';
        }

        return {
          id: profile.id,
          profile_id: profile.id,
          email: profile.email || 'N/A',
          full_name: profile.full_name || sponsorProfile.full_name || 'Unknown',
          phone: profile.phone || sponsorProfile.phone_number || 'N/A',
          location: `${sponsorProfile.city || 'Unknown'}, ${sponsorProfile.country || profile.country || 'Unknown'}`,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          last_active: profile.last_seen,
          verification_status: verificationStatus,
          subscription_status: (profile.subscription_status || 'free').toLowerCase().trim(),
          profile_completion: profile.profile_completion || 0,
          rating: parseFloat(profile.rating) || parseFloat(sponsorProfile.average_rating) || 0,
          total_reviews: profile.total_reviews || 0,
          total_spent: profile.total_spent || 0,
          // Sponsor-specific data
          household_size: sponsorProfile.household_size,
          number_of_children: sponsorProfile.number_of_children,
          children_ages: sponsorProfile.children_ages || [],
          elderly_care_needed: sponsorProfile.elderly_care_needed,
          accommodation_type: sponsorProfile.accommodation_type,
          address: sponsorProfile.address,
          occupation: sponsorProfile.occupation,
          company: sponsorProfile.company,
          religion: sponsorProfile.religion,
          preferred_nationality: sponsorProfile.preferred_nationality || [],
          preferred_languages: sponsorProfile.preferred_languages || [],
          required_skills: sponsorProfile.required_skills || [],
          salary_budget_min: sponsorProfile.salary_budget_min,
          salary_budget_max: sponsorProfile.salary_budget_max,
          currency: sponsorProfile.currency || 'USD',
          payment_frequency: sponsorProfile.payment_frequency,
          contract_duration: sponsorProfile.contract_duration,
          additional_benefits: sponsorProfile.additional_benefits || [],
          live_in_required: sponsorProfile.live_in_required,
          working_hours_per_day: sponsorProfile.working_hours_per_day,
          days_off_per_week: sponsorProfile.days_off_per_week,
          room_amenities: sponsorProfile.room_amenities || [],
          identity_verified: sponsorProfile.identity_verified,
          background_check_completed: sponsorProfile.background_check_completed,
          profile_completed: sponsorProfile.profile_completed,
          onboarding_completed: sponsorProfile.onboarding_completed,
          total_hires: sponsorProfile.total_hires || 0,
          active_job_postings: sponsorProfile.active_job_postings || 0,
          sponsor_created_at: sponsorProfile.created_at,
          sponsor_updated_at: sponsorProfile.updated_at,
        };
      });

      setSponsorsData(transformedData);
      setTotalCount(count || 0);

      await logAdminActivity('sponsors_page_view', 'admin_users', 'sponsors');
    } catch (err) {
      logger.error('Failed to fetch sponsors:', err);
      setError('Failed to load sponsor data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load sponsors. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, verificationFilter, subscriptionFilter, logAdminActivity]);

  // Fetch stats for summary cards
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_SPONSOR_STATS,
        fetchPolicy: 'network-only'
      });

      if (data) {
        setStats({
          total: data.total?.aggregate?.count || 0,
          verified: data.verified?.aggregate?.count || 0,
          pending: data.pending?.aggregate?.count || 0,
          rejected: data.rejected?.aggregate?.count || 0,
          premium: data.premium?.aggregate?.count || 0,
          monthly: data.monthly?.aggregate?.count || 0
        });
      }
    } catch (err) {
      logger.error('Failed to fetch sponsor stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchSponsors();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, verificationFilter, subscriptionFilter]);

  // Handle verification action - opens verification dialog with message
  const handleVerificationAction = (sponsorId, action) => {
    const sponsor = sponsorsData.find(s => s.id === sponsorId);
    if (sponsor) {
      openVerificationDialog(sponsor, action);
    }
  };

  const getVerificationBadge = (status) => {
    const statusConfig = {
      verified: { label: 'Verified', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getSubscriptionBadge = (status) => {
    // Normalize the status to lowercase for matching
    const normalizedStatus = (status || '').toLowerCase().trim();

    // Match actual subscription tiers from stripeConfig:
    // Sponsor: free, pro (Weekly), monthly (Monthly), premium (Premium), twoMonths (2 Months Bundle)
    const statusConfig = {
      premium: { label: 'Premium', color: 'bg-purple-100 text-purple-800' },
      monthly: { label: 'Monthly', color: 'bg-blue-100 text-blue-800' },
      pro: { label: 'Weekly', color: 'bg-indigo-100 text-indigo-800' },
      weekly: { label: 'Weekly', color: 'bg-indigo-100 text-indigo-800' },
      twomonths: { label: '2 Months', color: 'bg-teal-100 text-teal-800' },
      free: { label: 'Free', color: 'bg-gray-100 text-gray-800' },
      basic: { label: 'Free', color: 'bg-gray-100 text-gray-800' }, // Map basic to free
    };

    const config = statusConfig[normalizedStatus] || statusConfig.free;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const SponsorDetailDialog = ({ sponsor, open, onOpenChange }) => {
    const [docVerification, setDocVerification] = useState(null);
    const [docsLoading, setDocsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMissingItems, setSelectedMissingItems] = useState(new Set());
    const loadedSponsorIdRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Fetch sponsor document verification when dialog opens
    useEffect(() => {
      if (!sponsor?.id || !open) return;
      if (loadedSponsorIdRef.current === sponsor.id) return;

      let cancelled = false;
      const fetchDocs = async () => {
        setDocsLoading(true);
        loadedSponsorIdRef.current = sponsor.id;
        try {
          const { data } = await apolloClient.query({
            query: GET_SPONSOR_DOC_VERIFICATION,
            variables: { sponsor_id: sponsor.id },
            fetchPolicy: 'network-only',
          });
          if (!cancelled) {
            setDocVerification(data?.sponsor_document_verification?.[0] || null);
          }
        } catch (err) {
          logger.error('Failed to fetch sponsor doc verification:', err);
          if (!cancelled) setDocVerification(null);
        } finally {
          if (!cancelled) setDocsLoading(false);
        }
      };
      fetchDocs();
      return () => { cancelled = true; };
    }, [sponsor?.id, open]);

    // Reset when dialog closes
    useEffect(() => {
      if (!open) {
        loadedSponsorIdRef.current = null;
        setDocVerification(null);
        setSelectedMissingItems(new Set());
      }
    }, [open]);

    // Refresh sponsor data
    const refreshSponsorData = async () => {
      if (!sponsor?.id) return;
      setRefreshing(true);
      try {
        loadedSponsorIdRef.current = null;
        const { data } = await apolloClient.query({
          query: GET_SPONSOR_DOC_VERIFICATION,
          variables: { sponsor_id: sponsor.id },
          fetchPolicy: 'network-only',
        });
        setDocVerification(data?.sponsor_document_verification?.[0] || null);
        loadedSponsorIdRef.current = sponsor.id;
        toast({
          title: 'Profile Refreshed',
          description: 'Sponsor documents and profile have been re-checked.',
        });
      } catch (error) {
        logger.error('Error refreshing sponsor data:', error);
        toast({
          title: 'Refresh Failed',
          description: 'Failed to refresh profile data.',
          variant: 'destructive',
        });
      } finally {
        setRefreshing(false);
      }
    };

    if (!sponsor) return null;

    const formatBenefits = (benefits) => {
      const labels = { food: 'Food', housing: 'Housing', insurance: 'Insurance', annual_leave: 'Annual Leave', ticket_home: 'Ticket Home', phone: 'Phone' };
      return benefits.map(b => labels[b] || b.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    };

    const formatAmenities = (amenities) => {
      const labels = { private_room: 'Private Room', private_bathroom: 'Private Bathroom', ac: 'A/C', tv: 'TV', wifi: 'Wi-Fi', window: 'Window' };
      return amenities.map(a => labels[a] || a.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    };

    const InfoRow = ({ icon: Icon, label, value, className = '' }) => (
      <div className={`flex items-start gap-2 ${className}`}>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium truncate">{value || '—'}</p>
        </div>
      </div>
    );

    // Enrich sponsor with docVerification for requirements checks
    const sponsorWithDocs = { ...sponsor, _docVerification: docVerification };

    // Calculate profile status from requirements
    const profileStatus = sponsorProfileRequirements.map(req => ({
      ...req,
      isComplete: req.check(sponsorWithDocs)
    }));

    const completedCount = profileStatus.filter(s => s.isComplete).length;
    const requiredMissing = profileStatus.filter(s => s.required && !s.isComplete);
    const allMissing = profileStatus.filter(s => !s.isComplete);
    const isEligibleForApproval = requiredMissing.length === 0 && !docsLoading;

    const requiredCount = sponsorProfileRequirements.filter(r => r.required).length;
    const requiredCompleteCount = profileStatus.filter(s => s.required && s.isComplete).length;
    const completenessPercent = Math.round((completedCount / sponsorProfileRequirements.length) * 100);

    const isVerified = sponsor.verification_status === 'verified';
    const isPending = sponsor.verification_status === 'pending' || !sponsor.verification_status;

    const docVerifStatus = docVerification?.verification_status;

    // Toggle missing item selection (preserves scroll position)
    const toggleMissingItem = (key) => {
      const scrollTop = scrollContainerRef.current?.scrollTop || 0;
      const newSelected = new Set(selectedMissingItems);
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
      setSelectedMissingItems(newSelected);
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollTop;
        }
      });
    };

    const selectAllMissing = () => {
      const scrollTop = scrollContainerRef.current?.scrollTop || 0;
      setSelectedMissingItems(new Set(allMissing.map(m => m.key)));
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollTop;
        }
      });
    };

    const clearSelection = () => {
      const scrollTop = scrollContainerRef.current?.scrollTop || 0;
      setSelectedMissingItems(new Set());
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollTop;
        }
      });
    };

    // Generate rejection message with selected missing items
    const generateRejectionMessage = () => {
      const selectedItems = profileStatus.filter(s => selectedMissingItems.has(s.key));
      if (selectedItems.length === 0) {
        return defaultMessages.reject.replace(/{name}/g, sponsor.full_name || 'User');
      }

      const requiredItems = selectedItems.filter(i => sponsorProfileRequirements.find(r => r.key === i.key)?.required);
      const optionalItems = selectedItems.filter(i => !sponsorProfileRequirements.find(r => r.key === i.key)?.required);

      let message = `Dear ${sponsor.full_name || 'User'},

We have reviewed your profile and found that it is incomplete. To get your profile approved, please update the following information:

`;

      if (requiredItems.length > 0) {
        message += `**Required Information (Must Complete):**
${requiredItems.map(item => `- ${item.label}`).join('\n')}

`;
      }

      if (optionalItems.length > 0) {
        message += `**Recommended Information:**
${optionalItems.map(item => `- ${item.label}`).join('\n')}

`;
      }

      message += `Please log in to your account and update your profile with the missing information. Once completed, your profile will be reviewed again for approval.

If you have any questions, please contact our support team.

Best regards,
Ethiopian Maids Platform Team`;

      return message;
    };

    // Handle reject with selected items
    const handleRejectWithMissingItems = () => {
      const customMessage = generateRejectionMessage();
      setVerificationDialog({
        open: true,
        sponsor,
        action: 'reject',
        message: customMessage
      });
      onOpenChange(false);
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          {/* Fixed Header - Gradient style like maid dialog */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b shrink-0">
            <DialogHeader className="mb-0">
              <DialogTitle className="flex items-start gap-4">
                {/* Large Avatar with status indicator */}
                <div className="relative shrink-0">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                    <AvatarImage src={sponsor.avatar_url} />
                    <AvatarFallback className="text-xl bg-gradient-to-br from-blue-100 to-purple-100 text-purple-700">
                      {(sponsor.full_name || 'U').split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${isVerified ? 'bg-green-500' : isPending ? 'bg-orange-400' : 'bg-red-500'}`}>
                    {isVerified ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> :
                     isPending ? <Clock className="h-3.5 w-3.5 text-white" /> :
                     <XCircle className="h-3.5 w-3.5 text-white" />}
                  </div>
                </div>

                {/* Name + Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xl font-bold">{sponsor.full_name}</p>
                    {getVerificationBadge(sponsor.verification_status)}
                    {getSubscriptionBadge(sponsor.subscription_status)}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                    {sponsor.occupation && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /> {sponsor.occupation}
                        {sponsor.company && ` at ${sponsor.company}`}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {sponsor.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {sponsor.email}
                    </span>
                  </div>
                  {/* Status badges row */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {sponsor.onboarding_completed && (
                      <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Onboarding Done
                      </Badge>
                    )}
                    {sponsor.profile_completed && (
                      <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Profile Complete
                      </Badge>
                    )}
                    {sponsor.household_size && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" /> {sponsor.household_size} members
                      </Badge>
                    )}
                  </div>
                  {/* Profile completion bar */}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Profile: {completenessPercent}%</span>
                    <Progress value={completenessPercent} className="h-2 flex-1" />
                    <span className="text-xs font-medium">{completedCount}/{sponsorProfileRequirements.length}</span>
                  </div>
                </div>

                {/* Quick Stats & Refresh Button */}
                <div className="flex-shrink-0 text-right hidden lg:block">
                  <div className="flex items-center gap-2 justify-end mb-2">
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                      <FileText className="h-3 w-3" />
                      {requiredCompleteCount}/{requiredCount} Required
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshSponsorData}
                      disabled={refreshing}
                      className="h-8"
                    >
                      {refreshing ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      {refreshing ? 'Checking...' : 'Refresh'}
                    </Button>
                  </div>
                  {docsLoading && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center justify-end gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading documents...
                    </p>
                  )}
                </div>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Sponsor profile details and verification
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable Content - 3 column layout like maid dialog */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" tabIndex={-1}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* LEFT COLUMN - Profile details (2 cols) */}
              <div className="lg:col-span-2 space-y-4">

                {/* Identity & Documents Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Camera className="h-4 w-4" /> Identity Verification
                      <span className="ml-auto">
                        {docVerifStatus === 'verified'
                          ? <Badge className="bg-green-100 text-green-800 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                          : docVerifStatus === 'pending'
                            ? <Badge className="bg-yellow-100 text-yellow-800 text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                            : docVerifStatus === 'rejected'
                              ? <Badge className="bg-red-100 text-red-800 text-xs"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
                              : <Badge variant="outline" className="text-gray-500 text-xs">Not Submitted</Badge>}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {docsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading documents...</span>
                      </div>
                    ) : (
                      <>
                        {/* Document thumbnails grid - maid dialog style */}
                        <div className="grid grid-cols-4 gap-3">
                          {/* Face Photo */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">Face Photo</p>
                            {sponsor.avatar_url ? (
                              <a href={sponsor.avatar_url} target="_blank" rel="noopener noreferrer" className="block group">
                                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border bg-gray-50">
                                  <img src={sponsor.avatar_url} alt="Face Photo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                  <div className="hidden absolute inset-0 flex-col items-center justify-center bg-gray-100 text-gray-400">
                                    <Camera className="h-6 w-6" />
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                  </div>
                                  <Badge className="absolute top-1 right-1 bg-green-500 text-white text-[9px] px-1 py-0">Uploaded</Badge>
                                </div>
                              </a>
                            ) : (
                              <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
                                <Camera className="h-6 w-6 mb-1" />
                                <span className="text-[10px]">Missing</span>
                              </div>
                            )}
                          </div>

                          {/* ID Front */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5 truncate">
                              ID Front{docVerification?.id_type ? ` (${docVerification.id_type.replace(/_/g, ' ')})` : ''}
                            </p>
                            {docVerification?.id_file_front_url ? (
                              <a href={docVerification.id_file_front_url} target="_blank" rel="noopener noreferrer" className="block group">
                                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border bg-gray-50">
                                  <img src={docVerification.id_file_front_url} alt="ID Front" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                  <div className="hidden absolute inset-0 flex-col items-center justify-center bg-gray-100 text-gray-400">
                                    <FileText className="h-6 w-6" />
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                  </div>
                                  <Badge className="absolute top-1 right-1 bg-blue-500 text-white text-[9px] px-1 py-0">ID</Badge>
                                </div>
                              </a>
                            ) : (
                              <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-red-200 flex flex-col items-center justify-center text-red-300">
                                <FileText className="h-6 w-6 mb-1" />
                                <span className="text-[10px]">Missing</span>
                              </div>
                            )}
                          </div>

                          {/* ID Back */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">ID Back</p>
                            {docVerification?.id_file_back_url ? (
                              <a href={docVerification.id_file_back_url} target="_blank" rel="noopener noreferrer" className="block group">
                                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border bg-gray-50">
                                  <img src={docVerification.id_file_back_url} alt="ID Back" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                  <div className="hidden absolute inset-0 flex-col items-center justify-center bg-gray-100 text-gray-400">
                                    <FileText className="h-6 w-6" />
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                  </div>
                                  <Badge className="absolute top-1 right-1 bg-blue-500 text-white text-[9px] px-1 py-0">ID</Badge>
                                </div>
                              </a>
                            ) : (
                              <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-red-200 flex flex-col items-center justify-center text-red-300">
                                <FileText className="h-6 w-6 mb-1" />
                                <span className="text-[10px]">Missing</span>
                              </div>
                            )}
                          </div>

                          {/* Employment Proof */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5 truncate">
                              Employment{docVerification?.employment_proof_type ? ` (${docVerification.employment_proof_type.replace(/_/g, ' ')})` : ''}
                            </p>
                            {docVerification?.employment_proof_url ? (
                              <a href={docVerification.employment_proof_url} target="_blank" rel="noopener noreferrer" className="block group">
                                <div className="relative aspect-[4/3] rounded-lg overflow-hidden border bg-gray-50">
                                  <img src={docVerification.employment_proof_url} alt="Employment Proof" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                  <div className="hidden absolute inset-0 flex-col items-center justify-center bg-gray-100 text-gray-400">
                                    <Briefcase className="h-6 w-6" />
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                  </div>
                                  <Badge className="absolute top-1 right-1 bg-purple-500 text-white text-[9px] px-1 py-0">Proof</Badge>
                                </div>
                              </a>
                            ) : (
                              <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
                                <Briefcase className="h-6 w-6 mb-1" />
                                <span className="text-[10px]">Optional</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Document metadata */}
                        {docVerification && (
                          <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t">
                            <InfoRow icon={FileText} label="ID Type" value={docVerification.id_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                            <InfoRow icon={Shield} label="ID Number" value={docVerification.id_number} />
                            <InfoRow icon={Globe} label="Residence" value={docVerification.residence_country} />
                            <InfoRow icon={Phone} label="Phone" value={docVerification.contact_phone} />
                          </div>
                        )}
                        {!docVerification && !docsLoading && (
                          <p className="text-xs text-muted-foreground text-center mt-3 pt-3 border-t">
                            No identity documents submitted yet.
                            {sponsor.avatar_url ? ' Face photo is available from onboarding.' : ''}
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Contact & Location */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Contact & Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoRow icon={Mail} label="Email" value={sponsor.email} />
                      <InfoRow icon={Phone} label="Phone" value={sponsor.phone !== 'N/A' ? sponsor.phone : null} />
                      <InfoRow icon={Globe} label="Country" value={sponsor.location?.split(', ').pop()} />
                      <InfoRow icon={MapPin} label="City" value={sponsor.location?.split(', ')[0]} />
                      <InfoRow icon={Home} label="Property Type" value={sponsor.accommodation_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                      {sponsor.address && <InfoRow icon={MapPin} label="Full Address" value={sponsor.address} />}
                    </div>
                  </CardContent>
                </Card>

                {/* Personal & Work Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" /> Personal & Work
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoRow icon={Briefcase} label="Occupation" value={sponsor.occupation} />
                      <InfoRow icon={Building2} label="Company" value={sponsor.company} />
                      <InfoRow icon={Heart} label="Religion" value={sponsor.religion} />
                      <InfoRow icon={Users} label="Household Size" value={sponsor.household_size ? `${sponsor.household_size} members` : null} />
                      <InfoRow icon={Baby} label="Children" value={sponsor.number_of_children != null ? `${sponsor.number_of_children}` : null} />
                      <InfoRow label="Elderly Care" value={sponsor.elderly_care_needed ? 'Yes' : 'No'} />
                    </div>
                    {sponsor.children_ages?.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1.5">Children Ages</p>
                        <div className="flex flex-wrap gap-1">
                          {sponsor.children_ages.map((age, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{age}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Hiring Preferences */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Filter className="h-4 w-4" /> Hiring Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Preferred Nationalities</p>
                      <div className="flex flex-wrap gap-1">
                        {(sponsor.preferred_nationality || []).length > 0
                          ? sponsor.preferred_nationality.map((n, i) => <Badge key={i} variant="outline" className="text-xs">{n}</Badge>)
                          : <span className="text-xs text-muted-foreground italic">No preference</span>
                        }
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Preferred Languages</p>
                      <div className="flex flex-wrap gap-1">
                        {(sponsor.preferred_languages || []).length > 0
                          ? sponsor.preferred_languages.map((l, i) => <Badge key={i} variant="secondary" className="text-xs">{l}</Badge>)
                          : <span className="text-xs text-muted-foreground italic">No preference</span>
                        }
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Required Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {(sponsor.required_skills || []).length > 0
                          ? sponsor.required_skills.map((s, i) => <Badge key={i} className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200">{s}</Badge>)
                          : <span className="text-xs text-muted-foreground italic">None specified</span>
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Budget, Contract & Accommodation */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Budget & Accommodation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoRow icon={Banknote} label="Salary Budget" value={
                        sponsor.salary_budget_min || sponsor.salary_budget_max
                          ? `${sponsor.currency || 'AED'} ${sponsor.salary_budget_min || 0} - ${sponsor.salary_budget_max || 0}`
                          : null
                      } />
                      <InfoRow icon={Calendar} label="Payment" value={sponsor.payment_frequency?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                      <InfoRow icon={FileText} label="Contract" value={sponsor.contract_duration?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                      <InfoRow icon={Home} label="Living" value={
                        sponsor.live_in_required === true ? 'Live-in' :
                        sponsor.live_in_required === false ? 'Live-out' : null
                      } />
                      <InfoRow icon={Clock} label="Hours" value={sponsor.working_hours_per_day ? `${sponsor.working_hours_per_day} hrs/day` : null} />
                      <InfoRow icon={Calendar} label="Days Off" value={sponsor.days_off_per_week ? `${sponsor.days_off_per_week}/week` : null} />
                    </div>
                    {(sponsor.additional_benefits || []).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1.5">Benefits Offered</p>
                        <div className="flex flex-wrap gap-1">
                          {formatBenefits(sponsor.additional_benefits).map((b, i) => (
                            <Badge key={i} variant="outline" className="text-xs text-green-600 border-green-300">{b}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {(sponsor.room_amenities || []).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1.5">Room Amenities</p>
                        <div className="flex flex-wrap gap-1">
                          {formatAmenities(sponsor.room_amenities).map((a, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activity Stats - Bottom */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Activity & Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{sponsor.total_hires || 0}</p>
                        <p className="text-xs text-muted-foreground">Total Hires</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{sponsor.active_job_postings || 0}</p>
                        <p className="text-xs text-muted-foreground">Active Posts</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">${sponsor.total_spent || 0}</p>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                      </div>
                      <div>
                        {sponsor.rating > 0 ? (
                          <>
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-2xl font-bold">{sponsor.rating}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{sponsor.total_reviews || 0} reviews</p>
                          </>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-muted-foreground">—</p>
                            <p className="text-xs text-muted-foreground">No Rating</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t">
                      <span>Registered: {sponsor.created_at ? new Date(sponsor.created_at).toLocaleDateString() : '—'}</span>
                      <span>Last active: {sponsor.last_active ? new Date(sponsor.last_active).toLocaleDateString() : '—'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT COLUMN - Verification & Actions sidebar */}
              <div className="space-y-4">
                {/* Verification Status Card */}
                <Card className={`overflow-hidden ${
                  isEligibleForApproval
                    ? 'border-green-300 shadow-green-100 shadow-md'
                    : 'border-orange-300 shadow-orange-100 shadow-md'
                }`}>
                  <div className={`px-4 py-3 ${isEligibleForApproval ? 'bg-green-500' : 'bg-orange-500'}`}>
                    <div className="flex items-center justify-between text-white">
                      <span className="font-semibold text-sm">Verification Status</span>
                      {isEligibleForApproval ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <div className="text-center mb-4">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                        isEligibleForApproval ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        <span className={`text-2xl font-bold ${
                          isEligibleForApproval ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {requiredCompleteCount}/{requiredCount}
                        </span>
                      </div>
                      <p className={`text-sm mt-2 font-medium ${
                        isEligibleForApproval ? 'text-green-700' : 'text-orange-700'
                      }`}>
                        {isEligibleForApproval ? 'Ready for Approval' : `${requiredMissing.length} Required Missing`}
                      </p>
                    </div>

                    {/* Progress Ring */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Profile Completion</span>
                        <span>{completedCount}/{sponsorProfileRequirements.length}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isEligibleForApproval ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${(completedCount / sponsorProfileRequirements.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Required Requirements List */}
                    <div className="max-h-48 overflow-y-auto space-y-1 mb-4 pr-1">
                      {profileStatus.filter(s => s.required).map((item) => (
                        <div
                          key={item.key}
                          className={`flex items-center gap-2 py-1.5 px-2 rounded text-xs ${
                            item.isComplete ? 'bg-green-50' : 'bg-red-50'
                          }`}
                        >
                          {item.isComplete ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                          )}
                          <span className={`flex-1 ${item.isComplete ? 'text-green-700' : 'text-red-700'}`}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {docVerification?.submission_count > 0 && (
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                        Docs submitted {docVerification.submission_count}x
                        {docVerification.last_submission_at && ` — ${new Date(docVerification.last_submission_at).toLocaleDateString()}`}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Missing Items Selection */}
                {allMissing.length > 0 && (
                  <Card className="border-slate-200">
                    <CardHeader className="pb-2 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Select Missing Items
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAllMissing}>
                            All
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearSelection}>
                            None
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {allMissing.map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-50 cursor-pointer text-xs"
                          >
                            <Checkbox
                              checked={selectedMissingItems.has(item.key)}
                              onCheckedChange={() => toggleMissingItem(item.key)}
                              className="h-3.5 w-3.5"
                              onFocus={(e) => e.preventDefault()}
                            />
                            <span className="flex-1 text-slate-700">{item.label}</span>
                            {item.required && (
                              <span className="text-[10px] text-red-500 font-medium">REQ</span>
                            )}
                          </label>
                        ))}
                      </div>
                      {selectedMissingItems.size > 0 && (
                        <p className="text-xs text-orange-600 mt-2 font-medium">
                          {selectedMissingItems.size} item(s) will be included in rejection
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <Card className="border-2 border-slate-200">
                  <CardContent className="pt-4 space-y-2">
                    {/* Refresh notice when documents are loading */}
                    {(docsLoading || refreshing) && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-blue-700 text-sm mb-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{refreshing ? 'Refreshing profile data...' : 'Checking documents...'}</span>
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        openVerificationDialog(sponsor, 'approve');
                        onOpenChange(false);
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm"
                      disabled={!isEligibleForApproval || refreshing}
                      size="lg"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {isEligibleForApproval ? 'Approve Profile' : `Approve (${requiredMissing.length} missing)`}
                    </Button>

                    <Button
                      onClick={handleRejectWithMissingItems}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-sm"
                      size="lg"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Reject {selectedMissingItems.size > 0 && `(${selectedMissingItems.size})`}
                    </Button>

                    <Button
                      onClick={() => {
                        openVerificationDialog(sponsor, 'pending');
                        onOpenChange(false);
                      }}
                      variant="outline"
                      className="w-full border-slate-300"
                      size="lg"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Set Pending
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Loading state
  if (loading && sponsorsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sponsors data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && sponsorsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchSponsors}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sponsor Management</h1>
          <p className="text-muted-foreground">Manage and monitor all sponsor profiles</p>
        </div>
        <Button onClick={fetchSponsors} variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Verification Filter */}
            <Select value={verificationFilter} onValueChange={(value) => {
              setVerificationFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verifications</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Subscription Filter */}
            <Select value={subscriptionFilter} onValueChange={(value) => {
              setSubscriptionFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="pro">Weekly</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary - Using real database counts */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sponsors</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Premium</p>
                <p className="text-2xl font-bold text-purple-600">{stats.premium}</p>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly</p>
                <p className="text-2xl font-bold text-blue-600">{stats.monthly}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sponsors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsors List</CardTitle>
          <CardDescription>
            Showing {sponsorsData.length} of {totalCount} total sponsors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sponsorsData.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Sponsors Found"
              description={searchTerm || verificationFilter !== 'all' || subscriptionFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No sponsor profiles in the database yet'}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Household</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sponsorsData.map((sponsor) => (
                    <TableRow key={sponsor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={sponsor.avatar_url} />
                            <AvatarFallback>
                              {sponsor.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{sponsor.full_name}</p>
                            <p className="text-sm text-muted-foreground">{sponsor.property_type || 'N/A'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{sponsor.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{sponsor.household_size || 'N/A'} members</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">{sponsor.active_bookings || 0}</span> active
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {sponsor.completed_bookings || 0} completed
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getVerificationBadge(sponsor.verification_status)}</TableCell>
                      <TableCell>{getSubscriptionBadge(sponsor.subscription_status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSponsor(sponsor);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {sponsor.verification_status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleVerificationAction(sponsor.id, 'approve')}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleVerificationAction(sponsor.id, 'reject')}>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({totalCount} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <SponsorDetailDialog
        sponsor={selectedSponsor}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Verification Dialog with Message */}
      <Dialog
        open={verificationDialog.open}
        onOpenChange={(open) => {
          if (!open && !verificationProcessing) {
            setVerificationDialog({ open: false, sponsor: null, action: '', message: '' });
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {verificationDialog.action === 'approve' && (
                <>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <span>Approve Verification</span>
                </>
              )}
              {verificationDialog.action === 'reject' && (
                <>
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <UserX className="h-5 w-5 text-red-600" />
                  </div>
                  <span>Reject Verification</span>
                </>
              )}
              {verificationDialog.action === 'pending' && (
                <>
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span>Set to Pending</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {verificationDialog.sponsor && (
                <span className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={verificationDialog.sponsor.avatar_url} />
                    <AvatarFallback>
                      {verificationDialog.sponsor.full_name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{verificationDialog.sponsor.full_name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    Current status: {verificationDialog.sponsor.verification_status || 'pending'}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="verification-message" className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message to User
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                This message will be sent to the user via WhatsApp and in-app notification.
              </p>
              <Textarea
                id="verification-message"
                value={verificationDialog.message}
                onChange={(e) => setVerificationDialog(prev => ({ ...prev, message: e.target.value }))}
                className="min-h-[250px] font-mono text-sm"
                placeholder="Enter message to send to the user..."
              />
            </div>

            {verificationDialog.action === 'approve' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  The sponsor will be verified and can browse/hire domestic workers.
                </p>
              </div>
            )}

            {verificationDialog.action === 'reject' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  The sponsor's profile will be rejected. Make sure to specify a clear reason in the message.
                </p>
              </div>
            )}

            {verificationDialog.action === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  The sponsor's status will be set to pending and they will be notified.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setVerificationDialog({ open: false, sponsor: null, action: '', message: '' })}
              disabled={verificationProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerificationWithMessage}
              disabled={verificationProcessing || !verificationDialog.message.trim()}
              className={
                verificationDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                verificationDialog.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-yellow-600 hover:bg-yellow-700'
              }
            >
              {verificationProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {verificationDialog.action === 'approve' && 'Approve & Send Message'}
                  {verificationDialog.action === 'reject' && 'Reject & Send Reason'}
                  {verificationDialog.action === 'pending' && 'Set Pending & Notify'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSponsorsPage;
