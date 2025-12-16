import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProfileSelector } from '@/components/ui/profile-selector';
import {
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  User,
  Building2,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Award,
  AlertCircle,
  Target,
  Users,
  BookOpen,
  FileCheck,
  Plus,
  ExternalLink,
  Image,
  FileSignature,
  BadgeCheck,
  Loader2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import AgencyDashboardService from '@/services/agencyDashboardService';
import { agencyService } from '@/services/agencyService';
import { useAuth } from '@/contexts/AuthContext';

const AgencyDocumentsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState([]);
  const [complianceChecklist, setComplianceChecklist] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Agency profile documents from Hasura
  const [agencyProfile, setAgencyProfile] = useState(null);
  const [agencyDocsLoading, setAgencyDocsLoading] = useState(true);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [ownerTypeFilter, setOwnerTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialogs
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Form data
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    document_type: 'passport',
    owner_type: 'maid',
    owner_name: '',
    owner_id: null,
    file: null
  });

  const [selectedProfile, setSelectedProfile] = useState(null);

  const [verifyForm, setVerifyForm] = useState({
    status: 'verified',
    notes: ''
  });

  const [uploadError, setUploadError] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  // Get authenticated user's ID - agencies use their auth user ID
  const agencyId = user?.id;

  useEffect(() => {
    loadData();
  }, [agencyId]);

  useEffect(() => {
    applyFilters();
  }, [documents, statusFilter, typeFilter, ownerTypeFilter, searchTerm]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setAgencyDocsLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!agencyId) {
        setError('User not authenticated. Please log in.');
        setIsLoading(false);
        setAgencyDocsLoading(false);
        return;
      }

      // Fetch agency profile documents from Hasura
      const profileResult = await agencyService.getAgencyProfile(agencyId);
      if (profileResult.data) {
        setAgencyProfile(profileResult.data);
      }

      // Fetch other documents (legacy system)
      try {
        const [docsData, complianceData] = await Promise.all([
          AgencyDashboardService.getDocumentsWithFilters(agencyId),
          AgencyDashboardService.getComplianceChecklist(agencyId)
        ]);
        setDocuments(docsData || []);
        setComplianceChecklist(complianceData || []);
      } catch (legacyError) {
        console.warn('Legacy documents system not available:', legacyError.message);
        setDocuments([]);
        setComplianceChecklist([]);
      }
    } catch (error) {
      console.error('Failed to load documents data:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      // Provide more specific error messages
      let errorMessage = 'Failed to load documents. ';
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        errorMessage += 'Database tables not found. Please run the migration first.';
      } else if (error.message?.includes('permission denied')) {
        errorMessage += 'Permission denied. Please check your access rights.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }

      setError(errorMessage);
      setDocuments([]);
      setComplianceChecklist([]);
    } finally {
      setIsLoading(false);
      setAgencyDocsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = documents;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === typeFilter);
    }

    if (ownerTypeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.owner_type === ownerTypeFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  };

  const validateUploadForm = () => {
    if (!uploadForm.title.trim()) {
      setUploadError('Document title is required');
      return false;
    }
    if (!selectedProfile || !uploadForm.owner_id) {
      setUploadError('Please select a document owner');
      return false;
    }
    if (uploadForm.file && uploadForm.file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return false;
    }
    setUploadError(null);
    return true;
  };

  const handleUploadDocument = async () => {
    if (!validateUploadForm()) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      const document = await AgencyDashboardService.uploadDocument(uploadForm, agencyId);
      setDocuments(prev => [document, ...prev]);
      setIsUploadDialogOpen(false);
      setSelectedProfile(null);
      setUploadForm({
        title: '',
        description: '',
        document_type: 'passport',
        owner_type: 'maid',
        owner_name: '',
        owner_id: null,
        file: null
      });
    } catch (error) {
      console.error('Failed to upload document:', error);
      setUploadError(error.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifyDocument = async () => {
    if (!selectedDocument) return;

    try {
      setIsVerifying(true);
      setVerifyError(null);
      await AgencyDashboardService.updateDocumentStatus(
        selectedDocument.id,
        verifyForm.status,
        verifyForm.notes,
        agencyId
      );

      setDocuments(prev => prev.map(doc =>
        doc.id === selectedDocument.id
          ? {
              ...doc,
              status: verifyForm.status,
              verification_status: verifyForm.status === 'rejected' ? 'rejected' : verifyForm.status === 'verified' ? 'approved' : 'pending',
              notes: verifyForm.notes,
              verified_at: verifyForm.status === 'verified' ? new Date().toISOString().split('T')[0] : null
            }
          : doc
      ));

      setIsVerifyDialogOpen(false);
      setSelectedDocument(null);
      setVerifyForm({ status: 'verified', notes: '' });
    } catch (error) {
      console.error('Failed to verify document:', error);
      setVerifyError(error.message || 'Failed to update document status. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const updateComplianceItem = async (itemId, status) => {
    try {
      await AgencyDashboardService.updateComplianceItem(itemId, status, agencyId);

      setComplianceChecklist(prev => prev.map(category => ({
        ...category,
        items: category.items.map(item =>
          item.id === itemId ? { ...item, status } : item
        ),
        completed_items: category.items.filter(item =>
          item.id === itemId ? status === 'completed' : item.status === 'completed'
        ).length,
        compliance_percentage: Math.round(
          (category.items.filter(item =>
            item.id === itemId ? status === 'completed' : item.status === 'completed'
          ).length / category.total_items) * 100
        )
      })));
    } catch (error) {
      console.error('Failed to update compliance item:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending_review: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      expiring_soon: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      missing_info: { color: 'bg-purple-100 text-purple-800', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.pending_review;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status?.replace('_', ' ').charAt(0).toUpperCase() + status?.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getComplianceStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      overdue: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status?.replace('_', ' ').charAt(0).toUpperCase() + status?.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getDocumentTypeIcon = (type) => {
    const iconMap = {
      passport: Shield,
      medical_certificate: Award,
      sponsor_license: FileCheck,
      national_id: User,
      contract: BookOpen,
      agency_license: Building2,
      experience_letter: FileText
    };

    const IconComponent = iconMap[type] || FileText;
    return <IconComponent className="h-5 w-5" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysDiff = (expiry - today) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30 && daysDiff > 0;
  };

  const getOwnerTypeIcon = (type) => {
    const iconMap = {
      maid: User,
      sponsor: Users,
      agency: Building2
    };
    const IconComponent = iconMap[type] || User;
    return IconComponent;
  };

  // Helper to get verification status badge
  const getVerificationStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Verified' },
      verified: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Verified' },
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending Review' },
      pending_review: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending Review' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Rejected' },
      not_uploaded: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: AlertCircle, label: 'Not Uploaded' }
    };
    const config = statusConfig[status] || statusConfig.not_uploaded;
    const IconComponent = config.icon;
    return (
      <Badge className={`${config.color} border px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Agency Profile Document Card Component
  const AgencyDocumentCard = ({ title, description, documentUrl, verificationStatus, rejectionReason, icon: Icon, onView, onUpload }) => {
    const hasDocument = !!documentUrl;

    return (
      <Card className={`group hover:shadow-lg transition-all duration-300 border-2 ${hasDocument ? 'border-transparent hover:border-orange-200' : 'border-dashed border-gray-300 hover:border-orange-300'}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`p-3 rounded-xl ${hasDocument ? 'bg-gradient-to-br from-orange-100 to-amber-100' : 'bg-gray-100'} group-hover:scale-105 transition-transform duration-300`}>
              <Icon className={`h-6 w-6 ${hasDocument ? 'text-orange-600' : 'text-gray-400'}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{title}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                </div>
                {getVerificationStatusBadge(hasDocument ? (verificationStatus || 'pending') : 'not_uploaded')}
              </div>

              {/* Rejection Reason */}
              {rejectionReason && verificationStatus === 'rejected' && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700">
                    <strong>Rejection Reason:</strong> {rejectionReason}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                {hasDocument ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => onView(documentUrl, title)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => window.open(documentUrl, '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={onUpload}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      Replace
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="text-xs bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={onUpload}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Upload Document
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Agency Documents Section Component
  const AgencyDocumentsSection = () => {
    if (agencyDocsLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                    <div className="h-8 w-24 bg-gray-200 rounded mt-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!agencyProfile) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Agency Profile Found</h3>
            <p className="text-gray-500 text-center">
              Please complete your agency profile to manage documents.
            </p>
          </CardContent>
        </Card>
      );
    }

    const agencyDocuments = [
      {
        id: 'trade_license',
        title: 'Trade License / Business Registration',
        description: 'Official business registration or trade license document',
        documentUrl: agencyProfile.trade_license_document,
        verificationStatus: agencyProfile.trade_license_verification_status,
        rejectionReason: agencyProfile.trade_license_rejection_reason,
        icon: FileCheck,
        required: true
      },
      {
        id: 'authorized_person_id',
        title: 'Authorized Person ID',
        description: 'Passport or National ID of the authorized representative',
        documentUrl: agencyProfile.authorized_person_id_document,
        verificationStatus: agencyProfile.authorized_person_id_verification_status,
        rejectionReason: agencyProfile.authorized_person_id_rejection_reason,
        icon: Shield,
        required: true
      },
      {
        id: 'agency_logo',
        title: 'Agency Logo',
        description: 'Official logo for your agency profile',
        documentUrl: agencyProfile.logo_url,
        verificationStatus: agencyProfile.logo_url ? 'approved' : 'not_uploaded',
        rejectionReason: null,
        icon: Image,
        required: false
      },
      {
        id: 'contract_template',
        title: 'Contract Template',
        description: 'Standard employment contract template',
        documentUrl: agencyProfile.agency_contract_template,
        verificationStatus: agencyProfile.contract_template_verification_status,
        rejectionReason: null,
        icon: FileSignature,
        required: false
      }
    ];

    const uploadedCount = agencyDocuments.filter(d => d.documentUrl).length;
    const verifiedCount = agencyDocuments.filter(d => d.verificationStatus === 'approved' || d.verificationStatus === 'verified').length;
    const pendingCount = agencyDocuments.filter(d => d.documentUrl && (d.verificationStatus === 'pending' || d.verificationStatus === 'pending_review')).length;

    const handleViewDocument = (url, title) => {
      setPreviewDocument({ url, title });
    };

    const handleUploadDocument = (docId) => {
      // Navigate to profile page to upload - or could open a modal
      window.location.href = '/dashboard/agency/profile';
    };

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardContent className="p-4 text-center">
              <FileText className="h-6 w-6 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-blue-900">{agencyDocuments.length}</p>
              <p className="text-xs text-blue-700">Total Documents</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-900">{verifiedCount}</p>
              <p className="text-xs text-green-700">Verified</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-100">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto text-yellow-600 mb-2" />
              <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
              <p className="text-xs text-yellow-700">Pending Review</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
            <CardContent className="p-4 text-center">
              <Upload className="h-6 w-6 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-900">{uploadedCount}/{agencyDocuments.length}</p>
              <p className="text-xs text-purple-700">Uploaded</p>
            </CardContent>
          </Card>
        </div>

        {/* Overall Verification Status */}
        {agencyProfile.verification_status && (
          <Card className={`border-2 ${
            agencyProfile.verification_status === 'verified' ? 'border-green-200 bg-green-50' :
            agencyProfile.verification_status === 'pending' ? 'border-yellow-200 bg-yellow-50' :
            'border-gray-200 bg-gray-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BadgeCheck className={`h-8 w-8 ${
                  agencyProfile.verification_status === 'verified' ? 'text-green-600' :
                  agencyProfile.verification_status === 'pending' ? 'text-yellow-600' :
                  'text-gray-500'
                }`} />
                <div>
                  <h4 className="font-semibold text-gray-900">Agency Verification Status</h4>
                  <p className="text-sm text-gray-600">
                    {agencyProfile.verification_status === 'verified'
                      ? 'Your agency is fully verified and approved.'
                      : agencyProfile.verification_status === 'pending'
                      ? 'Your documents are under review. This usually takes 24-48 hours.'
                      : 'Please upload all required documents for verification.'}
                  </p>
                </div>
                <div className="ml-auto">
                  {getVerificationStatusBadge(agencyProfile.verification_status)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-600" />
            Agency Documents
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agencyDocuments.map((doc) => (
              <AgencyDocumentCard
                key={doc.id}
                title={doc.title}
                description={doc.description}
                documentUrl={doc.documentUrl}
                verificationStatus={doc.verificationStatus}
                rejectionReason={doc.rejectionReason}
                icon={doc.icon}
                onView={handleViewDocument}
                onUpload={() => handleUploadDocument(doc.id)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const DocumentCard = ({ document }) => {
    const OwnerIcon = getOwnerTypeIcon(document.owner_type);

    return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {getDocumentTypeIcon(document.document_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{document.title}</h4>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs capitalize">
                  <OwnerIcon className="h-3 w-3 mr-1" />
                  {document.owner_type}
                </Badge>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-600 truncate">{document.owner_name}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                View Document
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedDocument(document);
                  setVerifyForm({
                    status: document.status === 'verified' ? 'rejected' : 'verified',
                    notes: document.notes || ''
                  });
                  setIsVerifyDialogOpen(true);
                }}
              >
                {document.status === 'verified' ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    <span className="text-red-600">Reject</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-green-600">Verify</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {getStatusBadge(document.status)}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {formatDate(document.uploaded_at)}
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>File Size:</span>
              <span>{document.file_size}</span>
            </div>
            {document.expires_at && (
              <div className="flex items-center justify-between">
                <span>Expires:</span>
                <span className={isExpiringSoon(document.expires_at) ? 'text-orange-600 font-medium' : ''}>
                  {formatDate(document.expires_at)}
                </span>
              </div>
            )}
            {document.verified_by && (
              <div className="flex items-center justify-between">
                <span>Verified by:</span>
                <span>{document.verified_by.name}</span>
              </div>
            )}
          </div>

          {document.notes && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
              {document.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    );
  };

  const ComplianceSection = ({ category }) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{category.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{category.category}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <Badge variant={category.priority === 'critical' ? 'destructive' : 'outline'}>
                {category.priority}
              </Badge>
              <span className="text-2xl font-bold text-gray-900">
                {category.compliance_percentage}%
              </span>
            </div>
            <Progress value={category.compliance_percentage} className="w-20 mt-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {category.items.map(item => (
            <div key={item.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h5 className="font-medium text-gray-900">{item.requirement}</h5>
                  {getComplianceStatusBadge(item.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Responsible: {item.responsible}</span>
                  {item.due_date && (
                    <span className={new Date(item.due_date) < new Date() ? 'text-red-600' : ''}>
                      Due: {formatDate(item.due_date)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-1 ml-3">
                {item.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateComplianceItem(item.id, 'completed')}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                {item.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateComplianceItem(item.id, 'pending')}
                    className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Stats calculations
  const totalDocuments = documents.length;
  const pendingDocuments = documents.filter(d => d.status === 'pending_review').length;
  const verifiedDocuments = documents.filter(d => d.status === 'verified').length;
  const expiringDocuments = documents.filter(d => isExpiringSoon(d.expires_at)).length;
  const overallCompliance = Math.round(
    complianceChecklist.reduce((sum, category) => sum + category.compliance_percentage, 0) /
    (complianceChecklist.length || 1)
  );

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Documents & Compliance</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">Manage documents and track regulatory compliance</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadData}
                  className="ml-2"
                >
                  Retry
                </Button>
              </div>

              {error.includes('Database tables not found') && (
                <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                  <p className="font-semibold text-yellow-900 mb-2">🔧 Migration Required</p>
                  <p className="text-yellow-800 mb-3">
                    The database tables need to be created. Please contact your administrator to run the required Hasura migrations.
                  </p>
                  <p className="mt-3 text-xs text-yellow-700">
                    See <code>MIGRATION_REQUIRED.md</code> for detailed instructions.
                  </p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <TabsList className="grid w-full md:max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            <Button onClick={() => setIsUploadDialogOpen(true)} className="flex-1 md:flex-none">
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Upload Document</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Agency Profile Documents Section */}
          <AgencyDocumentsSection />

          {/* Legacy Documents Stats - Only show if there are documents */}
          {documents.length > 0 && (
            <>
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Maid & Sponsor Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <FileText className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                      <p className="text-xl font-bold text-gray-900">{totalDocuments}</p>
                      <p className="text-xs text-gray-600">Total Documents</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Clock className="h-6 w-6 mx-auto text-yellow-600 mb-2" />
                      <p className="text-xl font-bold text-gray-900">{pendingDocuments}</p>
                      <p className="text-xs text-gray-600">Pending Review</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-2" />
                      <p className="text-xl font-bold text-gray-900">{verifiedDocuments}</p>
                      <p className="text-xs text-gray-600">Verified</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                      <p className="text-xl font-bold text-gray-900">{overallCompliance}%</p>
                      <p className="text-xs text-gray-600">Compliance</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                  Documents Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                {[...documents.filter(d => d.status === 'pending_review' || d.status === 'rejected' || d.status === 'missing_info')].slice(0, 5).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">All documents are up to date</p>
                ) : (
                  <div className="space-y-3">
                    {[...documents.filter(d => d.status === 'pending_review' || d.status === 'rejected' || d.status === 'missing_info')].slice(0, 5).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                          <p className="text-sm text-gray-600">{doc.owner_name}</p>
                        </div>
                        {getStatusBadge(doc.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-red-600" />
                  Expiring Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiringDocuments === 0 ? (
                  <p className="text-gray-500 text-center py-4">No documents expiring soon</p>
                ) : (
                  <div className="space-y-3">
                    {documents.filter(d => isExpiringSoon(d.expires_at)).slice(0, 5).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                          <p className="text-sm text-orange-600">
                            Expires: {formatDate(doc.expires_at)}
                          </p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">
                          Expiring Soon
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Compliance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {complianceChecklist.map(category => (
                  <div key={category.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{category.title}</h4>
                      <Badge variant={category.priority === 'critical' ? 'destructive' : 'outline'}>
                        {category.priority}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{category.compliance_percentage}%</span>
                      </div>
                      <Progress value={category.compliance_percentage} />
                      <p className="text-xs text-gray-500">
                        {category.completed_items} of {category.total_items} items completed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {/* Agency Documents Section */}
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Agency Documents</CardTitle>
                    <CardDescription>Your agency's official documents and verifications</CardDescription>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => window.location.href = '/dashboard/agency/profile'}>
                  <Edit className="h-4 w-4 mr-1" />
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Trade License */}
                <div className={`p-3 rounded-lg border-2 transition-all ${agencyProfile?.trade_license_document ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck className={`h-4 w-4 ${agencyProfile?.trade_license_document ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-900">Trade License</span>
                  </div>
                  {agencyProfile?.trade_license_document ? (
                    <div className="flex items-center justify-between">
                      {getVerificationStatusBadge(agencyProfile?.trade_license_verification_status || 'pending')}
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setPreviewDocument({ url: agencyProfile.trade_license_document, title: 'Trade License' })}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-500">Not uploaded</Badge>
                  )}
                </div>

                {/* Authorized Person ID */}
                <div className={`p-3 rounded-lg border-2 transition-all ${agencyProfile?.authorized_person_id_document ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className={`h-4 w-4 ${agencyProfile?.authorized_person_id_document ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-900">Person ID</span>
                  </div>
                  {agencyProfile?.authorized_person_id_document ? (
                    <div className="flex items-center justify-between">
                      {getVerificationStatusBadge(agencyProfile?.authorized_person_id_verification_status || 'pending')}
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setPreviewDocument({ url: agencyProfile.authorized_person_id_document, title: 'Authorized Person ID' })}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-500">Not uploaded</Badge>
                  )}
                </div>

                {/* Agency Logo */}
                <div className={`p-3 rounded-lg border-2 transition-all ${agencyProfile?.logo_url ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Image className={`h-4 w-4 ${agencyProfile?.logo_url ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-900">Logo</span>
                  </div>
                  {agencyProfile?.logo_url ? (
                    <div className="flex items-center justify-between">
                      {getVerificationStatusBadge('approved')}
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setPreviewDocument({ url: agencyProfile.logo_url, title: 'Agency Logo' })}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-500">Not uploaded</Badge>
                  )}
                </div>

                {/* Contract Template */}
                <div className={`p-3 rounded-lg border-2 transition-all ${agencyProfile?.agency_contract_template ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileSignature className={`h-4 w-4 ${agencyProfile?.agency_contract_template ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-900">Contract</span>
                  </div>
                  {agencyProfile?.agency_contract_template ? (
                    <div className="flex items-center justify-between">
                      {getVerificationStatusBadge(agencyProfile?.contract_template_verification_status || 'pending')}
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setPreviewDocument({ url: agencyProfile.agency_contract_template, title: 'Contract Template' })}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-500">Not uploaded</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maid & Sponsor Documents Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Maid & Sponsor Documents
              </h3>
              <Button onClick={() => setIsUploadDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Document
              </Button>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search documents by name, owner, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="pending_review">Pending Review</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                        <SelectItem value="missing_info">Missing Info</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <FileText className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="medical_certificate">Medical Certificate</SelectItem>
                        <SelectItem value="experience_letter">Experience Letter</SelectItem>
                        <SelectItem value="sponsor_license">Sponsor License</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
                      <SelectTrigger>
                        <Users className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Owners</SelectItem>
                        <SelectItem value="maid">Maids</SelectItem>
                        <SelectItem value="sponsor">Sponsors</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active Filters Display */}
                  {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || ownerTypeFilter !== 'all') && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-500">Active filters:</span>
                      {searchTerm && (
                        <Badge variant="secondary" className="text-xs">
                          Search: {searchTerm}
                          <button className="ml-1" onClick={() => setSearchTerm('')}>×</button>
                        </Badge>
                      )}
                      {statusFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Status: {statusFilter.replace('_', ' ')}
                          <button className="ml-1" onClick={() => setStatusFilter('all')}>×</button>
                        </Badge>
                      )}
                      {typeFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Type: {typeFilter.replace('_', ' ')}
                          <button className="ml-1" onClick={() => setTypeFilter('all')}>×</button>
                        </Badge>
                      )}
                      {ownerTypeFilter !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Owner: {ownerTypeFilter}
                          <button className="ml-1" onClick={() => setOwnerTypeFilter('all')}>×</button>
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setTypeFilter('all');
                          setOwnerTypeFilter('all');
                        }}
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Results */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                        <div className="flex-1">
                          <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                          <div className="h-3 w-1/2 bg-gray-200 rounded" />
                        </div>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded" />
                      <div className="h-8 w-24 bg-gray-200 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || ownerTypeFilter !== 'all'
                    ? 'No documents match your current filters. Try adjusting your search criteria.'
                    : 'Upload documents for your maids and sponsors to manage them here.'}
                </p>
                <div className="flex gap-2">
                  {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || ownerTypeFilter !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setTypeFilter('all');
                        setOwnerTypeFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results Count */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Showing {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">{filteredDocuments.filter(d => d.status === 'verified').length} verified</span>
                  <span>•</span>
                  <span className="text-yellow-600">{filteredDocuments.filter(d => d.status === 'pending_review').length} pending</span>
                </div>
              </div>

              {/* Document Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map(document => (
                  <DocumentCard key={document.id} document={document} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {/* Compliance Header with Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-900">{overallCompliance}%</p>
                    <p className="text-xs text-green-700">Overall Compliance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{complianceChecklist.length}</p>
                    <p className="text-xs text-blue-700">Total Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-900">
                      {complianceChecklist.reduce((sum, c) => sum + (c.total_items - c.completed_items), 0)}
                    </p>
                    <p className="text-xs text-yellow-700">Pending Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-900">
                      {complianceChecklist.reduce((sum, c) => sum + c.completed_items, 0)}
                    </p>
                    <p className="text-xs text-purple-700">Completed Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agency-Specific Compliance Checklist */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Agency Compliance Requirements</CardTitle>
                    <CardDescription>Essential documents and verifications for your agency</CardDescription>
                  </div>
                </div>
                <Badge variant={agencyProfile?.verification_status === 'verified' ? 'default' : 'secondary'} className={agencyProfile?.verification_status === 'verified' ? 'bg-green-100 text-green-800' : ''}>
                  {agencyProfile?.verification_status === 'verified' ? 'Compliant' : 'In Progress'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {/* Trade License */}
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${agencyProfile?.trade_license_document ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <FileCheck className={`h-5 w-5 ${agencyProfile?.trade_license_document ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Trade License / Business Registration</h4>
                        <p className="text-sm text-gray-500">Required for agency verification</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVerificationStatusBadge(agencyProfile?.trade_license_document ? (agencyProfile?.trade_license_verification_status || 'pending') : 'not_uploaded')}
                      {!agencyProfile?.trade_license_document && (
                        <Button size="sm" variant="outline" onClick={() => window.location.href = '/dashboard/agency/profile'}>
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Authorized Person ID */}
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${agencyProfile?.authorized_person_id_document ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Shield className={`h-5 w-5 ${agencyProfile?.authorized_person_id_document ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Authorized Person ID Document</h4>
                        <p className="text-sm text-gray-500">Passport or National ID of representative</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVerificationStatusBadge(agencyProfile?.authorized_person_id_document ? (agencyProfile?.authorized_person_id_verification_status || 'pending') : 'not_uploaded')}
                      {!agencyProfile?.authorized_person_id_document && (
                        <Button size="sm" variant="outline" onClick={() => window.location.href = '/dashboard/agency/profile'}>
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Agency Logo */}
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${agencyProfile?.logo_url ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Image className={`h-5 w-5 ${agencyProfile?.logo_url ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Agency Logo</h4>
                        <p className="text-sm text-gray-500">Official branding for your profile</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVerificationStatusBadge(agencyProfile?.logo_url ? 'approved' : 'not_uploaded')}
                      {!agencyProfile?.logo_url && (
                        <Button size="sm" variant="outline" onClick={() => window.location.href = '/dashboard/agency/profile'}>
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contract Template */}
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${agencyProfile?.agency_contract_template ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <FileSignature className={`h-5 w-5 ${agencyProfile?.agency_contract_template ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Contract Template</h4>
                        <p className="text-sm text-gray-500">Standard employment contract</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVerificationStatusBadge(agencyProfile?.agency_contract_template ? (agencyProfile?.contract_template_verification_status || 'pending') : 'not_uploaded')}
                      {!agencyProfile?.agency_contract_template && (
                        <Button size="sm" variant="outline" onClick={() => window.location.href = '/dashboard/agency/profile'}>
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${agencyProfile?.full_name && agencyProfile?.license_number ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Building2 className={`h-5 w-5 ${agencyProfile?.full_name && agencyProfile?.license_number ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Complete Agency Profile</h4>
                        <p className="text-sm text-gray-500">Agency name, license number, contact details</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVerificationStatusBadge(agencyProfile?.full_name && agencyProfile?.license_number ? 'approved' : 'not_uploaded')}
                      {(!agencyProfile?.full_name || !agencyProfile?.license_number) && (
                        <Button size="sm" variant="outline" onClick={() => window.location.href = '/dashboard/agency/profile'}>
                          <Edit className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legacy Compliance Sections */}
          {complianceChecklist.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Additional Compliance Categories
              </h3>
              {complianceChecklist.map(category => (
                <ComplianceSection key={category.id} category={category} />
              ))}
            </div>
          )}

          {/* Empty State for Compliance */}
          {complianceChecklist.length === 0 && !agencyProfile && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Target className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Compliance Data</h3>
                <p className="text-gray-500 text-center mb-6">
                  Complete your agency profile to view compliance requirements.
                </p>
                <Button onClick={() => window.location.href = '/dashboard/agency/profile'}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Complete Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        setIsUploadDialogOpen(open);
        if (!open) {
          setUploadError(null);
          setSelectedProfile(null);
          setUploadForm({
            title: '',
            description: '',
            document_type: 'passport',
            owner_type: 'maid',
            owner_name: '',
            owner_id: null,
            file: null
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
            <DialogDescription>
              Upload a new document for verification
            </DialogDescription>
          </DialogHeader>

          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Document Title <span className="text-red-500">*</span></Label>
              <Input
                id="doc-title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter document title"
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-description">Description</Label>
              <Textarea
                id="doc-description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter document description"
                rows={3}
                disabled={isUploading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doc-type">Document Type</Label>
                <Select
                  value={uploadForm.document_type}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, document_type: value }))}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="medical_certificate">Medical Certificate</SelectItem>
                    <SelectItem value="sponsor_license">Sponsor License</SelectItem>
                    <SelectItem value="national_id">National ID</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="experience_letter">Experience Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner-type">Owner Type</Label>
                <Select
                  value={uploadForm.owner_type}
                  onValueChange={(value) => {
                    setUploadForm(prev => ({ ...prev, owner_type: value, owner_name: '', owner_id: null }));
                    setSelectedProfile(null);
                  }}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maid">Maid</SelectItem>
                    <SelectItem value="sponsor">Sponsor</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-selector">Document Owner <span className="text-red-500">*</span></Label>
              <ProfileSelector
                ownerType={uploadForm.owner_type}
                agencyId={agencyId}
                value={selectedProfile}
                disabled={isUploading}
                onSelect={(profile) => {
                  setSelectedProfile(profile);
                  setUploadForm(prev => ({
                    ...prev,
                    owner_name: profile.full_name,
                    owner_id: profile.id
                  }));
                }}
              />
              <p className="text-xs text-gray-500">
                Search and select the {uploadForm.owner_type} who owns this document
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-file">File</Label>
              <Input
                id="doc-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files[0] }))}
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500">
                Accepted formats: PDF, JPG, PNG. Max size: 10MB
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadDocument}
              disabled={!uploadForm.title || !uploadForm.owner_id || !selectedProfile || isUploading}
            >
              {isUploading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Document Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={(open) => {
        setIsVerifyDialogOpen(open);
        if (!open) {
          setVerifyError(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Verification</DialogTitle>
            <DialogDescription>
              {selectedDocument?.title}
            </DialogDescription>
          </DialogHeader>

          {verifyError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{verifyError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-status">Status</Label>
              <Select
                value={verifyForm.status}
                onValueChange={(value) => setVerifyForm(prev => ({ ...prev, status: value }))}
                disabled={isVerifying}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="missing_info">Missing Information</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-notes">Verification Notes</Label>
              <Textarea
                id="verify-notes"
                value={verifyForm.notes}
                onChange={(e) => setVerifyForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter verification notes or feedback..."
                rows={4}
                disabled={isVerifying}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVerifyDialogOpen(false)}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyDocument}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <DialogTitle>{previewDocument?.title || 'Document Preview'}</DialogTitle>
                  <DialogDescription className="text-xs">
                    Preview your uploaded document
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(previewDocument?.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open in New Tab
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-gray-100 p-4" style={{ minHeight: '60vh' }}>
            {previewDocument?.url && (
              <>
                {previewDocument.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={previewDocument.url}
                    alt={previewDocument.title}
                    className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                  />
                ) : previewDocument.url.match(/\.pdf$/i) ? (
                  <iframe
                    src={previewDocument.url}
                    className="w-full h-full min-h-[60vh] rounded-lg"
                    title={previewDocument.title}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <FileText className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <Button onClick={() => window.open(previewDocument.url, '_blank')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyDocumentsPage;
