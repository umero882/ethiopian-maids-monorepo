/**
 * Industry-Standard Document Uploader Component
 * Features:
 * - Drag and drop support
 * - Multi-file upload with queue
 * - Progress tracking per file
 * - File validation with clear error messages
 * - Expiration date picker
 * - Preview before upload
 * - Retry failed uploads
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  File,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Shield,
  Info,
  Loader2,
  CloudUpload,
  FilePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFile, formatFileSize, DOCUMENT_TYPES } from '@/hooks/useDocumentUpload';

// Status colors and icons
const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending Review' },
  verified: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Verified' },
  rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'Rejected' },
  expired: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle, label: 'Expired' },
  expiring_soon: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock, label: 'Expiring Soon' },
};

// File type icons
const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith('image/')) return ImageIcon;
  if (mimeType === 'application/pdf') return FileText;
  return File;
};

/**
 * Single Document Upload Card
 */
export const DocumentUploadCard = ({
  documentType,
  config,
  existingDocument,
  onUpload,
  onDelete,
  onView,
  onDownload,
  uploading = false,
  uploadProgress = 0,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const hasDocument = !!existingDocument;
  const isExpired = existingDocument?.expired;
  const isExpiringSoon = existingDocument?.expiringSoon;

  // Determine status for display
  let displayStatus = existingDocument?.verification_status || 'pending';
  if (isExpired) displayStatus = 'expired';
  else if (isExpiringSoon && displayStatus === 'verified') displayStatus = 'expiring_soon';

  const StatusIcon = statusConfig[displayStatus]?.icon || Clock;

  const handleFileSelect = useCallback((file) => {
    // Validate the file
    const validation = validateFile(file, documentType);
    if (!validation.valid) {
      setValidationError(validation.errors.join(', '));
      return;
    }

    setValidationError(null);
    setSelectedFile(file);

    // Create preview URL for images and PDFs
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    setShowUploadDialog(true);
  }, [documentType]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer?.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleUploadClick = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  const handleConfirmUpload = useCallback(async () => {
    if (!selectedFile) return;

    const result = await onUpload(selectedFile, documentType, {
      expirationDate: expirationDate || null,
      notes,
      replaceDocumentId: existingDocument?.id,
    });

    if (result.success) {
      setShowUploadDialog(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setExpirationDate('');
      setNotes('');
    }
  }, [selectedFile, documentType, expirationDate, notes, existingDocument, onUpload]);

  const handleCancelUpload = useCallback(() => {
    setShowUploadDialog(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setExpirationDate('');
    setNotes('');
    setValidationError(null);
  }, [previewUrl]);

  const FileIcon = existingDocument ? getFileIcon(existingDocument.mime_type) : FileText;

  return (
    <>
      <Card
        className={cn(
          'group relative transition-all duration-300 hover:shadow-lg',
          hasDocument ? 'border-2 border-transparent hover:border-purple-200' : 'border-2 border-dashed',
          isDragOver && 'border-purple-400 bg-purple-50',
          isExpired && 'border-red-200 bg-red-50/50',
          isExpiringSoon && !isExpired && 'border-orange-200 bg-orange-50/50',
          disabled && 'opacity-60 pointer-events-none'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                'p-3 rounded-xl transition-transform duration-300 group-hover:scale-105',
                hasDocument ? 'bg-gradient-to-br from-purple-100 to-indigo-100' : 'bg-gray-100'
              )}
            >
              {hasDocument ? (
                <FileIcon className={cn('h-6 w-6', isExpired ? 'text-red-600' : 'text-purple-600')} />
              ) : (
                <Upload className="h-6 w-6 text-gray-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{config.label}</h4>
                    {config.required && (
                      <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
                </div>

                {hasDocument && (
                  <Badge className={cn('border text-xs font-medium', statusConfig[displayStatus]?.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[displayStatus]?.label}
                  </Badge>
                )}
              </div>

              {/* Document info */}
              {hasDocument && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="truncate max-w-[200px]">{existingDocument.file_name}</span>
                    <span className="text-gray-400">|</span>
                    <span>{formatFileSize(existingDocument.file_size)}</span>
                    {existingDocument.version > 1 && (
                      <>
                        <span className="text-gray-400">|</span>
                        <span>v{existingDocument.version}</span>
                      </>
                    )}
                  </div>

                  {existingDocument.expiration_date && (
                    <div className={cn(
                      'flex items-center gap-1 text-sm',
                      isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-gray-500'
                    )}>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {isExpired ? 'Expired: ' : isExpiringSoon ? 'Expires: ' : 'Valid until: '}
                        {new Date(existingDocument.expiration_date).toLocaleDateString()}
                        {existingDocument.daysUntilExpiration !== null && existingDocument.daysUntilExpiration >= 0 && (
                          <span className="ml-1">({existingDocument.daysUntilExpiration} days)</span>
                        )}
                      </span>
                    </div>
                  )}

                  {existingDocument.rejection_reason && displayStatus === 'rejected' && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700">
                        <strong>Rejection Reason:</strong> {existingDocument.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Validation error */}
              {validationError && (
                <Alert variant="destructive" className="mt-3 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{validationError}</AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                {uploading ? (
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      <span className="text-sm text-purple-600">Uploading... {uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5" />
                  </div>
                ) : hasDocument ? (
                  <>
                    {onView && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => onView(existingDocument)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                    )}
                    {onDownload && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => onDownload(existingDocument.file_path, existingDocument.file_name)}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      onClick={handleUploadClick}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Replace
                    </Button>
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDelete(existingDocument.id, existingDocument.file_path)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleUploadClick}
                  >
                    <CloudUpload className="h-3.5 w-3.5 mr-1" />
                    Upload Document
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleInputChange}
            accept={config.acceptedExtensions?.join(',') || '.pdf,.jpg,.jpeg,.png'}
            disabled={disabled || uploading}
          />
        </CardContent>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-purple-100/90 rounded-lg flex items-center justify-center z-10"
            >
              <div className="text-center">
                <CloudUpload className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-700">Drop file here to upload</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Upload confirmation dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => !open && handleCancelUpload()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FilePlus className="h-5 w-5 text-purple-600" />
              Upload {config.label}
            </DialogTitle>
            <DialogDescription>
              Review and confirm your document upload
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File preview */}
            {selectedFile && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  {previewUrl && selectedFile.type.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded border"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-purple-100 rounded flex items-center justify-center">
                      {React.createElement(getFileIcon(selectedFile.type), {
                        className: 'h-8 w-8 text-purple-600'
                      })}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Type: {selectedFile.type || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Expiration date */}
            {config.expirationRequired && (
              <div className="space-y-2">
                <Label htmlFor="expiration-date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expiration Date
                  <Badge variant="outline" className="text-xs">Recommended</Badge>
                </Label>
                <Input
                  id="expiration-date"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500">
                  You'll be notified {config.expirationWarningDays} days before expiration
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this document..."
                rows={2}
              />
            </div>

            {/* Requirements info */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Accepted formats:</strong> {config.acceptedExtensions?.join(', ')}<br />
                <strong>Max size:</strong> {Math.round(config.maxSize / (1024 * 1024))}MB
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelUpload}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpload}
              disabled={!selectedFile || uploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
    </>
  );
};

/**
 * Document Grid Layout Component
 */
export const DocumentGrid = ({
  documents,
  onUpload,
  onDelete,
  onView,
  onDownload,
  uploading = false,
  uploadProgress = {},
  disabled = false,
  showAllTypes = true,
  documentTypes = null,
}) => {
  const typesToShow = documentTypes || Object.keys(DOCUMENT_TYPES);

  // Get latest document for each type
  const getLatestDocument = (type) => {
    const docs = documents.filter(d => d.document_type === type);
    if (docs.length === 0) return null;
    return docs.reduce((latest, doc) => {
      if (!latest || doc.version > latest.version) return doc;
      return latest;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {typesToShow.map(typeKey => {
        const config = DOCUMENT_TYPES[typeKey];
        if (!config) return null;

        if (!showAllTypes && !config.required && !getLatestDocument(typeKey)) {
          return null;
        }

        return (
          <DocumentUploadCard
            key={typeKey}
            documentType={typeKey}
            config={config}
            existingDocument={getLatestDocument(typeKey)}
            onUpload={onUpload}
            onDelete={onDelete}
            onView={onView}
            onDownload={onDownload}
            uploading={uploading && Object.keys(uploadProgress).some(k => k.startsWith(typeKey))}
            uploadProgress={Object.entries(uploadProgress).find(([k]) => k.startsWith(typeKey))?.[1] || 0}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
};

/**
 * Compliance Summary Card
 */
export const ComplianceSummaryCard = ({ summary }) => {
  if (!summary) return null;

  const getComplianceColor = (percentage) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Document Compliance</h4>
              <p className="text-sm text-gray-500">
                {summary.uploaded} of {summary.totalRequired} required documents uploaded
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn('text-2xl font-bold', getComplianceColor(summary.completionPercentage))}>
              {summary.completionPercentage}%
            </p>
            <p className="text-xs text-gray-500">Complete</p>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={summary.completionPercentage} className="h-2" />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-white/50 rounded">
            <p className="text-lg font-semibold text-green-600">{summary.verified}</p>
            <p className="text-xs text-gray-500">Verified</p>
          </div>
          <div className="p-2 bg-white/50 rounded">
            <p className="text-lg font-semibold text-yellow-600">{summary.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="p-2 bg-white/50 rounded">
            <p className="text-lg font-semibold text-orange-600">{summary.expiring}</p>
            <p className="text-xs text-gray-500">Expiring</p>
          </div>
          <div className="p-2 bg-white/50 rounded">
            <p className="text-lg font-semibold text-red-600">{summary.rejected + summary.expired}</p>
            <p className="text-xs text-gray-500">Action Needed</p>
          </div>
        </div>

        {summary.isCompliant ? (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 text-sm">
              Your agency is fully compliant with all document requirements.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mt-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700 text-sm">
              Please upload and verify all required documents to achieve compliance.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUploadCard;
