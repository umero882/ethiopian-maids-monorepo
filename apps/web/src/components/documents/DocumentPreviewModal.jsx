/**
 * Enhanced Document Preview Modal
 * Features:
 * - Full-screen preview
 * - Zoom and pan for images
 * - PDF viewer support
 * - Document metadata display
 * - Download functionality
 * - Version history navigation
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Download,
  FileText,
  Image as ImageIcon,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  History,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  File,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize, VERIFICATION_STATUS } from '@/hooks/useDocumentUpload';

// Status configuration
const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Review' },
  verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Verified' },
  rejected: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Rejected' },
  expired: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Expired' },
  expiring_soon: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Expiring Soon' },
};

/**
 * Image viewer with zoom and pan
 */
const ImageViewer = ({ src, alt, zoom, rotation }) => {
  const containerRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, zoom, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    // Reset position when zoom resets
    if (zoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [zoom]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full h-full flex items-center justify-center overflow-hidden',
        zoom > 1 ? 'cursor-grab' : 'cursor-default',
        isDragging && 'cursor-grabbing'
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
        }}
        draggable={false}
      />
    </div>
  );
};

/**
 * PDF Viewer
 */
const PDFViewer = ({ src }) => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-gray-500">Loading PDF...</p>
          </div>
        </div>
      )}
      <iframe
        src={src}
        className="w-full h-full border-0"
        title="PDF Preview"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};

/**
 * Document info panel
 */
const DocumentInfoPanel = ({ document, onDownload }) => {
  if (!document) return null;

  // Determine display status
  let displayStatus = document.verification_status || 'pending';
  if (document.expired) displayStatus = 'expired';
  else if (document.expiringSoon && displayStatus === 'verified') displayStatus = 'expiring_soon';

  const StatusIcon = statusConfig[displayStatus]?.icon || Clock;

  return (
    <div className="space-y-4 p-4">
      {/* File info */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">File Information</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">File Name</span>
            <span className="font-medium text-gray-900 truncate max-w-[200px]">{document.file_name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Size</span>
            <span className="font-medium text-gray-900">{formatFileSize(document.file_size)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Type</span>
            <span className="font-medium text-gray-900">{document.mime_type}</span>
          </div>
          {document.version && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Version</span>
              <Badge variant="outline">v{document.version}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Verification Status</h4>
        <Badge className={cn('w-full justify-center py-2', statusConfig[displayStatus]?.color)}>
          <StatusIcon className="h-4 w-4 mr-2" />
          {statusConfig[displayStatus]?.label}
        </Badge>
        {document.rejection_reason && displayStatus === 'rejected' && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong>Reason:</strong> {document.rejection_reason}
          </p>
        )}
      </div>

      {/* Dates */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Dates</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Uploaded:</span>
            <span className="font-medium">
              {new Date(document.uploaded_at || document.created_at).toLocaleDateString()}
            </span>
          </div>
          {document.expiration_date && (
            <div className={cn(
              'flex items-center gap-2 text-sm',
              document.expired ? 'text-red-600' : document.expiringSoon ? 'text-orange-600' : ''
            )}>
              <Clock className="h-4 w-4" />
              <span>{document.expired ? 'Expired:' : 'Expires:'}</span>
              <span className="font-medium">
                {new Date(document.expiration_date).toLocaleDateString()}
              </span>
            </div>
          )}
          {document.verified_at && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Verified:</span>
              <span className="font-medium">
                {new Date(document.verified_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {document.notes && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{document.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2">
        <Button
          className="w-full"
          onClick={() => onDownload(document.file_path, document.file_name)}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Document
        </Button>
      </div>
    </div>
  );
};

/**
 * Version history panel
 */
const VersionHistoryPanel = ({ history, currentVersion, onSelectVersion }) => {
  return (
    <div className="p-4">
      <h4 className="text-sm font-medium text-gray-500 mb-3">Version History</h4>
      {history.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No version history available</p>
      ) : (
        <div className="space-y-2">
          {history.map((version) => (
            <button
              key={version.id}
              onClick={() => onSelectVersion(version)}
              className={cn(
                'w-full p-3 rounded-lg border text-left transition-colors',
                version.id === currentVersion?.id
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">v{version.version}</Badge>
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {version.file_name}
                  </span>
                </div>
                {version.id === currentVersion?.id && (
                  <Badge className="bg-purple-100 text-purple-800 text-xs">Current</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(version.uploaded_at || version.created_at).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main Document Preview Modal
 */
const DocumentPreviewModal = ({
  open,
  onClose,
  document,
  documentUrl,
  onDownload,
  versionHistory = [],
  onVersionSelect,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState('info');
  const [showControls, setShowControls] = useState(true);

  // Reset state when document changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setActiveTab('info');
  }, [document?.id]);

  if (!document) return null;

  const isImage = document.mime_type?.startsWith('image/');
  const isPDF = document.mime_type === 'application/pdf';
  const FileIcon = isImage ? ImageIcon : isPDF ? FileText : File;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleOpenExternal = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-lg">{document.file_name}</DialogTitle>
                <p className="text-sm text-gray-500">
                  {document.typeConfig?.label || 'Document'} • {formatFileSize(document.file_size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDownload(document.file_path, document.file_name)}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(95vh - 100px)' }}>
          {/* Preview area */}
          <div className="flex-1 bg-gray-900 relative">
            {/* Document preview */}
            <div className="w-full h-full">
              {isImage && documentUrl ? (
                <ImageViewer src={documentUrl} alt={document.file_name} zoom={zoom} rotation={rotation} />
              ) : isPDF && documentUrl ? (
                <PDFViewer src={documentUrl} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <File className="h-20 w-20 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Preview not available</p>
                    <p className="text-sm text-gray-400 mb-4">This file type cannot be previewed</p>
                    <Button onClick={() => onDownload(document.file_path, document.file_name)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Image controls */}
            {isImage && documentUrl && (
              <AnimatePresence>
                {showControls && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.5}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-white text-sm min-w-[60px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={zoom >= 3}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-white/30 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRotate}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l bg-white flex-shrink-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b px-2 pt-2 h-auto">
                <TabsTrigger value="info" className="text-xs">
                  <Shield className="h-3.5 w-3.5 mr-1" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">
                  <History className="h-3.5 w-3.5 mr-1" />
                  History
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="info" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <DocumentInfoPanel document={document} onDownload={onDownload} />
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="history" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <VersionHistoryPanel
                      history={versionHistory}
                      currentVersion={document}
                      onSelectVersion={onVersionSelect}
                    />
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
