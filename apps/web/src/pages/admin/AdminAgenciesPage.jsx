/**
 * AdminAgenciesPage - Production Version
 * Manages agency profiles with GraphQL/Hasura
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Building2,
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
  Shield,
  Globe,
  Briefcase,
  Award,
  ExternalLink,
  Image,
  CreditCard
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

const AdminAgenciesPage = () => {
  const { logAdminActivity } = useAdminAuth();
  const [agenciesData, setAgenciesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    pro: 0,
    premium: 0
  });
  const itemsPerPage = 20;

  // GraphQL query for agencies - using actual schema fields
  const GET_AGENCIES = gql`
    query GetAgencies($limit: Int!, $offset: Int!, $where: agency_profiles_bool_exp) {
      agency_profiles(
        limit: $limit
        offset: $offset
        where: $where
        order_by: { created_at: desc }
      ) {
        id
        full_name
        business_email
        email
        business_phone
        phone
        city
        country
        registration_country
        logo_url
        created_at
        updated_at
        license_verified
        verified
        verification_status
        active_maids
        active_listings
        total_maids
        total_maids_managed
        successful_placements
        average_rating
        subscription_tier
        subscription_expires_at
        license_number
        established_year
        specialization
        service_countries
        agency_description
        website_url
        contact_person_name
        authorized_person_name
        authorized_person_email
        trade_license_verification_status
      }
      agency_profiles_aggregate(where: $where) {
        aggregate {
          count
        }
      }
    }
  `;

  // Stats query for summary cards - matches the verification logic in data transformation
  const GET_AGENCY_STATS = gql`
    query GetAgencyStats {
      total: agency_profiles_aggregate {
        aggregate { count }
      }
      verified: agency_profiles_aggregate(where: {
        _or: [
          { license_verified: { _eq: true } },
          { verified: { _eq: true } },
          { verification_status: { _eq: "verified" } }
        ]
      }) {
        aggregate { count }
      }
      pending: agency_profiles_aggregate(where: {
        _and: [
          { _or: [
            { license_verified: { _is_null: true } },
            { license_verified: { _eq: false } }
          ]},
          { _or: [
            { verified: { _is_null: true } },
            { verified: { _eq: false } }
          ]},
          { _or: [
            { verification_status: { _is_null: true } },
            { verification_status: { _eq: "pending" } },
            { verification_status: { _eq: "" } }
          ]}
        ]
      }) {
        aggregate { count }
      }
      rejected: agency_profiles_aggregate(where: { verification_status: { _eq: "rejected" } }) {
        aggregate { count }
      }
      pro: agency_profiles_aggregate(where: { subscription_tier: { _ilike: "pro" } }) {
        aggregate { count }
      }
      premium: agency_profiles_aggregate(where: { subscription_tier: { _ilike: "premium" } }) {
        aggregate { count }
      }
    }
  `;

  // Query to get full agency details for the detail dialog
  const GET_AGENCY_DETAILS = gql`
    query GetAgencyDetails($id: String!) {
      agency_profiles_by_pk(id: $id) {
        id
        full_name
        business_email
        email
        business_phone
        phone
        city
        country
        registration_country
        logo_url
        logo_file_preview
        created_at
        updated_at
        license_verified
        verified
        verification_status
        active_maids
        active_listings
        total_maids
        total_maids_managed
        successful_placements
        average_rating
        subscription_tier
        subscription_expires_at
        license_number
        license_expiry_date
        established_year
        specialization
        service_countries
        agency_description
        website_url
        contact_person_name
        contact_person_title
        authorized_person_name
        authorized_person_position
        authorized_person_phone
        authorized_person_email
        authorized_person_id_number
        authorized_person_id_document
        authorized_person_id_verification_status
        contact_phone_verified
        official_email_verified
        authorized_person_phone_verified
        authorized_person_email_verified
        trade_license_document
        trade_license_verification_status
        agency_contract_template
        contract_template_verification_status
        head_office_address
        business_address
        support_hours_start
        support_hours_end
        emergency_contact_phone
        placement_fee_percentage
        guarantee_period_months
        accreditation_bodies
        certifications
      }
    }
  `;

  // Agency profile requirements configuration
  const agencyProfileRequirements = [
    // REQUIRED - Business Identity
    { key: 'full_name', label: 'Agency Name', category: 'identity', check: (a) => !!(a.full_name && a.full_name.trim()), required: true },
    { key: 'logo', label: 'Agency Logo', category: 'identity', check: (a) => !!(a.logo_url || a.logo_file_preview), required: true },
    { key: 'license_number', label: 'Trade License Number', category: 'identity', check: (a) => !!(a.license_number), required: true },
    { key: 'trade_license_doc', label: 'Trade License Document', category: 'identity', check: (a) => !!(a.trade_license_document), required: true },

    // REQUIRED - Contact
    { key: 'business_email', label: 'Business Email', category: 'contact', check: (a) => !!(a.business_email || a.email), required: true },
    { key: 'business_phone', label: 'Business Phone', category: 'contact', check: (a) => !!(a.business_phone || a.phone), required: true },
    { key: 'business_address', label: 'Business Address', category: 'contact', check: (a) => !!(a.business_address || a.head_office_address), required: true },

    // REQUIRED - Location
    { key: 'country', label: 'Country', category: 'location', check: (a) => !!(a.country || a.registration_country), required: true },
    { key: 'city', label: 'City', category: 'location', check: (a) => !!(a.city), required: true },

    // REQUIRED - Authorized Person
    { key: 'authorized_person_name', label: 'Authorized Person Name', category: 'authorized', check: (a) => !!(a.authorized_person_name || a.contact_person_name), required: true },
    { key: 'authorized_person_id', label: 'Authorized Person ID Document', category: 'authorized', check: (a) => !!(a.authorized_person_id_document), required: true },

    // OPTIONAL - Business Details
    { key: 'established_year', label: 'Year Established', category: 'business', check: (a) => !!(a.established_year), required: false },
    { key: 'website', label: 'Website URL', category: 'business', check: (a) => !!(a.website_url), required: false },
    { key: 'description', label: 'Agency Description', category: 'business', check: (a) => !!(a.agency_description), required: false },
    { key: 'license_expiry', label: 'License Expiry Date', category: 'business', check: (a) => !!(a.license_expiry_date), required: false },

    // OPTIONAL - Services
    { key: 'specialization', label: 'Specializations', category: 'services', check: (a) => !!(a.specialization && a.specialization.length > 0), required: false },
    { key: 'service_countries', label: 'Service Countries', category: 'services', check: (a) => !!(a.service_countries && a.service_countries.length > 0), required: false },
    { key: 'placement_fee', label: 'Placement Fee Percentage', category: 'services', check: (a) => a.placement_fee_percentage !== null && a.placement_fee_percentage !== undefined, required: false },
    { key: 'guarantee_period', label: 'Guarantee Period', category: 'services', check: (a) => a.guarantee_period_months !== null && a.guarantee_period_months !== undefined, required: false },

    // OPTIONAL - Authorized Person Details
    { key: 'authorized_person_position', label: 'Authorized Person Position', category: 'authorized', check: (a) => !!(a.authorized_person_position), required: false },
    { key: 'authorized_person_phone', label: 'Authorized Person Phone', category: 'authorized', check: (a) => !!(a.authorized_person_phone), required: false },
    { key: 'authorized_person_email', label: 'Authorized Person Email', category: 'authorized', check: (a) => !!(a.authorized_person_email), required: false },

    // OPTIONAL - Verifications
    { key: 'email_verified', label: 'Email Verified', category: 'verification', check: (a) => a.official_email_verified === true, required: false },
    { key: 'phone_verified', label: 'Phone Verified', category: 'verification', check: (a) => a.contact_phone_verified === true, required: false },

    // OPTIONAL - Documents
    { key: 'contract_template', label: 'Contract Template', category: 'documents', check: (a) => !!(a.agency_contract_template), required: false },

    // OPTIONAL - Credentials
    { key: 'certifications', label: 'Certifications', category: 'credentials', check: (a) => !!(a.certifications && a.certifications.length > 0), required: false },
    { key: 'accreditation', label: 'Accreditation Bodies', category: 'credentials', check: (a) => !!(a.accreditation_bodies && a.accreditation_bodies.length > 0), required: false },

    // OPTIONAL - Support
    { key: 'support_hours', label: 'Support Hours', category: 'support', check: (a) => !!(a.support_hours_start && a.support_hours_end), required: false },
    { key: 'emergency_contact', label: 'Emergency Contact', category: 'support', check: (a) => !!(a.emergency_contact_phone), required: false },
  ];

  // Group requirements by category for display
  const requirementCategories = {
    identity: { label: 'Business Identity', icon: Building2 },
    contact: { label: 'Contact Information', icon: Phone },
    location: { label: 'Location', icon: MapPin },
    authorized: { label: 'Authorized Person', icon: Shield },
    business: { label: 'Business Details', icon: Briefcase },
    services: { label: 'Services', icon: Globe },
    verification: { label: 'Verifications', icon: CheckCircle2 },
    documents: { label: 'Documents', icon: FileText },
    credentials: { label: 'Credentials', icon: Award },
    support: { label: 'Support', icon: Clock },
  };

  // Fetch agencies from GraphQL
  const fetchAgencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build where clause using actual schema fields
      const conditions = {};

      if (searchTerm) {
        conditions._or = [
          { full_name: { _ilike: `%${searchTerm}%` } },
          { business_email: { _ilike: `%${searchTerm}%` } },
          { email: { _ilike: `%${searchTerm}%` } },
          { business_phone: { _ilike: `%${searchTerm}%` } },
          { contact_person_name: { _ilike: `%${searchTerm}%` } }
        ];
      }

      if (verificationFilter !== 'all') {
        if (verificationFilter === 'verified') {
          conditions.license_verified = { _eq: true };
        } else if (verificationFilter === 'pending') {
          conditions._and = [
            { license_verified: { _is_null: true } },
            { verified: { _is_null: true } }
          ];
        } else if (verificationFilter === 'rejected') {
          conditions.verification_status = { _eq: 'rejected' };
        }
      }

      if (subscriptionFilter !== 'all') {
        conditions.subscription_tier = { _ilike: subscriptionFilter };
      }

      const where = Object.keys(conditions).length > 0 ? conditions : null;

      const { data, errors } = await apolloClient.query({
        query: GET_AGENCIES,
        variables: {
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          where
        },
        fetchPolicy: 'network-only'
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to fetch agencies');

      // Transform data using actual schema fields
      const transformedData = (data?.agency_profiles || []).map(profile => {
        // Determine verification status from actual fields
        let verificationStatus = 'pending';
        if (profile.license_verified === true || profile.verified === true) {
          verificationStatus = 'verified';
        } else if (profile.verification_status === 'rejected') {
          verificationStatus = 'rejected';
        }

        return {
          id: profile.id,
          profile_id: profile.id,
          email: profile.business_email || profile.email || 'N/A',
          phone: profile.business_phone || profile.phone || 'N/A',
          location: `${profile.city || 'Unknown'}, ${profile.country || profile.registration_country || 'Ethiopia'}`,
          avatar_url: profile.logo_url,
          created_at: profile.created_at,
          last_active: profile.updated_at,
          business_name: profile.full_name || 'Unknown Agency',
          contact_person: profile.contact_person_name || profile.authorized_person_name || profile.full_name || 'N/A',
          verification_status: verificationStatus,
          subscription_status: (profile.subscription_tier || 'free').toLowerCase().trim(),
          subscription_expires_at: profile.subscription_expires_at,
          rating: parseFloat(profile.average_rating) || 0,
          total_reviews: 0,
          active_maids: profile.active_maids || profile.total_maids || 0,
          total_maids_managed: profile.total_maids_managed || 0,
          placed_maids: profile.successful_placements || 0,
          success_rate: profile.successful_placements && profile.total_maids_managed
            ? Math.round((profile.successful_placements / profile.total_maids_managed) * 100)
            : 0,
          license_number: profile.license_number,
          established_year: profile.established_year,
          specializations: profile.specialization || [],
          service_countries: profile.service_countries || [],
          description: profile.agency_description,
          website: profile.website_url,
          trade_license_status: profile.trade_license_verification_status,
        };
      });

      setAgenciesData(transformedData);
      setTotalCount(data?.agency_profiles_aggregate?.aggregate?.count || 0);

      await logAdminActivity('agencies_page_view', 'admin_users', 'agencies');
    } catch (err) {
      logger.error('Failed to fetch agencies:', err);
      setError('Failed to load agency data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load agencies. Please try again.',
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
        query: GET_AGENCY_STATS,
        fetchPolicy: 'network-only'
      });

      if (data) {
        setStats({
          total: data.total?.aggregate?.count || 0,
          verified: data.verified?.aggregate?.count || 0,
          pending: data.pending?.aggregate?.count || 0,
          rejected: data.rejected?.aggregate?.count || 0,
          pro: data.pro?.aggregate?.count || 0,
          premium: data.premium?.aggregate?.count || 0
        });
      }
    } catch (err) {
      logger.error('Failed to fetch agency stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchAgencies();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, verificationFilter, subscriptionFilter]);

  // GraphQL mutation for verification
  const UPDATE_AGENCY_VERIFICATION = gql`
    mutation UpdateAgencyVerification($agencyId: String!, $isVerified: Boolean!, $verificationStatus: String) {
      update_agency_profiles_by_pk(
        pk_columns: { id: $agencyId }
        _set: { license_verified: $isVerified, verified: $isVerified, verification_status: $verificationStatus, updated_at: "now()" }
      ) {
        id
        license_verified
        verified
        verification_status
      }
    }
  `;

  // Handle verification action
  const handleVerificationAction = async (agencyId, action, reason = '') => {
    try {
      const isVerified = action === 'approve';
      let verificationStatus = 'pending';
      if (action === 'approve') {
        verificationStatus = 'verified';
      } else if (action === 'reject') {
        verificationStatus = 'rejected';
      }

      const { errors } = await apolloClient.mutate({
        mutation: UPDATE_AGENCY_VERIFICATION,
        variables: { agencyId, isVerified, verificationStatus }
      });

      // Log rejection reason if provided
      if (reason && action === 'reject') {
        logger.info(`Agency ${agencyId} rejected. Reason: ${reason}`);
      }

      if (errors) throw new Error(errors[0]?.message || 'Failed to update verification');

      // Optimistic UI update
      setAgenciesData(prev =>
        prev.map(agency =>
          agency.id === agencyId
            ? { ...agency, verification_status: isVerified ? 'verified' : 'rejected' }
            : agency
        )
      );

      await logAdminActivity(`agency_verification_${action}`, 'agency', agencyId);

      toast({
        title: 'Verification Updated',
        description: `Agency has been ${action === 'approve' ? 'verified' : 'rejected'} successfully.`,
      });
    } catch (error) {
      logger.error('Failed to update verification status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status.',
        variant: 'destructive',
      });
      fetchAgencies();
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
    // Agency: free, pro (Professional), premium (Premium)
    const statusConfig = {
      premium: { label: 'Premium', color: 'bg-purple-100 text-purple-800' },
      pro: { label: 'Professional', color: 'bg-blue-100 text-blue-800' },
      professional: { label: 'Professional', color: 'bg-blue-100 text-blue-800' },
      free: { label: 'Free', color: 'bg-gray-100 text-gray-800' },
      basic: { label: 'Free', color: 'bg-gray-100 text-gray-800' }, // Map basic to free
    };

    const config = statusConfig[normalizedStatus] || statusConfig.free;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const AgencyDetailDialog = ({ agency: initialAgency, open, onOpenChange }) => {
    const [selectedMissingItems, setSelectedMissingItems] = useState(new Set());
    const [agencyData, setAgencyData] = useState(initialAgency);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    // Fetch full agency details when dialog opens
    useEffect(() => {
      if (open && initialAgency?.id) {
        fetchFullAgencyDetails(initialAgency.id);
      }
    }, [open, initialAgency?.id]);

    const fetchFullAgencyDetails = async (agencyId) => {
      setDetailsLoading(true);
      try {
        const { data, errors } = await apolloClient.query({
          query: GET_AGENCY_DETAILS,
          variables: { id: agencyId },
          fetchPolicy: 'network-only'
        });

        if (!errors && data?.agency_profiles_by_pk) {
          // Merge with initial data
          setAgencyData({
            ...initialAgency,
            ...data.agency_profiles_by_pk,
            // Keep computed fields from initial data
            verification_status: initialAgency.verification_status,
            subscription_status: initialAgency.subscription_status,
          });
        }
      } catch (err) {
        logger.error('Failed to fetch agency details:', err);
      } finally {
        setDetailsLoading(false);
      }
    };

    if (!initialAgency) return null;

    const agency = agencyData || initialAgency;

    // Calculate profile status for each requirement
    const profileStatus = agencyProfileRequirements.map(req => ({
      ...req,
      isComplete: req.check(agency)
    }));

    // Get counts
    const requiredItems = profileStatus.filter(s => s.required);
    const requiredCompleteCount = requiredItems.filter(s => s.isComplete).length;
    const requiredCount = requiredItems.length;
    const requiredMissing = requiredItems.filter(s => !s.isComplete);

    const completedCount = profileStatus.filter(s => s.isComplete).length;
    const allMissing = profileStatus.filter(s => !s.isComplete);

    const isEligibleForApproval = requiredMissing.length === 0;

    // Toggle missing item selection
    const toggleMissingItem = (key) => {
      setSelectedMissingItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(key)) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
        return newSet;
      });
    };

    const selectAllMissing = () => {
      setSelectedMissingItems(new Set(allMissing.map(item => item.key)));
    };

    const clearSelection = () => {
      setSelectedMissingItems(new Set());
    };

    // Handle rejection with selected missing items
    const handleRejectWithMissingItems = () => {
      const selectedLabels = allMissing
        .filter(item => selectedMissingItems.has(item.key))
        .map(item => item.label);

      let reason = rejectionReason;
      if (selectedLabels.length > 0) {
        reason = `Missing required information: ${selectedLabels.join(', ')}${rejectionReason ? `. Additional notes: ${rejectionReason}` : ''}`;
      }

      handleVerificationAction(agency.id, 'reject', reason);
      onOpenChange(false);
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-slate-50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                  <AvatarImage src={agency.avatar_url || agency.logo_url} />
                  <AvatarFallback className="bg-blue-100">
                    <Building2 className="h-7 w-7 text-blue-600" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-semibold">{agency.business_name || agency.full_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {getVerificationBadge(agency.verification_status)}
                    {getSubscriptionBadge(agency.subscription_status)}
                    {agency.license_number && (
                      <span className="text-xs text-slate-500">License: {agency.license_number}</span>
                    )}
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Agency profile verification and details
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Loading overlay */}
          {detailsLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-slate-600">Loading agency details...</p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-3 gap-0 h-[calc(95vh-120px)]">
            {/* Left Column - Agency Details (2/3 width) */}
            <ScrollArea className="col-span-2 h-full border-r">
              <div className="p-6 space-y-4">
                {/* Business Identity */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      Business Identity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Agency Name</p>
                        <p className={`text-sm font-medium ${!agency.full_name ? 'text-red-500' : ''}`}>
                          {agency.full_name || agency.business_name || 'Missing'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Trade License Number</p>
                        <p className={`text-sm font-medium ${!agency.license_number ? 'text-red-500' : ''}`}>
                          {agency.license_number || 'Missing'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">License Expiry</p>
                        <p className="text-sm">{agency.license_expiry_date ? new Date(agency.license_expiry_date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Year Established</p>
                        <p className="text-sm">{agency.established_year || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Trade License Document */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-slate-500 mb-2">Trade License Document</p>
                      {agency.trade_license_document ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={agency.trade_license_document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            View Document
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <Badge className={
                            agency.trade_license_verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                            agency.trade_license_verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {agency.trade_license_verification_status || 'pending'}
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500">No document uploaded</p>
                      )}
                    </div>
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
                        <span className="text-xs text-slate-500">Email</span>
                        <span className={`text-sm font-medium flex items-center gap-1 ${!(agency.business_email || agency.email) ? 'text-red-500' : ''}`}>
                          {agency.business_email || agency.email || 'Missing'}
                          {agency.official_email_verified && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Phone</span>
                        <span className={`text-sm font-medium flex items-center gap-1 ${!(agency.business_phone || agency.phone) ? 'text-red-500' : ''}`}>
                          {agency.business_phone || agency.phone || 'Missing'}
                          {agency.contact_phone_verified && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        </span>
                      </div>
                      {agency.website_url && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Website</span>
                          <a href={agency.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            Visit <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {agency.emergency_contact_phone && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Emergency</span>
                          <span className="text-sm">{agency.emergency_contact_phone}</span>
                        </div>
                      )}
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
                        <span className={`text-sm font-medium ${!(agency.country || agency.registration_country) ? 'text-red-500' : ''}`}>
                          {agency.country || agency.registration_country || 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">City</span>
                        <span className={`text-sm ${!agency.city ? 'text-red-500' : ''}`}>
                          {agency.city || 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Address</span>
                        <span className="text-sm truncate max-w-[150px]" title={agency.business_address || agency.head_office_address}>
                          {agency.business_address || agency.head_office_address || 'N/A'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Authorized Person */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-slate-500" />
                      Authorized Person
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Name</p>
                        <p className={`text-sm font-medium ${!(agency.authorized_person_name || agency.contact_person_name) ? 'text-red-500' : ''}`}>
                          {agency.authorized_person_name || agency.contact_person_name || 'Missing'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Position</p>
                        <p className="text-sm">{agency.authorized_person_position || agency.contact_person_title || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <span className="text-sm flex items-center gap-1">
                          {agency.authorized_person_phone || 'N/A'}
                          {agency.authorized_person_phone_verified && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <span className="text-sm flex items-center gap-1">
                          {agency.authorized_person_email || 'N/A'}
                          {agency.authorized_person_email_verified && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        </span>
                      </div>
                    </div>

                    {/* ID Document */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-slate-500 mb-2">ID Document</p>
                      {agency.authorized_person_id_document ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={agency.authorized_person_id_document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            View ID Document
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <Badge className={
                            agency.authorized_person_id_verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                            agency.authorized_person_id_verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {agency.authorized_person_id_verification_status || 'pending'}
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500">No ID document uploaded</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Services & Specializations */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4 text-slate-500" />
                      Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Specializations</p>
                      {(agency.specialization || agency.specializations || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(agency.specialization || agency.specializations || []).map((spec, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{spec}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No specializations listed</p>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Service Countries</p>
                      {(agency.service_countries || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {agency.service_countries.map((country, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs border-blue-200 text-blue-700">{country}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Not specified</p>
                      )}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Placement Fee</p>
                        <p className="text-sm">{agency.placement_fee_percentage ? `${agency.placement_fee_percentage}%` : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Guarantee Period</p>
                        <p className="text-sm">{agency.guarantee_period_months ? `${agency.guarantee_period_months} months` : 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                {agency.agency_description && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600">{agency.agency_description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Performance Metrics */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-slate-500" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{agency.rating?.toFixed(1) || agency.average_rating?.toFixed(1) || '0.0'}</p>
                        <p className="text-xs text-slate-500">Rating</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{agency.active_maids || 0}</p>
                        <p className="text-xs text-slate-500">Active Maids</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{agency.total_maids_managed || agency.total_maids || 0}</p>
                        <p className="text-xs text-slate-500">Total Managed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{agency.placed_maids || agency.successful_placements || 0}</p>
                        <p className="text-xs text-slate-500">Placements</p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Registered: {agency.created_at ? new Date(agency.created_at).toLocaleDateString() : 'N/A'}</span>
                      <span>Last Updated: {agency.updated_at ? new Date(agency.updated_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Credentials & Certifications */}
                {((agency.certifications || []).length > 0 || (agency.accreditation_bodies || []).length > 0) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Award className="h-4 w-4 text-slate-500" />
                        Credentials & Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(agency.certifications || []).length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Certifications</p>
                          <div className="flex flex-wrap gap-1">
                            {agency.certifications.map((cert, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{cert}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {(agency.accreditation_bodies || []).length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-2">Accreditation Bodies</p>
                          <div className="flex flex-wrap gap-1">
                            {agency.accreditation_bodies.map((body, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{body}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>

            {/* Right Column - Verification & Actions (1/3 width) */}
            <div className="p-4 space-y-4 overflow-y-auto bg-slate-50">
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
                      <span>{completedCount}/{agencyProfileRequirements.length}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isEligibleForApproval ? 'bg-green-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${(completedCount / agencyProfileRequirements.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Requirements List - Compact */}
                  <div className="max-h-40 overflow-y-auto space-y-1 mb-4 pr-1">
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
                  <CardHeader className="pb-2 bg-slate-100">
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
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                      {allMissing.map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <Checkbox
                            checked={selectedMissingItems.has(item.key)}
                            onCheckedChange={() => toggleMissingItem(item.key)}
                            className="h-3.5 w-3.5"
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

              {/* Rejection Reason */}
              {!isEligibleForApproval && (
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Additional Notes (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Add any additional notes for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="h-20 text-sm"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <Card className="border-2 border-slate-200">
                <CardContent className="pt-4 space-y-2">
                  <Button
                    onClick={() => {
                      handleVerificationAction(agency.id, 'approve');
                      onOpenChange(false);
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm"
                    disabled={!isEligibleForApproval || detailsLoading}
                    size="lg"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    {isEligibleForApproval ? 'Approve Agency' : `Approve Agency (${requiredMissing.length} missing)`}
                  </Button>

                  <Button
                    onClick={handleRejectWithMissingItems}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-sm"
                    size="lg"
                    disabled={detailsLoading}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Reject {selectedMissingItems.size > 0 && `(${selectedMissingItems.size})`}
                  </Button>

                  <Button
                    onClick={() => {
                      handleVerificationAction(agency.id, 'pending');
                      onOpenChange(false);
                    }}
                    variant="outline"
                    className="w-full border-slate-300"
                    size="lg"
                    disabled={detailsLoading}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Set Pending
                  </Button>

                  <Separator className="my-3" />

                  {/* Subscription Info */}
                  <div className="bg-slate-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500">Current Plan</span>
                      {getSubscriptionBadge(agency.subscription_status)}
                    </div>
                    {agency.subscription_expires_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Expires</span>
                        <span className="text-xs font-medium">
                          {new Date(agency.subscription_expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Loading state
  if (loading && agenciesData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agencies data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && agenciesData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAgencies}>
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
          <h1 className="text-3xl font-bold">Agency Management</h1>
          <p className="text-muted-foreground">Manage and monitor all agency profiles</p>
        </div>
        <Button onClick={fetchAgencies} variant="outline" disabled={loading}>
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
                placeholder="Search by name, email, or business..."
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
                <SelectItem value="pro">Professional</SelectItem>
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
                <p className="text-sm font-medium text-muted-foreground">Total Agencies</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
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
                <p className="text-sm font-medium text-muted-foreground">Professional</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pro}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
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
      </div>

      {/* Agencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agencies List</CardTitle>
          <CardDescription>
            Showing {agenciesData.length} of {totalCount} total agencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agenciesData.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No Agencies Found"
              description={searchTerm || verificationFilter !== 'all' || subscriptionFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No agency profiles in the database yet'}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agency</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agenciesData.map((agency) => (
                    <TableRow key={agency.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={agency.avatar_url} />
                            <AvatarFallback>
                              <Building2 className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{agency.business_name}</p>
                            <p className="text-sm text-muted-foreground">{agency.contact_person}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{agency.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{agency.active_maids || 0} active</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{agency.success_rate || 0}% success</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getVerificationBadge(agency.verification_status)}</TableCell>
                      <TableCell>{getSubscriptionBadge(agency.subscription_status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{agency.rating || 0}</span>
                          <span className="text-xs text-muted-foreground">
                            ({agency.total_reviews || 0})
                          </span>
                        </div>
                      </TableCell>
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
                                setSelectedAgency(agency);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {agency.verification_status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleVerificationAction(agency.id, 'approve')}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleVerificationAction(agency.id, 'reject')}>
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
      <AgencyDetailDialog
        agency={selectedAgency}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
};

export default AdminAgenciesPage;
