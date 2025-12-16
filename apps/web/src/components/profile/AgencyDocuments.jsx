/**
 * Agency Documents Component
 * Industry-standard document management system
 *
 * Features:
 * - Drag and drop upload
 * - Progress tracking
 * - Document versioning
 * - Expiration tracking with notifications
 * - Full preview with zoom/pan
 * - Compliance summary dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload,
  FileText,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Award,
  FileCheck,
  RefreshCw,
  Download,
  Eye,
  History,
  TrendingUp,
  Building2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentUpload, DOCUMENT_TYPES, VERIFICATION_STATUS, formatFileSize, checkExpiration } from '@/hooks/useDocumentUpload';
import { DocumentUploadCard, DocumentGrid, ComplianceSummaryCard } from '@/components/documents/DocumentUploader';
import DocumentPreviewModal from '@/components/documents/DocumentPreviewModal';
import { cn } from '@/lib/utils';

// Status badge configurations
const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: 'Pending' },
  verified: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Verified' },
  rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, label: 'Rejected' },
  expired: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle, label: 'Expired' },
  expiring_soon: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle, label: 'Expiring Soon' },
};

/**
 * Get status badge component
 */
const getStatusBadge = (status, expired = false, expiringSoon = false) => {
  let displayStatus = status || 'pending';
  if (expired) displayStatus = 'expired';
  else if (expiringSoon && displayStatus === 'verified') displayStatus = 'expiring_soon';

  const config = statusConfig[displayStatus] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <Badge className={cn('border text-xs', config.color)}>
      <StatusIcon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

/**
 * Loading skeleton for document cards
 */
const DocumentSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-8 w-32 mt-3" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Statistics card component
 */
const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
  <Card className={cn('bg-gradient-to-br', color)}>
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/50 rounded-lg">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs opacity-80">{label}</p>
          {subtext && <p className="text-xs opacity-60 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Recent activity item
 */
const ActivityItem = ({ document, onClick }) => {
  const StatusIcon = statusConfig[document.verification_status]?.icon || Clock;
  const statusColor = statusConfig[document.verification_status]?.color || statusConfig.pending.color;

  return (
    <button
      onClick={() => onClick(document)}
      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{document.file_name}</p>
          <p className="text-xs text-gray-500">
            {DOCUMENT_TYPES[document.document_type]?.label || document.document_type}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {getStatusBadge(document.verification_status, document.expired, document.expiringSoon)}
        <span className="text-xs text-gray-400">
          {new Date(document.uploaded_at || document.created_at).toLocaleDateString()}
        </span>
      </div>
    </button>
  );
};

/**
 * Main AgencyDocuments Component
 */
const AgencyDocuments = ({ profileData, onProfileUpdate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);

  // Use the document upload hook
  const {
    documents,
    loading,
    uploading,
    uploadProgress,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getDocumentUrl,
    getDocumentsByType,
    getLatestDocuments,
    getDocumentHistory,
    getComplianceSummary,
  } = useDocumentUpload(user?.id);

  // Fetch documents on mount
  useEffect(() => {
    if (user?.id) {
      fetchDocuments();
    }
  }, [user?.id, fetchDocuments]);

  // Get compliance summary
  const complianceSummary = getComplianceSummary();
  const latestDocuments = getLatestDocuments();

  // Documents requiring attention
  const attentionDocuments = latestDocuments.filter(doc =>
    doc.verification_status === VERIFICATION_STATUS.REJECTED ||
    doc.expired ||
    doc.expiringSoon
  );

  // Handle document view
  const handleViewDocument = useCallback(async (document) => {
    setPreviewDocument(document);

    // Fetch the document URL
    const url = await getDocumentUrl(document.file_path);
    setPreviewUrl(url);

    // Fetch version history
    const history = await getDocumentHistory(document.document_type);
    setVersionHistory(history);
  }, [getDocumentUrl, getDocumentHistory]);

  // Handle version select from preview
  const handleVersionSelect = useCallback(async (version) => {
    const url = await getDocumentUrl(version.file_path);
    setPreviewDocument(prev => ({
      ...prev,
      ...version,
    }));
    setPreviewUrl(url);
  }, [getDocumentUrl]);

  // Handle upload
  const handleUpload = useCallback(async (file, documentType, options) => {
    const result = await uploadDocument(file, documentType, options);
    if (result.success && onProfileUpdate) {
      onProfileUpdate({ documents: await fetchDocuments() });
    }
    return result;
  }, [uploadDocument, fetchDocuments, onProfileUpdate]);

  // Handle delete
  const handleDelete = useCallback(async (documentId, filePath) => {
    const result = await deleteDocument(documentId, filePath);
    if (result.success && onProfileUpdate) {
      onProfileUpdate({ documents: await fetchDocuments() });
    }
    return result;
  }, [deleteDocument, fetchDocuments, onProfileUpdate]);

  // Filter documents by category
  const requiredTypes = Object.values(DOCUMENT_TYPES).filter(t => t.required).map(t => t.key);
  const optionalTypes = Object.values(DOCUMENT_TYPES).filter(t => !t.required).map(t => t.key);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Document Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload and manage your agency's official documents
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchDocuments()}
          disabled={loading}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Compliance Summary */}
      <ComplianceSummaryCard summary={complianceSummary} />

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Documents"
          value={latestDocuments.length}
          color="from-blue-50 to-indigo-50 border-blue-100 text-blue-900"
        />
        <StatCard
          icon={CheckCircle}
          label="Verified"
          value={complianceSummary.verified}
          color="from-green-50 to-emerald-50 border-green-100 text-green-900"
        />
        <StatCard
          icon={Clock}
          label="Pending Review"
          value={complianceSummary.pending}
          color="from-yellow-50 to-amber-50 border-yellow-100 text-yellow-900"
        />
        <StatCard
          icon={AlertTriangle}
          label="Needs Attention"
          value={attentionDocuments.length}
          color="from-red-50 to-orange-50 border-red-100 text-red-900"
          subtext={attentionDocuments.length > 0 ? 'Action required' : ''}
        />
      </div>

      {/* Alerts Section */}
      {attentionDocuments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              Documents Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {attentionDocuments.slice(0, 3).map(doc => (
                <ActivityItem key={doc.id} document={doc} onClick={handleViewDocument} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1 hidden sm:inline" />
            All Documents
          </TabsTrigger>
          <TabsTrigger value="required" className="text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-1 hidden sm:inline" />
            Required
          </TabsTrigger>
          <TabsTrigger value="optional" className="text-xs sm:text-sm">
            <Award className="h-4 w-4 mr-1 hidden sm:inline" />
            Optional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <DocumentSkeleton key={i} />)}
            </div>
          ) : (
            <DocumentGrid
              documents={documents}
              onUpload={handleUpload}
              onDelete={handleDelete}
              onView={handleViewDocument}
              onDownload={downloadDocument}
              uploading={uploading}
              uploadProgress={uploadProgress}
              showAllTypes={true}
            />
          )}
        </TabsContent>

        <TabsContent value="required" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => <DocumentSkeleton key={i} />)}
            </div>
          ) : (
            <DocumentGrid
              documents={documents}
              onUpload={handleUpload}
              onDelete={handleDelete}
              onView={handleViewDocument}
              onDownload={downloadDocument}
              uploading={uploading}
              uploadProgress={uploadProgress}
              documentTypes={requiredTypes}
              showAllTypes={true}
            />
          )}
        </TabsContent>

        <TabsContent value="optional" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => <DocumentSkeleton key={i} />)}
            </div>
          ) : (
            <DocumentGrid
              documents={documents}
              onUpload={handleUpload}
              onDelete={handleDelete}
              onView={handleViewDocument}
              onDownload={downloadDocument}
              uploading={uploading}
              uploadProgress={uploadProgress}
              documentTypes={optionalTypes}
              showAllTypes={true}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-purple-600" />
              Recent Document Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.slice(0, 5).map(doc => (
                <ActivityItem key={doc.id} document={doc} onClick={handleViewDocument} />
              ))}
            </div>
            {documents.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No documents uploaded yet
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification Guidelines */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-purple-900">
            <FileCheck className="h-4 w-4" />
            Document Verification Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-purple-800 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Accepted Formats</h4>
              <ul className="list-disc list-inside text-xs space-y-1 text-purple-700">
                <li>PDF documents (preferred)</li>
                <li>High-quality images (JPG, PNG, WebP)</li>
                <li>Maximum file size: 10MB</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Verification Process</h4>
              <ul className="list-disc list-inside text-xs space-y-1 text-purple-700">
                <li>Documents are reviewed within 24-48 hours</li>
                <li>Ensure all text is legible and clear</li>
                <li>Documents must be current and not expired</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={!!previewDocument}
        onClose={() => {
          setPreviewDocument(null);
          setPreviewUrl(null);
          setVersionHistory([]);
        }}
        document={previewDocument}
        documentUrl={previewUrl}
        onDownload={downloadDocument}
        versionHistory={versionHistory}
        onVersionSelect={handleVersionSelect}
      />
    </div>
  );
};

export default AgencyDocuments;
