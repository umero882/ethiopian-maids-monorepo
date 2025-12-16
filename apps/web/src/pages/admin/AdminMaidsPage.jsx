/**
 * AdminMaidsPage - Production Version
 * Manages maid profiles with real-time GraphQL/Hasura data using polling
 * Enhanced with bulk actions, advanced filters, sorting, and export
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import logger from '@/utils/logger';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Eye,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  AlertTriangle,
  Download,
  Loader2,
  RefreshCw,
  Activity,
  Globe,
  Briefcase,
  FileText,
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit,
  MessageSquare,
  History,
  Shield,
  Award,
  TrendingUp,
  ArrowUpDown,
  CheckSquare,
  Square,
  StickyNote,
  Send
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';


// GraphQL Query - OPTIMIZED for list view (only essential fields)
const GET_MAIDS_QUERY = gql`
  query GetMaids($limit: Int!, $offset: Int!, $where: maid_profiles_bool_exp, $order_by: [maid_profiles_order_by!]) {
    maid_profiles(
      where: $where
      order_by: $order_by
      limit: $limit
      offset: $offset
    ) {
      id
      user_id
      full_name
      phone_number
      phone_country_code
      nationality
      country
      current_location
      profile_photo_url
      primary_image_processed_url
      primary_profession
      experience_years
      availability_status
      verification_status
      is_approved
      is_agency_managed
      agency_id
      average_rating
      profile_completion_percentage
      created_at
      updated_at
    }
    maid_profiles_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// Stats query for dashboard cards
const GET_MAID_STATS_QUERY = gql`
  query GetMaidStats {
    total: maid_profiles_aggregate {
      aggregate { count }
    }
    available: maid_profiles_aggregate(where: { availability_status: { _eq: "available" } }) {
      aggregate { count }
    }
    busy: maid_profiles_aggregate(where: { availability_status: { _eq: "busy" } }) {
      aggregate { count }
    }
    verified: maid_profiles_aggregate(where: { verification_status: { _eq: "verified" } }) {
      aggregate { count }
    }
    pending: maid_profiles_aggregate(where: { verification_status: { _eq: "pending" } }) {
      aggregate { count }
    }
    rejected: maid_profiles_aggregate(where: { verification_status: { _eq: "rejected" } }) {
      aggregate { count }
    }
  }
`;

const UPDATE_MAID_VERIFICATION_MUTATION = gql`
  mutation UpdateMaidVerification($id: String!, $verification_status: String!) {
    update_maid_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { verification_status: $verification_status }
    ) {
      id
      verification_status
    }
  }
`;

const UPDATE_MAID_STATUS_MUTATION = gql`
  mutation UpdateMaidStatus($id: String!, $availability_status: String!) {
    update_maid_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { availability_status: $availability_status }
    ) {
      id
      availability_status
    }
  }
`;

// Bulk update mutations
const BULK_UPDATE_VERIFICATION = gql`
  mutation BulkUpdateVerification($ids: [String!]!, $verification_status: String!) {
    update_maid_profiles(
      where: { id: { _in: $ids } }
      _set: { verification_status: $verification_status }
    ) {
      affected_rows
      returning { id verification_status }
    }
  }
`;

const BULK_UPDATE_STATUS = gql`
  mutation BulkUpdateStatus($ids: [String!]!, $availability_status: String!) {
    update_maid_profiles(
      where: { id: { _in: $ids } }
      _set: { availability_status: $availability_status }
    ) {
      affected_rows
      returning { id availability_status }
    }
  }
`;

// Get distinct nationalities for filter
const GET_NATIONALITIES = gql`
  query GetNationalities {
    maid_profiles(distinct_on: nationality, where: { nationality: { _is_null: false } }) {
      nationality
    }
  }
`;

// Get distinct locations for filter
const GET_LOCATIONS = gql`
  query GetLocations {
    maid_profiles(distinct_on: current_location, where: { current_location: { _is_null: false } }) {
      current_location
    }
  }
`;

// Common nationalities as fallback
const COMMON_NATIONALITIES = [
  'Ethiopian',
  'Filipino',
  'Indonesian',
  'Sri Lankan',
  'Indian',
  'Kenyan',
  'Ugandan',
  'Nepalese'
];

// Notification mutations
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

const CREATE_MULTIPLE_NOTIFICATIONS_MUTATION = gql`
  mutation CreateMultipleNotifications($data: [notifications_insert_input!]!) {
    insert_notifications(objects: $data) {
      affected_rows
      returning {
        id
        user_id
        type
        title
        message
        priority
        created_at
      }
    }
  }
`;

// Query to get agency details for agency-managed maids
const GET_AGENCY_BY_ID = gql`
  query GetAgencyById($id: String!) {
    agency_profiles_by_pk(id: $id) {
      id
      full_name
      business_email
      business_phone
      phone
      authorized_person_email
      authorized_person_phone
      authorized_person_name
      emergency_contact_phone
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

// Query to fetch maid documents (passport/ID) for verification
const GET_MAID_DOCUMENTS = gql`
  query GetMaidDocuments($maidId: String!) {
    maid_documents(
      where: { maid_id: { _eq: $maidId } }
      order_by: { created_at: desc }
    ) {
      id
      maid_id
      document_type
      document_name
      document_url
      file_url
      file_path
      title
      type
      verified
      created_at
    }
  }
`;

// Query to fetch single maid profile by ID for refresh
const GET_MAID_BY_ID = gql`
  query GetMaidById($id: String!) {
    maid_profiles_by_pk(id: $id) {
      id
      user_id
      full_name
      first_name
      middle_name
      last_name
      phone_number
      phone_country_code
      phone_verified
      phone_verified_at
      alternative_phone
      nationality
      country
      iso_country_code
      current_location
      state_province
      suburb
      street_address
      profile_photo_url
      primary_image_original_url
      primary_image_processed_url
      primary_image_processed
      introduction_video_url
      video_duration
      date_of_birth
      marital_status
      children_count
      religion
      religion_other
      primary_profession
      primary_profession_other
      experience_years
      skills
      special_skills
      languages
      key_responsibilities
      additional_services
      work_preferences
      work_history
      education_level
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      contract_duration_preference
      live_in_preference
      available_from
      passport_number
      passport_number_encrypted
      passport_expiry
      national_id_encrypted
      national_id_hash
      visa_status
      current_visa_status
      current_visa_status_other
      medical_certificate_valid
      police_clearance_valid
      availability_status
      verification_status
      is_approved
      is_agency_managed
      agency_id
      agency_badge
      average_rating
      profile_completion_percentage
      total_applications
      successful_placements
      profile_views
      about_me
      additional_notes
      previous_countries
      two_factor_enabled
      two_factor_method
      created_at
      updated_at
    }
  }
`;

const AdminMaidsPage = () => {
  const { logAdminActivity } = useAdminAuth();
  const [maidsData, setMaidsData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedMaid, setSelectedMaid] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [nationalities, setNationalities] = useState(COMMON_NATIONALITIES);
  const [locations, setLocations] = useState([]);
  const itemsPerPage = 20;

  // Sorting state
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkActionDialog, setBulkActionDialog] = useState({ open: false, action: '', title: '' });
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Notes dialog state
  const [notesDialog, setNotesDialog] = useState({ open: false, maid: null });
  const [noteText, setNoteText] = useState('');

  // Export state
  const [exporting, setExporting] = useState(false);

  // Verification dialog state
  const [verificationDialog, setVerificationDialog] = useState({
    open: false,
    maid: null,
    action: '', // 'approve', 'reject', 'pending'
    message: ''
  });
  const [verificationProcessing, setVerificationProcessing] = useState(false);

  // Document preview state (moved to parent to avoid nested dialog issues)
  const [documentPreview, setDocumentPreview] = useState({ open: false, document: null, maidName: '' });

  // Default messages for verification actions
  const defaultMessages = {
    approve: `Dear {name},

Congratulations! Your profile has been verified and approved on Ethiopian Maids Platform.

You can now:
- Appear in search results for employers
- Receive job applications and inquiries
- Access all platform features

Welcome to our community! We wish you success in finding the perfect job opportunity.

Best regards,
Ethiopian Maids Platform Team`,

    reject: `Dear {name},

We regret to inform you that your profile verification was not successful at this time.

Reason: [Please specify the reason]

To improve your profile, please:
- Ensure all information is accurate and complete
- Upload clear profile photos
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
- Upload additional documents
- Update your skills and experience

We will notify you once your profile has been reviewed.

Best regards,
Ethiopian Maids Platform Team`
  };

  // Build where clause for filtering
  const buildWhereClause = useCallback(() => {
    const conditions = {};

    // Apply search filter
    if (searchTerm) {
      conditions._or = [
        { full_name: { _ilike: `%${searchTerm}%` } },
        { phone_number: { _ilike: `%${searchTerm}%` } },
        { nationality: { _ilike: `%${searchTerm}%` } },
        { primary_profession: { _ilike: `%${searchTerm}%` } }
      ];
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      conditions.availability_status = { _eq: statusFilter };
    }

    // Apply verification filter
    if (verificationFilter !== 'all') {
      conditions.verification_status = { _eq: verificationFilter };
    }

    // Apply nationality filter
    if (nationalityFilter !== 'all') {
      conditions.nationality = { _eq: nationalityFilter };
    }

    // Apply location filter
    if (locationFilter !== 'all') {
      conditions.current_location = { _eq: locationFilter };
    }

    // Apply experience filter
    if (experienceFilter !== 'all') {
      switch (experienceFilter) {
        case 'entry':
          conditions.experience_years = { _lte: 1 };
          break;
        case 'junior':
          conditions._and = [
            { experience_years: { _gt: 1 } },
            { experience_years: { _lte: 3 } }
          ];
          break;
        case 'mid':
          conditions._and = [
            { experience_years: { _gt: 3 } },
            { experience_years: { _lte: 5 } }
          ];
          break;
        case 'senior':
          conditions.experience_years = { _gt: 5 };
          break;
      }
    }

    return Object.keys(conditions).length > 0 ? conditions : null;
  }, [searchTerm, statusFilter, verificationFilter, nationalityFilter, locationFilter, experienceFilter]);

  // Build order by clause
  const buildOrderBy = useCallback(() => {
    return [{ [sortField]: sortOrder }];
  }, [sortField, sortOrder]);

  // Toggle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Fetch nationalities and locations on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      // Fetch nationalities
      try {
        const { data } = await apolloClient.query({
          query: GET_NATIONALITIES,
          fetchPolicy: 'cache-first'
        });
        if (data?.maid_profiles?.length > 0) {
          const uniqueNats = [...new Set(data.maid_profiles.map(m => m.nationality).filter(Boolean))];
          if (uniqueNats.length > 0) {
            setNationalities(uniqueNats.sort());
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch nationalities, using defaults');
      }

      // Fetch locations
      try {
        const { data } = await apolloClient.query({
          query: GET_LOCATIONS,
          fetchPolicy: 'cache-first'
        });
        if (data?.maid_profiles?.length > 0) {
          const uniqueLocations = [...new Set(data.maid_profiles.map(m => m.current_location).filter(Boolean))];
          if (uniqueLocations.length > 0) {
            setLocations(uniqueLocations.sort());
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch locations');
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch maids from GraphQL/Hasura - optimized for instant filtering
  const fetchMaids = useCallback(async (showLoading = true, isInitialLoad = false) => {
    try {
      if (showLoading) {
        setLoading(true);
        setError(null);
      }

      const whereClause = buildWhereClause();
      const orderByClause = buildOrderBy();

      // Fetch maids and stats in PARALLEL for faster response
      const [maidsResult, statsResult] = await Promise.all([
        apolloClient.query({
          query: GET_MAIDS_QUERY,
          variables: {
            limit: itemsPerPage,
            offset: (currentPage - 1) * itemsPerPage,
            where: whereClause,
            order_by: orderByClause
          },
          fetchPolicy: 'network-only' // Always fetch fresh data but use cache structure
        }),
        apolloClient.query({
          query: GET_MAID_STATS_QUERY,
          fetchPolicy: 'cache-first' // Stats can be cached briefly
        })
      ]);

      const { data, errors } = maidsResult;

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      // Map data to expected format
      const mappedData = (data?.maid_profiles || []).map(maid => ({
        ...maid,
        // Compute display values
        phone: maid.phone_number ? `${maid.phone_country_code || ''}${maid.phone_number}` : 'N/A',
        location: maid.current_location || maid.country || 'Not specified',
        avatar_url: maid.primary_image_processed_url || maid.profile_photo_url,
        profile_completion: maid.profile_completion_percentage || 0,
        rating: maid.average_rating || 0,
      }));

      // Only update data if we got valid results (prevent clearing on transient errors)
      if (data?.maid_profiles !== undefined) {
        setMaidsData(mappedData);
        setTotalCount(data?.maid_profiles_aggregate?.aggregate?.count || 0);
      }

      // Update stats from parallel fetch
      const statsData = statsResult.data;
      if (statsData) {
        setStats({
          total: statsData.total?.aggregate?.count || 0,
          available: statsData.available?.aggregate?.count || 0,
          busy: statsData.busy?.aggregate?.count || 0,
          verified: statsData.verified?.aggregate?.count || 0,
          pending: statsData.pending?.aggregate?.count || 0,
          rejected: statsData.rejected?.aggregate?.count || 0,
        });
      }

      setLastRefresh(new Date());

      // Log activity only on initial load - fire and forget (don't await)
      if (isInitialLoad) {
        logAdminActivity('maids_page_view', 'admin_users', 'maids').catch(() => {});
      }
    } catch (err) {
      logger.error('Failed to fetch maids:', err);
      if (showLoading) {
        setError('Failed to load maid data. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load maids. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [currentPage, buildWhereClause, buildOrderBy, logAdminActivity]);

  // Refs for tracking state
  const initialFetchDone = useRef(false);
  const searchDebounceRef = useRef(null);
  const fetchInProgress = useRef(false);

  // Single unified fetch effect - triggers on any filter/page change
  // NOTE: fetchMaids is NOT in dependency array to prevent infinite loops
  useEffect(() => {
    // Prevent concurrent fetches
    if (fetchInProgress.current) return;

    const isInitial = !initialFetchDone.current;

    // Debounce for search term changes (300ms), immediate for other filters
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const delay = isInitial ? 0 : (searchTerm ? 300 : 0);

    searchDebounceRef.current = setTimeout(async () => {
      fetchInProgress.current = true;
      initialFetchDone.current = true;

      try {
        await fetchMaids(true, isInitial);
      } finally {
        fetchInProgress.current = false;
      }
    }, delay);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, statusFilter, verificationFilter, nationalityFilter, locationFilter, experienceFilter, sortField, sortOrder]);

  // Reset to page 1 when filters change (not pagination)
  const prevFiltersRef = useRef({ searchTerm, statusFilter, verificationFilter, nationalityFilter, locationFilter, experienceFilter, sortField, sortOrder });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filtersChanged =
      prev.searchTerm !== searchTerm ||
      prev.statusFilter !== statusFilter ||
      prev.verificationFilter !== verificationFilter ||
      prev.nationalityFilter !== nationalityFilter ||
      prev.locationFilter !== locationFilter ||
      prev.experienceFilter !== experienceFilter ||
      prev.sortField !== sortField ||
      prev.sortOrder !== sortOrder;

    if (filtersChanged) {
      setSelectedIds(new Set());
      if (currentPage !== 1) {
        setCurrentPage(1); // This will trigger the fetch effect above
      }
    }
    prevFiltersRef.current = { searchTerm, statusFilter, verificationFilter, nationalityFilter, locationFilter, experienceFilter, sortField, sortOrder };
  }, [searchTerm, statusFilter, verificationFilter, nationalityFilter, locationFilter, experienceFilter, sortField, sortOrder, currentPage]);

  // Manual refresh function (no auto-polling)
  const handleManualRefresh = useCallback(() => {
    if (!fetchInProgress.current) {
      fetchMaids(true, false);
    }
  }, [fetchMaids]);

  // Open verification dialog with message
  const openVerificationDialog = (maid, action) => {
    const personalizedMessage = defaultMessages[action].replace(/{name}/g, maid.full_name || 'User');
    setVerificationDialog({
      open: true,
      maid,
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
            related_type: 'maid_profile',
            link: actionUrl,
            action_url: actionUrl,
            read: false
          }
        }
      });
      logger.info(`In-app notification sent to user ${userId}:`, { type, title, link: actionUrl, id: result.data?.insert_notifications_one?.id });
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
            message_type: 'text',  // WhatsApp messages table only allows 'text' type
            sender: 'assistant',  // sender only allows 'user' or 'assistant'
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

  // Get agency details and send notifications
  const notifyAgency = async (agencyId, maid, action, message) => {
    if (!agencyId) return { success: false, channels: [] };

    try {
      const { data } = await apolloClient.query({
        query: GET_AGENCY_BY_ID,
        variables: { id: agencyId },
        fetchPolicy: 'network-only'
      });

      const agency = data?.agency_profiles_by_pk;
      if (!agency) {
        logger.warn(`Agency not found: ${agencyId}`);
        return { success: false, channels: [] };
      }

      const channels = [];
      const agencyName = agency.business_name || agency.agency_name || 'Agency';
      const actionTitles = {
        approve: 'Maid Profile Approved',
        reject: 'Maid Profile Rejected',
        pending: 'Maid Profile Set to Pending'
      };

      // Create personalized message for agency - directed to agency, mentions which maid
      let agencyMessage;
      if (action === 'reject') {
        agencyMessage = `Dear ${agencyName},\n\nThe profile for "${maid.full_name}" has been rejected due to the following missing information:\n\n${message}\n\nPlease update the profile and resubmit for verification.`;
      } else if (action === 'approve') {
        agencyMessage = `Dear ${agencyName},\n\nGreat news! The profile for "${maid.full_name}" has been approved and is now visible to employers.\n\n${message}`;
      } else {
        agencyMessage = `Dear ${agencyName},\n\nThe profile for "${maid.full_name}" has been set to pending review.\n\n${message}`;
      }

      // 1. In-app notification to agency
      const inAppSent = await sendInAppNotification(
        agencyId,
        action === 'approve' ? 'profile_approved' : action === 'reject' ? 'profile_rejected' : 'system_announcement',
        actionTitles[action],
        agencyMessage,
        action === 'reject' ? 'urgent' : 'high',
        `/dashboard/agency/maids/${maid.id}` // Full path to specific maid in agency dashboard
      );
      if (inAppSent) channels.push('in-app');

      // 2. WhatsApp to agency (prefer business_phone, fallback to authorized_person_phone)
      const whatsappNumber = agency.business_phone || agency.phone || agency.authorized_person_phone || agency.emergency_contact_phone;
      if (whatsappNumber) {
        const whatsappSent = await sendWhatsAppMessage(whatsappNumber, agencyMessage);
        if (whatsappSent) channels.push('whatsapp');
      }

      // 3. Email notification (log for now - SendGrid integration would go here)
      const agencyEmail = agency.business_email || agency.authorized_person_email;
      if (agencyEmail) {
        // In production, this would call SendGrid API
        logger.info(`Email notification would be sent to agency: ${agencyEmail}`, {
          subject: actionTitles[action],
          to: agencyEmail,
          maidName: maid.full_name,
          action
        });
        channels.push('email');
      }

      return { success: channels.length > 0, channels, agency };
    } catch (error) {
      logger.error('Failed to notify agency:', error);
      return { success: false, channels: [] };
    }
  };

  // Handle verification action with message
  const handleVerificationWithMessage = async () => {
    if (!verificationDialog.maid || !verificationDialog.action) return;

    setVerificationProcessing(true);
    try {
      const { action, maid, message } = verificationDialog;
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
        mutation: UPDATE_MAID_VERIFICATION_MUTATION,
        variables: {
          id: maid.id,
          verification_status: newStatus
        }
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      // Optimistic UI update
      setMaidsData(prev =>
        prev.map(m =>
          m.id === maid.id
            ? { ...m, verification_status: newStatus }
            : m
        )
      );

      await logAdminActivity(`maid_verification_${action}`, 'maid', maid.id);

      // Track notification channels used
      const notificationChannels = [];

      // 2. Send in-app notification to maid (only for independent maids, not agency-managed)
      const actionTitles = {
        approve: 'Profile Approved!',
        reject: 'Profile Rejected',
        pending: 'Profile Under Review'
      };

      // Create personalized message for independent maid
      const maidName = maid.full_name || 'there';
      let maidMessage;
      if (action === 'reject') {
        maidMessage = `Dear ${maidName},\n\nYour profile has been rejected due to the following missing information:\n\n${message}\n\nPlease update your profile and resubmit for verification.`;
      } else if (action === 'approve') {
        maidMessage = `Dear ${maidName},\n\nCongratulations! Your profile has been approved and is now visible to employers.\n\n${message}`;
      } else {
        maidMessage = `Dear ${maidName},\n\nYour profile is currently under review.\n\n${message}`;
      }

      const maidNotificationSent = await sendInAppNotification(
        maid.user_id || maid.id,
        action === 'approve' ? 'profile_approved' : action === 'reject' ? 'profile_rejected' : 'system_announcement',
        actionTitles[action],
        maidMessage,
        action === 'reject' ? 'urgent' : 'high',
        '/dashboard/maid/profile' // Full path to maid profile page
      );
      if (maidNotificationSent) notificationChannels.push('in-app');

      // 3. Send WhatsApp to maid if phone available
      const maidPhone = maid.phone_number || maid.alternative_phone;
      if (maidPhone) {
        const whatsappSent = await sendWhatsAppMessage(maidPhone, maidMessage);
        if (whatsappSent) notificationChannels.push('whatsapp');
      }

      // 4. If agency-managed, notify the agency via all channels
      let agencyNotification = { success: false, channels: [] };
      if (maid.is_agency_managed && maid.agency_id) {
        agencyNotification = await notifyAgency(maid.agency_id, maid, action, message);
        if (agencyNotification.success) {
          notificationChannels.push(`agency(${agencyNotification.channels.join(',')})`);
        }
      }

      // 5. Log email for maid (SendGrid integration placeholder)
      // In production, this would send via SendGrid
      logger.info(`Email notification queued for maid:`, {
        maidId: maid.id,
        maidName: maid.full_name,
        action,
        messageLength: message.length
      });

      const actionLabels = {
        approve: 'approved',
        reject: 'rejected',
        pending: 'set to pending'
      };

      // Build success message with channels used
      let successDescription = `${maid.full_name} has been ${actionLabels[action]}.`;
      if (notificationChannels.length > 0) {
        successDescription += ` Notifications sent via: ${notificationChannels.join(', ')}.`;
      }
      if (maid.is_agency_managed && agencyNotification.success) {
        successDescription += ` Agency (${agencyNotification.agency?.full_name || 'Unknown'}) has been notified.`;
      }

      toast({
        title: 'Verification Updated',
        description: successDescription,
      });

      // Close dialog
      setVerificationDialog({ open: false, maid: null, action: '', message: '' });
    } catch (error) {
      logger.error('Failed to update verification status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status.',
        variant: 'destructive',
      });
      // Refetch to get correct state
      fetchMaids(true);
    } finally {
      setVerificationProcessing(false);
    }
  };

  // Legacy quick action (for backward compatibility)
  const handleVerificationAction = async (maidId, action) => {
    const maid = maidsData.find(m => m.id === maidId);
    if (maid) {
      openVerificationDialog(maid, action);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (maidId, newStatus) => {
    try {
      const { errors } = await apolloClient.mutate({
        mutation: UPDATE_MAID_STATUS_MUTATION,
        variables: {
          id: maidId,
          availability_status: newStatus
        }
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      // Optimistic UI update
      setMaidsData(prev =>
        prev.map(maid =>
          maid.id === maidId
            ? { ...maid, availability_status: newStatus }
            : maid
        )
      );

      await logAdminActivity('maid_status_update', 'maid', maidId);

      toast({
        title: 'Status Updated',
        description: 'Maid availability status updated successfully.',
      });
    } catch (error) {
      logger.error('Failed to update maid status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
      fetchMaids(true);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === maidsData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(maidsData.map(m => m.id)));
    }
  };

  const handleSelectOne = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected = maidsData.length > 0 && selectedIds.size === maidsData.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < maidsData.length;

  // Bulk action handlers
  const handleBulkAction = async (action, value) => {
    if (selectedIds.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one maid to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    setBulkProcessing(true);
    try {
      const ids = Array.from(selectedIds);

      if (action === 'verify' || action === 'reject') {
        const status = action === 'verify' ? 'verified' : 'rejected';
        await apolloClient.mutate({
          mutation: BULK_UPDATE_VERIFICATION,
          variables: { ids, verification_status: status }
        });
        await logAdminActivity(`bulk_${action}`, 'maid_profiles', ids.join(','));
        toast({
          title: 'Bulk Action Complete',
          description: `${ids.length} maid(s) have been ${action === 'verify' ? 'verified' : 'rejected'}.`,
        });
      } else if (action === 'status') {
        await apolloClient.mutate({
          mutation: BULK_UPDATE_STATUS,
          variables: { ids, availability_status: value }
        });
        await logAdminActivity('bulk_status_update', 'maid_profiles', ids.join(','));
        toast({
          title: 'Bulk Action Complete',
          description: `${ids.length} maid(s) status updated to ${value}.`,
        });
      }

      setSelectedIds(new Set());
      setBulkActionDialog({ open: false, action: '', title: '' });
      fetchMaids(false);
    } catch (error) {
      logger.error('Bulk action failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  // CSV Export
  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all data matching current filters (no pagination)
      const { data } = await apolloClient.query({
        query: GET_MAIDS_QUERY,
        variables: {
          limit: 10000,
          offset: 0,
          where: buildWhereClause(),
          order_by: buildOrderBy()
        },
        fetchPolicy: 'network-only'
      });

      const maids = data?.maid_profiles || [];

      // Create CSV content
      const headers = [
        'ID', 'Full Name', 'Phone', 'Nationality', 'Location',
        'Experience (Years)', 'Status', 'Verification', 'Rating',
        'Profile Completion', 'Skills', 'Languages', 'Education',
        'Salary Min', 'Salary Max', 'Currency', 'Created At'
      ];

      const rows = maids.map(maid => [
        maid.id,
        maid.full_name || '',
        maid.phone_number ? `${maid.phone_country_code || ''}${maid.phone_number}` : '',
        maid.nationality || '',
        maid.current_location || maid.country || '',
        maid.experience_years || 0,
        maid.availability_status || '',
        maid.verification_status || '',
        maid.average_rating || 0,
        maid.profile_completion_percentage || 0,
        (maid.skills || []).join('; '),
        (maid.languages || []).join('; '),
        maid.education_level || '',
        maid.preferred_salary_min || '',
        maid.preferred_salary_max || '',
        maid.preferred_currency || '',
        maid.created_at ? new Date(maid.created_at).toISOString() : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `maids_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      await logAdminActivity('export_maids', 'maid_profiles', `${maids.length} records`);
      toast({
        title: 'Export Complete',
        description: `Successfully exported ${maids.length} maid records.`,
      });
    } catch (error) {
      logger.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setVerificationFilter('all');
    setNationalityFilter('all');
    setLocationFilter('all');
    setExperienceFilter('all');
    setSortField('created_at');
    setSortOrder('desc');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || verificationFilter !== 'all' ||
    nationalityFilter !== 'all' || locationFilter !== 'all' || experienceFilter !== 'all';

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { label: 'Available', color: 'bg-green-100 text-green-800' },
      busy: { label: 'Busy', color: 'bg-yellow-100 text-yellow-800' },
      inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge className={config.color}>{config.label}</Badge>;
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

  // Profile requirements configuration - comprehensive list with Video CV and Passport/ID as required
  const profileRequirements = [
    // REQUIRED - Identity & Documents
    { key: 'profile_photo', label: 'Profile Photo', category: 'identity', check: (m) => !!(m.avatar_url || m.profile_photo_url || m.primary_image_processed_url), required: true },
    { key: 'video_cv', label: 'Video CV (Introduction Video)', category: 'identity', check: (m) => !!(m.introduction_video_url), required: true },
    { key: 'passport_id', label: 'Passport/National ID', category: 'identity', check: (m) => !!(m.passport_number || m.passport_number_encrypted || m.national_id_encrypted || m.national_id_hash), required: true },

    // REQUIRED - Name
    { key: 'full_name', label: 'Full Name', category: 'name', check: (m) => !!(m.full_name && m.full_name.trim()), required: true },

    // REQUIRED - Contact
    { key: 'phone_number', label: 'Phone Number', category: 'contact', check: (m) => !!(m.phone_number), required: true },

    // REQUIRED - Location
    { key: 'nationality', label: 'Nationality', category: 'location', check: (m) => !!(m.nationality), required: true },
    { key: 'current_location', label: 'Current Location/Country', category: 'location', check: (m) => !!(m.current_location || m.country), required: true },

    // REQUIRED - Personal
    { key: 'date_of_birth', label: 'Date of Birth', category: 'personal', check: (m) => !!(m.date_of_birth), required: true },

    // REQUIRED - Professional
    { key: 'primary_profession', label: 'Primary Profession', category: 'professional', check: (m) => !!(m.primary_profession), required: true },
    { key: 'experience_years', label: 'Years of Experience', category: 'professional', check: (m) => m.experience_years !== null && m.experience_years !== undefined, required: true },
    { key: 'skills', label: 'Skills (at least 1)', category: 'professional', check: (m) => !!(m.skills && m.skills.length > 0), required: true },
    { key: 'languages', label: 'Languages (at least 1)', category: 'professional', check: (m) => !!(m.languages && m.languages.length > 0), required: true },

    // OPTIONAL - Additional Identity
    { key: 'passport_expiry', label: 'Passport Expiry Date', category: 'identity', check: (m) => !!(m.passport_expiry), required: false },

    // OPTIONAL - Contact
    { key: 'phone_verified', label: 'Phone Verified', category: 'contact', check: (m) => m.phone_verified === true, required: false },
    { key: 'alternative_phone', label: 'Alternative Phone', category: 'contact', check: (m) => !!(m.alternative_phone), required: false },

    // OPTIONAL - Location Details
    { key: 'state_province', label: 'State/Province', category: 'location', check: (m) => !!(m.state_province), required: false },
    { key: 'street_address', label: 'Street Address', category: 'location', check: (m) => !!(m.street_address), required: false },

    // OPTIONAL - Personal
    { key: 'marital_status', label: 'Marital Status', category: 'personal', check: (m) => !!(m.marital_status), required: false },
    { key: 'children_count', label: 'Number of Children', category: 'personal', check: (m) => m.children_count !== null && m.children_count !== undefined, required: false },
    { key: 'religion', label: 'Religion', category: 'personal', check: (m) => !!(m.religion), required: false },

    // OPTIONAL - Education & Professional
    { key: 'education_level', label: 'Education Level', category: 'professional', check: (m) => !!(m.education_level), required: false },
    { key: 'special_skills', label: 'Special Skills', category: 'professional', check: (m) => !!(m.special_skills && m.special_skills.length > 0), required: false },
    { key: 'work_preferences', label: 'Work Preferences', category: 'professional', check: (m) => !!(m.work_preferences && m.work_preferences.length > 0), required: false },
    { key: 'work_history', label: 'Work History', category: 'professional', check: (m) => !!(m.work_history), required: false },
    { key: 'previous_countries', label: 'Previous Work Countries', category: 'professional', check: (m) => !!(m.previous_countries && m.previous_countries.length > 0), required: false },

    // OPTIONAL - Salary & Availability
    { key: 'salary_expectation', label: 'Salary Expectation', category: 'salary', check: (m) => !!(m.preferred_salary_min), required: false },
    { key: 'contract_duration', label: 'Contract Duration Preference', category: 'salary', check: (m) => !!(m.contract_duration_preference), required: false },
    { key: 'live_in_preference', label: 'Live-in Preference', category: 'salary', check: (m) => m.live_in_preference !== null && m.live_in_preference !== undefined, required: false },
    { key: 'available_from', label: 'Available From Date', category: 'salary', check: (m) => !!(m.available_from), required: false },

    // OPTIONAL - Documents & Certifications
    { key: 'visa_status', label: 'Visa Status', category: 'documents', check: (m) => !!(m.visa_status || m.current_visa_status), required: false },
    { key: 'medical_certificate', label: 'Medical Certificate', category: 'documents', check: (m) => m.medical_certificate_valid === true, required: false },
    { key: 'police_clearance', label: 'Police Clearance', category: 'documents', check: (m) => m.police_clearance_valid === true, required: false },

    // OPTIONAL - Bio
    { key: 'about_me', label: 'About Me / Bio', category: 'bio', check: (m) => !!(m.about_me && m.about_me.trim()), required: false },
  ];

  // Group requirements by category for display
  const requirementCategories = {
    identity: { label: 'Identity & Documents', icon: Shield },
    name: { label: 'Name Information', icon: Users },
    contact: { label: 'Contact Information', icon: Phone },
    location: { label: 'Location', icon: MapPin },
    personal: { label: 'Personal Information', icon: Calendar },
    professional: { label: 'Professional Information', icon: Briefcase },
    salary: { label: 'Salary & Availability', icon: Award },
    documents: { label: 'Additional Documents', icon: FileText },
    bio: { label: 'Biography', icon: MessageSquare },
  };

  const MaidDetailDialog = ({ maid: initialMaid, open, onOpenChange, onPreviewDocument, onMaidRefreshed }) => {
    const [selectedMissingItems, setSelectedMissingItems] = useState(new Set());
    const scrollContainerRef = useRef(null);
    const [maidDocuments, setMaidDocuments] = useState([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [maidData, setMaidData] = useState(initialMaid);

    // Update maidData when initialMaid changes
    useEffect(() => {
      setMaidData(initialMaid);
    }, [initialMaid]);

    // Function to fetch documents
    const fetchDocuments = async (maidId) => {
      if (!maidId) return [];

      try {
        const { data, errors } = await apolloClient.query({
          query: GET_MAID_DOCUMENTS,
          variables: { maidId },
          fetchPolicy: 'network-only',
        });

        if (!errors && data?.maid_documents) {
          logger.info('Fetched maid documents:', data.maid_documents);
          return data.maid_documents;
        } else if (errors) {
          logger.error('GraphQL errors fetching documents:', errors);
        }
      } catch (error) {
        logger.error('Error fetching maid documents:', error);
      }
      return [];
    };

    // Function to refresh maid profile data
    const refreshMaidData = async () => {
      if (!maidData?.id) return;

      setRefreshing(true);
      try {
        // Re-fetch maid profile
        const { data: profileData, errors: profileErrors } = await apolloClient.query({
          query: GET_MAID_BY_ID,
          variables: { id: maidData.id },
          fetchPolicy: 'network-only',
        });

        if (!profileErrors && profileData?.maid_profiles_by_pk) {
          const refreshedMaid = profileData.maid_profiles_by_pk;
          setMaidData(refreshedMaid);

          // Notify parent component of the refresh
          if (onMaidRefreshed) {
            onMaidRefreshed(refreshedMaid);
          }

          logger.info('Refreshed maid profile:', refreshedMaid.full_name);
        }

        // Re-fetch documents
        const docs = await fetchDocuments(maidData.id);
        setMaidDocuments(docs);

        // Show success toast
        toast({
          title: 'Profile Refreshed',
          description: 'Maid profile and documents have been re-checked.',
        });
      } catch (error) {
        logger.error('Error refreshing maid data:', error);
        toast({
          title: 'Refresh Failed',
          description: 'Failed to refresh profile data.',
          variant: 'destructive',
        });
      } finally {
        setRefreshing(false);
      }
    };

    // Fetch maid documents when dialog opens
    useEffect(() => {
      const loadDocuments = async () => {
        if (!maidData?.id || !open) return;

        setDocumentsLoading(true);
        const docs = await fetchDocuments(maidData.id);
        setMaidDocuments(docs);
        setDocumentsLoading(false);
      };

      loadDocuments();
    }, [maidData?.id, open]);

    // Get identity documents (passport/national_id) - check both document_type and type fields
    // Also filter to only include documents that have a valid URL
    const identityDocuments = maidDocuments.filter(doc => {
      const docType = (doc.document_type || doc.type || '').toLowerCase();
      return docType === 'passport' ||
        docType === 'national_id' ||
        docType === 'passport_photo_page' ||
        docType.includes('passport') ||
        docType.includes('national') ||
        docType.includes('id');
    }).map(doc => ({
      ...doc,
      // Use whichever URL field has a value
      url: doc.document_url || doc.file_url || null
    }));

    // Check if identity documents with valid URLs exist
    const hasValidIdentityDocument = identityDocuments.some(doc => doc.url);

    // Use maidData for all checks
    const maid = maidData;

    if (!maid) return null;

    const getInitials = (name) => {
      if (!name) return 'M';
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const calculateAge = (dob) => {
      if (!dob) return 'N/A';
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    // Calculate profile status with identity documents check
    // For passport_id requirement, also check if valid identity documents exist in maid_documents
    const profileStatus = profileRequirements.map(req => {
      if (req.key === 'passport_id') {
        // Check both maid profile fields AND uploaded documents
        const hasProfileId = !!(maid.passport_number || maid.passport_number_encrypted || maid.national_id_encrypted || maid.national_id_hash);
        const hasUploadedId = hasValidIdentityDocument;
        return {
          ...req,
          isComplete: hasProfileId || hasUploadedId
        };
      }
      return {
        ...req,
        isComplete: req.check(maid)
      };
    });

    const completedCount = profileStatus.filter(s => s.isComplete).length;
    const requiredMissing = profileStatus.filter(s => s.required && !s.isComplete);
    const optionalMissing = profileStatus.filter(s => !s.required && !s.isComplete);
    const allMissing = profileStatus.filter(s => !s.isComplete);
    const isEligibleForApproval = requiredMissing.length === 0 && !documentsLoading;

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
      // Restore scroll position after state update
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollTop;
        }
      });
    };

    // Select all missing items (preserves scroll position)
    const selectAllMissing = () => {
      const scrollTop = scrollContainerRef.current?.scrollTop || 0;
      setSelectedMissingItems(new Set(allMissing.map(m => m.key)));
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollTop;
        }
      });
    };

    // Clear all selections (preserves scroll position)
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
        return defaultMessages.reject.replace(/{name}/g, maid.full_name || 'User');
      }

      const missingList = selectedItems.map(item => `- ${item.label}`).join('\n');
      const requiredItems = selectedItems.filter(i => profileRequirements.find(r => r.key === i.key)?.required);
      const optionalItems = selectedItems.filter(i => !profileRequirements.find(r => r.key === i.key)?.required);

      let message = `Dear ${maid.full_name || 'User'},

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
        maid,
        action: 'reject',
        message: customMessage
      });
      onOpenChange(false);
    };

    // Calculate required items count
    const requiredCount = profileRequirements.filter(r => r.required).length;
    const requiredCompleteCount = profileStatus.filter(s => s.required && s.isComplete).length;

    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setSelectedMissingItems(new Set());
        }
        onOpenChange(isOpen);
      }}>
        <DialogContent
          className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Fixed Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-start gap-4">
              {/* Profile Photo */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={maid.avatar_url || maid.profile_photo_url || maid.primary_image_processed_url} />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(maid.full_name)}
                  </AvatarFallback>
                </Avatar>
                {isEligibleForApproval ? (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white">
                    <AlertTriangle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Name & Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-slate-800 truncate">
                    {maid.full_name || 'Unknown'}
                  </h2>
                  {getVerificationBadge(maid.verification_status)}
                  {getStatusBadge(maid.availability_status)}
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {maid.primary_profession || 'Domestic Worker'} • {maid.experience_years || 0} years experience
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {maid.current_location || maid.country || 'Location not set'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {maid.nationality || 'Nationality not set'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {maid.date_of_birth ? `${calculateAge(maid.date_of_birth)} years old` : 'Age unknown'}
                  </span>
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
                    onClick={refreshMaidData}
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
                <div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-slate-500">Profile</span>
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (maid.profile_completion_percentage || 0) >= 80 ? 'bg-green-500' :
                          (maid.profile_completion_percentage || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${maid.profile_completion_percentage || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{maid.profile_completion_percentage || 0}%</span>
                  </div>
                </div>
                {documentsLoading && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center justify-end gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading documents...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" tabIndex={-1}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Left Column - Profile Details */}
              <div className="lg:col-span-2 space-y-5">

                {/* Identity Verification Section */}
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-indigo-600" />
                      Identity Verification
                      <Badge variant="outline" className="ml-auto text-xs">Required for Approval</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {/* Identity Documents Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {/* Profile Photo */}
                      <div className={`relative p-4 rounded-xl border-2 transition-all ${
                        maid.avatar_url || maid.profile_photo_url || maid.primary_image_processed_url
                          ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                      }`}>
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-600 mb-2">Profile Photo</p>
                          {maid.avatar_url || maid.profile_photo_url || maid.primary_image_processed_url ? (
                            <img
                              src={maid.avatar_url || maid.profile_photo_url || maid.primary_image_processed_url}
                              alt={maid.full_name}
                              className="w-20 h-20 mx-auto rounded-lg object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-20 h-20 mx-auto rounded-lg bg-red-100 flex items-center justify-center">
                              <XCircle className="h-8 w-8 text-red-400" />
                            </div>
                          )}
                          <Badge className={`mt-2 ${
                            maid.avatar_url || maid.profile_photo_url || maid.primary_image_processed_url
                              ? 'bg-green-600' : 'bg-red-600'
                          }`}>
                            {maid.avatar_url || maid.profile_photo_url || maid.primary_image_processed_url ? 'Uploaded' : 'Missing'}
                          </Badge>
                        </div>
                      </div>

                      {/* Video CV */}
                      <div className={`relative p-4 rounded-xl border-2 transition-all ${
                        maid.introduction_video_url ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                      }`}>
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-600 mb-2">Video CV</p>
                          <div className={`w-20 h-20 mx-auto rounded-lg flex items-center justify-center ${
                            maid.introduction_video_url ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {maid.introduction_video_url ? (
                              <div className="text-center">
                                <Activity className="h-8 w-8 text-green-600 mx-auto" />
                                {maid.video_duration && (
                                  <p className="text-xs text-green-700 mt-1 font-medium">
                                    {Math.floor(maid.video_duration / 60)}:{String(maid.video_duration % 60).padStart(2, '0')}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <XCircle className="h-8 w-8 text-red-400" />
                            )}
                          </div>
                          <Badge className={`mt-2 ${maid.introduction_video_url ? 'bg-green-600' : 'bg-red-600'}`}>
                            {maid.introduction_video_url ? 'Available' : 'Missing'}
                          </Badge>
                        </div>
                      </div>

                      {/* Passport/ID */}
                      <div className={`relative p-4 rounded-xl border-2 transition-all ${
                        maid.passport_number || maid.passport_number_encrypted || maid.national_id_encrypted || identityDocuments.length > 0
                          ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                      }`}>
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-600 mb-2">Passport/ID</p>
                          <div className={`w-20 h-20 mx-auto rounded-lg flex items-center justify-center ${
                            maid.passport_number || maid.passport_number_encrypted || maid.national_id_encrypted || identityDocuments.length > 0
                              ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {maid.passport_number || maid.passport_number_encrypted || maid.national_id_encrypted || identityDocuments.length > 0 ? (
                              <div className="text-center">
                                <FileText className="h-8 w-8 text-green-600 mx-auto" />
                                {maid.passport_expiry && (
                                  <p className="text-xs text-green-700 mt-1">
                                    Exp: {new Date(maid.passport_expiry).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <XCircle className="h-8 w-8 text-red-400" />
                            )}
                          </div>
                          <Badge className={`mt-2 ${
                            maid.passport_number || maid.passport_number_encrypted || maid.national_id_encrypted || identityDocuments.length > 0
                              ? 'bg-green-600' : 'bg-red-600'
                          }`}>
                            {maid.passport_number || maid.passport_number_encrypted || maid.national_id_encrypted || identityDocuments.length > 0 ? 'Uploaded' : 'Missing'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Identity Document Preview Section - For Admin Name Verification */}
                    {identityDocuments.length > 0 && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="h-4 w-4 text-amber-600" />
                          <h4 className="text-sm font-semibold text-amber-800">Identity Document Verification</h4>
                          <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                            Verify Name Matches
                          </Badge>
                        </div>

                        <div className="bg-white rounded-lg p-3 mb-3 border border-amber-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-slate-500" />
                            <span className="text-xs text-slate-500">Submitted Name:</span>
                          </div>
                          <p className="text-lg font-bold text-slate-800 ml-6">{maid.full_name || 'Not provided'}</p>
                          {(maid.first_name || maid.middle_name || maid.last_name) && (
                            <p className="text-sm text-slate-500 ml-6">
                              ({[maid.first_name, maid.middle_name, maid.last_name].filter(Boolean).join(' ')})
                            </p>
                          )}
                        </div>

                        <p className="text-xs text-amber-700 mb-3">
                          Click on a document to view full size. Verify that the name on the document matches the submitted name above.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          {identityDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              className="relative group cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPreviewDocument(doc, maid.full_name);
                              }}
                            >
                              <div className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                                doc.url ? 'border-slate-200 hover:border-blue-400 bg-slate-100' : 'border-orange-200 bg-orange-50'
                              }`}>
                                {doc.url ? (
                                  <>
                                    <img
                                      src={doc.url}
                                      alt={doc.document_name || doc.title || doc.document_type || doc.type}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        const errorDiv = document.getElementById(`doc-error-${doc.id}`);
                                        if (errorDiv) errorDiv.style.display = 'flex';
                                      }}
                                    />
                                    <div id={`doc-error-${doc.id}`} className="hidden w-full h-full items-center justify-center bg-red-50 flex-col">
                                      <AlertTriangle className="h-6 w-6 text-red-400" />
                                      <span className="text-xs text-red-500 mt-1">404 Error</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center">
                                    <FileText className="h-6 w-6 text-orange-400" />
                                    <span className="text-xs text-orange-500 mt-1">No URL</span>
                                  </div>
                                )}
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Eye className="h-6 w-6 text-white drop-shadow-lg" />
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {(doc.document_type || doc.type || 'Document').replace(/_/g, ' ')}
                                </Badge>
                                {doc.verified && (
                                  <Badge className="text-xs bg-green-600">Verified</Badge>
                                )}
                                {!doc.url && (
                                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Missing File</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No documents uploaded message */}
                    {identityDocuments.length === 0 && !documentsLoading && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <p className="text-sm text-red-700">
                            No identity documents (Passport/ID) uploaded. Cannot verify if user's name matches their ID.
                          </p>
                        </div>
                      </div>
                    )}

                    {documentsLoading && (
                      <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 text-slate-600 animate-spin" />
                          <p className="text-sm text-slate-600">Loading identity documents...</p>
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>

                {/* Contact & Location */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-500" />
                        Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Phone</span>
                        <span className={`text-sm font-medium flex items-center gap-1 ${!maid.phone_number ? 'text-red-500' : ''}`}>
                          {maid.phone_country_code}{maid.phone_number || 'Missing'}
                          {maid.phone_verified && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Alternative</span>
                        <span className="text-sm text-slate-600">{maid.alternative_phone || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Verified</span>
                        <Badge variant={maid.phone_verified ? 'default' : 'secondary'} className="text-xs">
                          {maid.phone_verified ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Country</span>
                        <span className={`text-sm font-medium ${!maid.country ? 'text-red-500' : ''}`}>
                          {maid.country || maid.nationality || 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Location</span>
                        <span className={`text-sm ${!maid.current_location ? 'text-red-500' : 'text-slate-600'}`}>
                          {maid.current_location || 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Address</span>
                        <span className="text-sm text-slate-600 truncate max-w-[150px]">
                          {maid.street_address || '—'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Personal & Professional */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        Personal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Date of Birth</span>
                        <span className={`text-sm font-medium ${!maid.date_of_birth ? 'text-red-500' : ''}`}>
                          {maid.date_of_birth ? new Date(maid.date_of_birth).toLocaleDateString() : 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Marital Status</span>
                        <span className="text-sm text-slate-600">{maid.marital_status || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Children</span>
                        <span className="text-sm text-slate-600">
                          {maid.children_count !== null && maid.children_count !== undefined ? maid.children_count : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Religion</span>
                        <span className="text-sm text-slate-600">{maid.religion || '—'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-slate-500" />
                        Professional
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Profession</span>
                        <span className={`text-sm font-medium ${!maid.primary_profession ? 'text-red-500' : ''}`}>
                          {maid.primary_profession || 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Experience</span>
                        <span className={`text-sm ${maid.experience_years === null ? 'text-red-500' : 'text-slate-600'}`}>
                          {maid.experience_years !== null ? `${maid.experience_years} years` : 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Education</span>
                        <span className="text-sm text-slate-600">{maid.education_level || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Salary</span>
                        <span className="text-sm text-slate-600">
                          {maid.preferred_salary_min
                            ? `${maid.preferred_currency || '$'}${maid.preferred_salary_min}${maid.preferred_salary_max ? `-${maid.preferred_salary_max}` : ''}`
                            : '—'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Skills & Languages */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Skills & Languages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Skills {!maid.skills?.length && <span className="text-red-500">(Required)</span>}</p>
                      {(maid.skills || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {maid.skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-red-500">No skills added</p>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Languages {!maid.languages?.length && <span className="text-red-500">(Required)</span>}</p>
                      {(maid.languages || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {maid.languages.map((lang, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{lang}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-red-500">No languages added</p>
                      )}
                    </div>
                    {(maid.previous_countries || []).length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Previous Work Countries</p>
                          <div className="flex flex-wrap gap-1">
                            {maid.previous_countries.map((country, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs border-blue-200 text-blue-700">{country}</Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Documents & Certifications */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-500" />
                      Documents & Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className={`p-3 rounded-lg text-center ${maid.visa_status || maid.current_visa_status ? 'bg-blue-50' : 'bg-slate-50'}`}>
                        <p className="text-[10px] text-slate-500 uppercase mb-1">Visa Status</p>
                        <p className="text-sm font-medium">{maid.visa_status || maid.current_visa_status || '—'}</p>
                      </div>
                      <div className={`p-3 rounded-lg text-center ${maid.medical_certificate_valid ? 'bg-green-50' : 'bg-slate-50'}`}>
                        <p className="text-[10px] text-slate-500 uppercase mb-1">Medical Cert</p>
                        <Badge variant={maid.medical_certificate_valid ? 'default' : 'secondary'} className={`text-xs ${maid.medical_certificate_valid ? 'bg-green-600' : ''}`}>
                          {maid.medical_certificate_valid ? 'Valid' : 'N/A'}
                        </Badge>
                      </div>
                      <div className={`p-3 rounded-lg text-center ${maid.police_clearance_valid ? 'bg-green-50' : 'bg-slate-50'}`}>
                        <p className="text-[10px] text-slate-500 uppercase mb-1">Police Clear</p>
                        <Badge variant={maid.police_clearance_valid ? 'default' : 'secondary'} className={`text-xs ${maid.police_clearance_valid ? 'bg-green-600' : ''}`}>
                          {maid.police_clearance_valid ? 'Valid' : 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* About & Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                  {maid.about_me && (
                    <Card className="col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">About</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 line-clamp-3">{maid.about_me}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Activity Stats */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800">{maid.average_rating || 0}</p>
                        <p className="text-xs text-slate-500">Rating</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800">{maid.successful_placements || 0}</p>
                        <p className="text-xs text-slate-500">Placements</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800">{maid.total_applications || 0}</p>
                        <p className="text-xs text-slate-500">Applications</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800">{maid.profile_views || 0}</p>
                        <p className="text-xs text-slate-500">Views</p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Registered: {maid.created_at ? new Date(maid.created_at).toLocaleDateString() : 'N/A'}</span>
                      <span>Last Updated: {maid.updated_at ? new Date(maid.updated_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Requirements & Actions */}
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
                        <span>{completedCount}/{profileRequirements.length}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isEligibleForApproval ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${(completedCount / profileRequirements.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Requirements List - Compact */}
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
                    {(documentsLoading || refreshing) && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-blue-700 text-sm mb-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{refreshing ? 'Refreshing profile data...' : 'Checking documents...'}</span>
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        openVerificationDialog(maid, 'approve');
                        onOpenChange(false);
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm"
                      disabled={!isEligibleForApproval || refreshing}
                      size="lg"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {isEligibleForApproval ? 'Approve Profile' : `Approve Profile (${requiredMissing.length} missing)`}
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
                        openVerificationDialog(maid, 'pending');
                        onOpenChange(false);
                      }}
                      variant="outline"
                      className="w-full border-slate-300"
                      size="lg"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Set Pending
                    </Button>

                    <Separator className="my-3" />

                    {/* Quick Status */}
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Quick Actions</p>
                      <Select
                        value={maid.availability_status || 'inactive'}
                        onValueChange={(value) => handleStatusUpdate(maid.id, value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Set Availability" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">
                            <span className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              Available
                            </span>
                          </SelectItem>
                          <SelectItem value="busy">
                            <span className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-yellow-500" />
                              Busy
                            </span>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <span className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-slate-400" />
                              Inactive
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
  if (loading && maidsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading maids data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && maidsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchMaids}>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Maid Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all maid profiles
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleManualRefresh} variant="outline" size="sm" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">{selectedIds.size} selected</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white"
                  onClick={() => setBulkActionDialog({ open: true, action: 'verify', title: 'Bulk Verify' })}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Verify All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white"
                  onClick={() => setBulkActionDialog({ open: true, action: 'reject', title: 'Bulk Reject' })}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Reject All
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="bg-white">
                      <Activity className="h-4 w-4 mr-1" />
                      Set Status
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('status', 'available')}>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      Available
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('status', 'busy')}>
                      <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                      Busy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('status', 'inactive')}>
                      <XCircle className="h-4 w-4 mr-2 text-gray-600" />
                      Inactive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters & Search
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <XCircle className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, nationality..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Verification Filter */}
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verifications</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Nationality Filter */}
            <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Nationality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Nationalities</SelectItem>
                {nationalities.map(nat => (
                  <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Second row of filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            {/* Location Filter */}
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Experience Filter */}
            <Select value={experienceFilter} onValueChange={setExperienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Experience Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Experience Levels</SelectItem>
                <SelectItem value="entry">Entry (0-1 years)</SelectItem>
                <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                <SelectItem value="mid">Mid (3-5 years)</SelectItem>
                <SelectItem value="senior">Senior (5+ years)</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Field */}
            <Select value={sortField} onValueChange={setSortField}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Registered</SelectItem>
                <SelectItem value="updated_at">Last Updated</SelectItem>
                <SelectItem value="full_name">Name</SelectItem>
                <SelectItem value="experience_years">Experience</SelectItem>
                <SelectItem value="average_rating">Rating</SelectItem>
                <SelectItem value="profile_completion_percentage">Profile Completion</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending (High to Low)</SelectItem>
                <SelectItem value="asc">Ascending (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Maids</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Briefcase className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.busy}</p>
                  <p className="text-xs text-muted-foreground">Busy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.verified}</p>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Maids Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maids List</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>Showing {maidsData.length} of {totalCount} total maids</span>
            <span className="text-xs">• Updated {formatRelativeTime(lastRefresh)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {maidsData.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Maids Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || verificationFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No maid profiles in the database yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                        className={isSomeSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                      />
                    </TableHead>
                    <TableHead>Maid</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maidsData.map((maid) => {
                    const getInitials = (name) => {
                      if (!name) return 'M';
                      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    };
                    const isSelected = selectedIds.has(maid.id);

                    return (
                      <TableRow key={maid.id} className={isSelected ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectOne(maid.id)}
                            aria-label={`Select ${maid.full_name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={maid.avatar_url} />
                              <AvatarFallback>
                                {getInitials(maid.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{maid.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{maid.nationality || 'Not specified'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{maid.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{maid.experience_years || 0} years</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(maid.availability_status)}</TableCell>
                        <TableCell>{getVerificationBadge(maid.verification_status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{maid.rating || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMaid(maid);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View & Verify
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
      <MaidDetailDialog
        maid={selectedMaid}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onPreviewDocument={(doc, maidName) => {
          setDocumentPreview({ open: true, document: doc, maidName });
        }}
        onMaidRefreshed={(refreshedMaid) => {
          // Update the selectedMaid and also update in the main list
          setSelectedMaid(refreshedMaid);
          setMaidsData(prev => prev.map(m => m.id === refreshedMaid.id ? refreshedMaid : m));
        }}
      />

      {/* Identity Document Preview Dialog */}
      <Dialog
        open={documentPreview.open}
        onOpenChange={(open) => !open && setDocumentPreview({ open: false, document: null, maidName: '' })}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-4 bg-slate-50 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Identity Document Preview
              {documentPreview.document && (
                <Badge variant="secondary" className="ml-2 capitalize">
                  {documentPreview.document.document_type?.replace(/_/g, ' ') || 'Document'}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              <span className="flex items-center gap-2 mt-2">
                <Users className="h-4 w-4" />
                Submitted Name: <strong className="text-slate-800">{documentPreview.maidName}</strong>
              </span>
              <p className="text-amber-600 text-xs mt-1">
                Compare the name on this document with the submitted name above
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 overflow-auto max-h-[calc(90vh-150px)] bg-slate-100">
            {documentPreview.document ? (
              <div className="space-y-4">
                {/* Document Image */}
                {(documentPreview.document.url || documentPreview.document.document_url || documentPreview.document.file_url) ? (
                  <div className="relative">
                    <img
                      src={documentPreview.document.url || documentPreview.document.document_url || documentPreview.document.file_url}
                      alt={documentPreview.document.document_name || documentPreview.document.title || 'Identity Document'}
                      className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const errorDiv = e.target.nextSibling;
                        if (errorDiv) errorDiv.style.display = 'flex';
                      }}
                    />
                    <div className="hidden flex-col items-center justify-center py-12 text-red-500 bg-red-50 rounded-lg border border-red-200">
                      <AlertTriangle className="h-16 w-16 mb-4" />
                      <p className="font-semibold">Document Image Not Found (404)</p>
                      <p className="text-sm text-red-400 mt-2">The file may have been deleted from storage</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-50 rounded-lg">
                    <FileText className="h-16 w-16 mb-4" />
                    <p>No document URL stored</p>
                  </div>
                )}

                {/* Document Metadata */}
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Document Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Type:</span>
                      <span className="ml-2 font-medium capitalize">{(documentPreview.document.document_type || documentPreview.document.type || 'Unknown').replace(/_/g, ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Name:</span>
                      <span className="ml-2 font-medium">{documentPreview.document.document_name || documentPreview.document.title || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Verified:</span>
                      <span className={`ml-2 font-medium ${documentPreview.document.verified ? 'text-green-600' : 'text-orange-600'}`}>
                        {documentPreview.document.verified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Uploaded:</span>
                      <span className="ml-2 font-medium">
                        {documentPreview.document.created_at
                          ? new Date(documentPreview.document.created_at).toLocaleDateString()
                          : 'Unknown'}
                      </span>
                    </div>
                    {(documentPreview.document.url || documentPreview.document.document_url || documentPreview.document.file_url) && (
                      <div className="col-span-2">
                        <span className="text-slate-500">URL:</span>
                        <span className="ml-2 text-xs text-slate-400 break-all">
                          {(documentPreview.document.url || documentPreview.document.document_url || documentPreview.document.file_url).substring(0, 80)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <FileText className="h-16 w-16 mb-4" />
                <p>No document selected</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-white flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const url = documentPreview.document?.url || documentPreview.document?.document_url || documentPreview.document?.file_url;
                if (url) window.open(url, '_blank');
              }}
              disabled={!documentPreview.document?.url && !documentPreview.document?.document_url && !documentPreview.document?.file_url}
            >
              <Eye className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button onClick={() => setDocumentPreview({ open: false, document: null, maidName: '' })}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={bulkActionDialog.open} onOpenChange={(open) => setBulkActionDialog({ ...bulkActionDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{bulkActionDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkActionDialog.action === 'verify' && (
                <>
                  Are you sure you want to verify {selectedIds.size} maid profile(s)?
                  This will mark them as verified and allow them to be visible to employers.
                </>
              )}
              {bulkActionDialog.action === 'reject' && (
                <>
                  Are you sure you want to reject {selectedIds.size} maid profile(s)?
                  This will prevent them from being visible to employers until they update their profiles.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBulkAction(bulkActionDialog.action)}
              disabled={bulkProcessing}
              className={bulkActionDialog.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {bulkProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {bulkActionDialog.action === 'verify' ? (
                    <><UserCheck className="h-4 w-4 mr-2" /> Verify All</>
                  ) : (
                    <><UserX className="h-4 w-4 mr-2" /> Reject All</>
                  )}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verification Dialog with Message */}
      <Dialog
        open={verificationDialog.open}
        onOpenChange={(open) => {
          if (!open && !verificationProcessing) {
            setVerificationDialog({ open: false, maid: null, action: '', message: '' });
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
              {verificationDialog.maid && (
                <span className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={verificationDialog.maid.avatar_url} />
                    <AvatarFallback>
                      {verificationDialog.maid.full_name?.charAt(0) || 'M'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{verificationDialog.maid.full_name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    Current status: {verificationDialog.maid.verification_status}
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
                This message will be sent to the user via notification.
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
                  The user will be verified and their profile will be visible to employers.
                </p>
              </div>
            )}

            {verificationDialog.action === 'reject' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  The user's profile will be rejected. Make sure to specify a clear reason in the message.
                </p>
              </div>
            )}

            {verificationDialog.action === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  The user's status will be set to pending and they will be notified.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setVerificationDialog({ open: false, maid: null, action: '', message: '' })}
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

export default AdminMaidsPage;
