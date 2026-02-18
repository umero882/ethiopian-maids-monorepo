import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Upload,
  Check,
  AlertTriangle,
  FileQuestion,
  Eye,
  Download,
  UploadCloud,
  FilePlus,
  Calendar,
  Loader2,
  Trash2,
} from 'lucide-react';
import { format, differenceInDays, parseISO, addMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { maidDocumentsService } from '@/services/maidDocumentsService';

// Document type definitions - synced with mobile
const DOCUMENT_TYPES = {
  passport: { name: 'Passport/ID', type: 'identification', required: true },
  visa: { name: 'Visa', type: 'identification', required: false },
  medical_certificate: { name: 'Medical Certificate', type: 'health', required: false },
  cooking_certificate: { name: 'Cooking Certificate', type: 'skills', required: false },
  employment_contract: { name: 'Employment Contract', type: 'legal', required: false },
  experience_letter: { name: 'Previous Experience Letter', type: 'employment', required: false },
  language_certificate: { name: 'Language Proficiency Certificate', type: 'skills', required: false },
  skill_certificate: { name: 'Skill Certificate', type: 'skills', required: false },
  police_clearance: { name: 'Police Clearance', type: 'legal', required: false },
  reference_letter: { name: 'Reference Letter', type: 'employment', required: false },
  other: { name: 'Other Document', type: 'other', required: false },
};

// Required document types - only passport/ID is required
const requiredDocumentTypes = ['passport'];

const MaidDocumentsPage = () => {
  const { user, maidProfile } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    type: '',
    file: null,
    expiryDate: null,
  });
  const [viewDocument, setViewDocument] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [documentZoom, setDocumentZoom] = useState(100);
  const [maidProfileId, setMaidProfileId] = useState(null);

  // Fetch maid profile ID
  useEffect(() => {
    const fetchMaidProfileId = async () => {
      if (!user?.id) return;

      try {
        // Try to get from auth context first
        if (maidProfile?.id) {
          setMaidProfileId(maidProfile.id);
          return;
        }

        // Otherwise fetch from database using GraphQL service
        const { data, error } = await maidDocumentsService.getMaidProfileId(user.id);

        if (error) {
          console.error('Error fetching maid profile:', error);
          return;
        }

        setMaidProfileId(data?.id);
      } catch (error) {
        console.error('Error fetching maid profile:', error);
      }
    };

    fetchMaidProfileId();
  }, [user?.id, maidProfile?.id]);

  // Create placeholder documents for required types
  const createPlaceholderDocuments = useCallback(() => {
    return requiredDocumentTypes.map((docType) => ({
      id: `placeholder-${docType}`,
      name: DOCUMENT_TYPES[docType].name,
      type: DOCUMENT_TYPES[docType].type,
      documentType: docType,
      filename: null,
      fileUrl: null,
      uploadDate: null,
      expiryDate: null,
      status: 'not_uploaded',
      required: true,
      verified: false,
    }));
  }, []);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!maidProfileId) {
      // No profile yet - show placeholder documents
      setDocuments(createPlaceholderDocuments());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await maidDocumentsService.listDocuments(maidProfileId);

      if (error) {
        console.error('Error fetching documents:', error);
        // Still show placeholder documents on error
        setDocuments(createPlaceholderDocuments());
        setLoading(false);
        return;
      }

      // Transform documents to match expected format
      // Service returns: id, maid_id, type, title, file_url, file_name, verified, expiry_date, uploaded_at, created_at, updated_at
      const transformedDocs = (data || []).map((doc) => ({
        id: doc.id,
        name: DOCUMENT_TYPES[doc.type]?.name || doc.title || doc.type,
        type: DOCUMENT_TYPES[doc.type]?.type || 'other',
        documentType: doc.type,
        filename: doc.file_name || doc.title,
        fileUrl: doc.file_url,
        uploadDate: doc.uploaded_at || doc.created_at,
        expiryDate: doc.expiry_date,
        status: calculateStatus(doc),
        required: DOCUMENT_TYPES[doc.type]?.required || false,
        verified: doc.verified || false,
      }));

      // Add placeholder entries for required documents that don't exist
      const existingTypes = new Set(transformedDocs.map((d) => d.documentType));
      requiredDocumentTypes.forEach((docType) => {
        if (!existingTypes.has(docType)) {
          transformedDocs.push({
            id: `placeholder-${docType}`,
            name: DOCUMENT_TYPES[docType].name,
            type: DOCUMENT_TYPES[docType].type,
            documentType: docType,
            filename: null,
            fileUrl: null,
            uploadDate: null,
            expiryDate: null,
            status: 'not_uploaded',
            required: true,
            verified: false,
          });
        }
      });

      setDocuments(transformedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Show placeholder documents on error
      setDocuments(createPlaceholderDocuments());
      toast({
        title: 'Error',
        description: 'Failed to load documents. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [maidProfileId, createPlaceholderDocuments]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Calculate document status based on available schema fields
  const calculateStatus = (doc) => {
    if (!doc.file_url) return 'not_uploaded';
    if (doc.expiry_date) {
      const expiryDate = new Date(doc.expiry_date);
      if (expiryDate < new Date()) return 'expired';
    }
    if (doc.verified) return 'verified';
    return 'pending';
  };

  const handleDocumentUpload = (documentId) => {
    const document = documents.find((doc) => doc.id === documentId);
    if (document) {
      setSelectedDocument(document);
      setShowUploadDialog(true);
      setNewDocument({
        name: document.name,
        type: document.documentType,
        file: null,
        expiryDate: document.expiryDate ? parseISO(document.expiryDate) : null,
      });
    }
  };

  const handleAddDocument = () => {
    setSelectedDocument(null);
    setShowUploadDialog(true);
    setNewDocument({
      name: '',
      type: '',
      file: null,
      expiryDate: null,
    });
  };

  // Handle file upload
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Extract expiry date from filename if present
      const extractExpiryDate = (fileName) => {
        const datePatterns = [
          /expires?[_-]?(\d{4}[-\/]\d{2}[-\/]\d{2})/i,
          /valid[_-]?until[_-]?(\d{4}[-\/]\d{2}[-\/]\d{2})/i,
          /expiry[_-]?date[_-]?(\d{4}[-\/]\d{2}[-\/]\d{2})/i,
        ];

        for (const pattern of datePatterns) {
          const match = fileName.match(pattern);
          if (match && match[1]) {
            try {
              return new Date(match[1]);
            } catch (e) {
              return null;
            }
          }
        }
        return null;
      };

      const suggestedExpiry = extractExpiryDate(file.name);

      setNewDocument({
        ...newDocument,
        file: file,
        expiryDate: suggestedExpiry || newDocument.expiryDate,
      });

      if (suggestedExpiry) {
        toast({
          title: 'Expiry Date Detected',
          description: `Expiry date set to ${format(suggestedExpiry, 'MMMM d, yyyy')}`,
        });
      }
    }
  };

  const handleExpiryDateChange = (date) => {
    setNewDocument({
      ...newDocument,
      expiryDate: date,
    });
  };

  const handleSubmitDocument = async (e) => {
    e.preventDefault();

    if (!newDocument.type) {
      toast({
        title: 'Missing Information',
        description: 'Please select a document type.',
        variant: 'destructive',
      });
      return;
    }

    if (!newDocument.file) {
      toast({
        title: 'Missing File',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    if (!maidProfileId) {
      toast({
        title: 'Error',
        description: 'Maid profile not found. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Check if document of this type already exists (update vs insert)
      const existingDoc = documents.find(
        (d) => d.documentType === newDocument.type && !d.id.startsWith('placeholder')
      );

      if (existingDoc) {
        // Delete old document first
        await maidDocumentsService.deleteDocument(maidProfileId, existingDoc);
      }

      // Upload new document
      const { data, error } = await maidDocumentsService.uploadDocument(maidProfileId, {
        file: newDocument.file,
        type: newDocument.type,
        title: DOCUMENT_TYPES[newDocument.type]?.name || newDocument.name,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        throw error;
      }

      // Update expiry date if provided
      if (newDocument.expiryDate && data?.id) {
        await maidDocumentsService.updateDocument(data.id, {
          expiry_date: newDocument.expiryDate.toISOString(),
        });
      }

      toast({
        title: 'Document Uploaded',
        description: `${DOCUMENT_TYPES[newDocument.type]?.name || 'Document'} has been uploaded successfully.`,
      });

      // Refresh documents
      await fetchDocuments();

      // Reset form
      setNewDocument({ name: '', type: '', file: null, expiryDate: null });
      setShowUploadDialog(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!maidProfileId || doc.id.startsWith('placeholder')) return;

    try {
      const { success, error } = await maidDocumentsService.deleteDocument(maidProfileId, doc);

      if (!success) {
        throw error;
      }

      toast({
        title: 'Document Deleted',
        description: `${doc.name} has been deleted.`,
      });

      await fetchDocuments();
      setViewDocument(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadDocument = (doc) => {
    if (!doc?.fileUrl) {
      toast({
        title: 'Error',
        description: 'Document cannot be downloaded',
        variant: 'destructive',
      });
      return;
    }

    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.target = '_blank';
    link.download = doc.filename || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Download Started',
      description: `${doc.name} is being downloaded`,
    });
  };

  const handleViewDocument = (documentId) => {
    const document = documents.find((doc) => doc.id === documentId);
    if (document && document.fileUrl) {
      setViewDocument(document);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge className='bg-green-500'>Verified</Badge>;
      case 'pending':
        return (
          <Badge variant='outline' className='border-yellow-400 text-yellow-700'>
            Pending Verification
          </Badge>
        );
      case 'rejected':
        return <Badge variant='destructive'>Rejected</Badge>;
      case 'expired':
        return <Badge variant='destructive'>Expired</Badge>;
      case 'not_uploaded':
        return (
          <Badge variant='outline' className='border-gray-400 text-gray-700'>
            Not Uploaded
          </Badge>
        );
      default:
        return <Badge variant='outline'>Unknown</Badge>;
    }
  };

  const getDocumentExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;

    const expiry = parseISO(expiryDate);
    const today = new Date();
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return { status: 'expired', message: `Expired ${Math.abs(daysUntilExpiry)} days ago` };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring_soon', message: `Expires in ${daysUntilExpiry} days` };
    } else {
      return { status: 'valid', message: `Valid for ${Math.floor(daysUntilExpiry / 30)} months` };
    }
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'identification':
        return <FileText className='h-6 w-6 text-blue-500' />;
      case 'health':
        return <FileText className='h-6 w-6 text-green-500' />;
      case 'skills':
        return <FileText className='h-6 w-6 text-purple-500' />;
      case 'legal':
        return <FileText className='h-6 w-6 text-red-500' />;
      case 'employment':
        return <FileText className='h-6 w-6 text-yellow-500' />;
      default:
        return <FileQuestion className='h-6 w-6 text-gray-500' />;
    }
  };

  const filteredDocuments =
    activeTab === 'all'
      ? documents
      : activeTab === 'required'
        ? documents.filter((doc) => doc.required)
        : activeTab === 'expiring'
          ? documents.filter(
              (doc) =>
                doc.expiryDate && getDocumentExpiryStatus(doc.expiryDate)?.status === 'expiring_soon'
            )
          : documents.filter((doc) => doc.type === activeTab);

  const completionPercentage = () => {
    const requiredDocs = documents.filter((doc) => doc.required);
    const uploadedRequiredDocs = requiredDocs.filter((doc) => doc.status !== 'not_uploaded');
    // If no required docs found in state yet, return 0 (not 100)
    if (requiredDocs.length === 0) return 0;
    return Math.round((uploadedRequiredDocs.length / requiredDocs.length) * 100);
  };

  const sectionAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full py-20'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-500' />
        <span className='ml-2 text-gray-600'>Loading documents...</span>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <div className='flex justify-between items-center flex-wrap gap-4'>
        <h1 className='text-3xl font-bold text-gray-800'>My Documents</h1>
        <Button onClick={handleAddDocument} className='gap-2'>
          <FilePlus className='h-4 w-4' />
          Add Document
        </Button>
      </div>

      <motion.div {...sectionAnimation}>
        <Card className='shadow-lg border-0'>
          <CardHeader>
            <CardTitle>Document Completion</CardTitle>
            <CardDescription>Upload all required documents to complete your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div className='space-y-2 flex-1'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>Required Documents</span>
                    <span className='text-sm font-medium'>{completionPercentage()}% Complete</span>
                  </div>
                  <Progress value={completionPercentage()} className='h-2' />
                </div>

                <div className='flex gap-2'>
                  {completionPercentage() < 100 ? (
                    <div className='flex items-center gap-2 text-sm text-amber-600'>
                      <AlertTriangle className='h-4 w-4' />
                      <span>Required documents missing</span>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2 text-sm text-green-600'>
                      <Check className='h-4 w-4' />
                      <span>All required documents uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
                {requiredDocumentTypes.map((docType, index) => {
                  const doc = documents.find((d) => d.documentType === docType);
                  const hasDoc = doc && doc.status !== 'not_uploaded';

                  return (
                    <Card
                      key={index}
                      className={`border ${hasDoc ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                    >
                      <CardContent className='p-4 flex justify-between items-center'>
                        <div className='flex items-center gap-3'>
                          {hasDoc ? (
                            <Check className='h-5 w-5 text-green-600' />
                          ) : (
                            <AlertTriangle className='h-5 w-5 text-red-600' />
                          )}
                          <span className='font-medium'>{DOCUMENT_TYPES[docType]?.name}</span>
                        </div>

                        <Button
                          variant={hasDoc ? 'outline' : 'default'}
                          size='sm'
                          onClick={() => {
                            if (doc) {
                              handleDocumentUpload(doc.id);
                            } else {
                              // Open upload dialog for this document type
                              setSelectedDocument(null);
                              setShowUploadDialog(true);
                              setNewDocument({
                                name: DOCUMENT_TYPES[docType]?.name || '',
                                type: docType,
                                file: null,
                                expiryDate: null,
                              });
                            }
                          }}
                        >
                          {hasDoc ? 'Update' : 'Upload'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...sectionAnimation} transition={{ delay: 0.2 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid grid-cols-5 mb-6'>
            <TabsTrigger value='all'>All Documents</TabsTrigger>
            <TabsTrigger value='required'>Required</TabsTrigger>
            <TabsTrigger value='identification'>Identification</TabsTrigger>
            <TabsTrigger value='expiring'>Expiring Soon</TabsTrigger>
            <TabsTrigger value='health'>Health</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card className='shadow-lg border-0'>
              <CardContent className='p-6'>
                {filteredDocuments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((doc) => {
                        const expiryStatus = doc.expiryDate ? getDocumentExpiryStatus(doc.expiryDate) : null;

                        return (
                          <TableRow key={doc.id} className='group hover:bg-gray-50'>
                            <TableCell>
                              <div className='flex items-center gap-3'>
                                {getDocumentIcon(doc.type)}
                                <div>
                                  <p className='font-medium'>{doc.name}</p>
                                  <p className='text-xs text-gray-500'>
                                    {doc.filename || 'No file uploaded'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell>
                              {doc.uploadDate ? format(parseISO(doc.uploadDate), 'MMM d, yyyy') : '-'}
                            </TableCell>
                            <TableCell>
                              {doc.expiryDate ? (
                                <div
                                  className={`text-sm ${
                                    expiryStatus?.status === 'expired'
                                      ? 'text-red-600'
                                      : expiryStatus?.status === 'expiring_soon'
                                        ? 'text-amber-600'
                                        : 'text-green-600'
                                  }`}
                                >
                                  <div className='flex items-center gap-1'>
                                    {expiryStatus?.status !== 'valid' && (
                                      <AlertTriangle className='h-3.5 w-3.5' />
                                    )}
                                    {expiryStatus?.status === 'valid' && <Check className='h-3.5 w-3.5' />}
                                    <span>{format(parseISO(doc.expiryDate), 'MMM d, yyyy')}</span>
                                  </div>
                                  <p className='text-xs'>{expiryStatus?.message}</p>
                                </div>
                              ) : (
                                <span className='text-gray-500'>No expiry</span>
                              )}
                            </TableCell>
                            <TableCell className='text-right'>
                              <div className='flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                {doc.fileUrl && (
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    aria-label='View document'
                                    onClick={() => handleViewDocument(doc.id)}
                                    title='View Document'
                                  >
                                    <Eye className='h-4 w-4 text-blue-600' />
                                  </Button>
                                )}
                                <Button
                                  variant='ghost'
                                  aria-label='Upload document'
                                  size='icon'
                                  onClick={() => handleDocumentUpload(doc.id)}
                                  title='Upload or Update'
                                >
                                  <Upload className='h-4 w-4 text-green-600' />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className='text-center py-10'>
                    <FileQuestion className='h-16 w-16 text-gray-300 mx-auto mb-3' />
                    <h3 className='text-lg font-medium text-gray-700'>No documents found</h3>
                    <p className='text-gray-500 mt-1'>
                      {activeTab === 'all'
                        ? "You haven't uploaded any documents yet."
                        : activeTab === 'required'
                          ? 'You have uploaded all required documents.'
                          : activeTab === 'expiring'
                            ? "You don't have any documents expiring soon."
                            : `You don't have any ${activeTab} documents.`}
                    </p>
                    <Button onClick={handleAddDocument} className='mt-4'>
                      Upload Document
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>
              {selectedDocument ? `Update ${selectedDocument.name}` : 'Upload New Document'}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument
                ? `Upload a new version of your ${selectedDocument.name} document.`
                : 'Add a new document to your profile.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitDocument}>
            <div className='grid gap-4 py-4'>
              {!selectedDocument && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Document Type</label>
                  <select
                    className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                    value={newDocument.type}
                    onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                    disabled={isUploading}
                  >
                    <option value=''>Select a document type...</option>
                    {Object.entries(DOCUMENT_TYPES).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Document File</label>

                {isUploading ? (
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className='h-2' />
                  </div>
                ) : (
                  <div className='flex items-center justify-center w-full'>
                    <label className='flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100'>
                      <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                        <UploadCloud className='w-8 h-8 mb-2 text-gray-500' />
                        <p className='mb-2 text-sm text-gray-500'>
                          <span className='font-semibold'>Click to upload</span> or drag and drop
                        </p>
                        <p className='text-xs text-gray-500'>PDF, JPG, or PNG (max. 10MB)</p>
                      </div>
                      <input
                        type='file'
                        className='hidden'
                        onChange={handleFileChange}
                        accept='.pdf,.jpg,.jpeg,.png'
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                )}

                {newDocument.file && (
                  <p className='text-sm text-gray-500 mt-2'>Selected file: {newDocument.file.name}</p>
                )}
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Expiry Date (Optional)</label>
                <div className='flex items-center gap-2'>
                  <input
                    type='date'
                    className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                    value={newDocument.expiryDate ? format(newDocument.expiryDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) =>
                      handleExpiryDateChange(e.target.value ? new Date(e.target.value) : null)
                    }
                    disabled={isUploading}
                  />
                  <Button
                    type='button'
                    aria-label='Set expiry date'
                    variant='outline'
                    size='icon'
                    onClick={() => handleExpiryDateChange(addMonths(new Date(), 12))}
                    disabled={isUploading}
                    title='Set to 1 year from now'
                  >
                    <Calendar className='h-4 w-4' />
                  </Button>
                </div>
                <p className='text-xs text-gray-500'>Leave blank if the document doesn't expire</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowUploadDialog(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isUploading || !newDocument.type || !newDocument.file}
              >
                {isUploading ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Uploading...
                  </>
                ) : (
                  'Upload Document'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      {viewDocument && (
        <Dialog
          open={!!viewDocument}
          onOpenChange={(open) => {
            if (!open) {
              setViewDocument(null);
              setDocumentZoom(100);
            }
          }}
        >
          <DialogContent className='sm:max-w-[700px] max-h-[90vh]'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                {getDocumentIcon(viewDocument.type)}
                <span>{viewDocument.name}</span>
              </DialogTitle>
              <DialogDescription>
                {viewDocument.uploadDate
                  ? `Uploaded on ${format(parseISO(viewDocument.uploadDate), 'MMMM d, yyyy')}`
                  : 'No upload date'}
              </DialogDescription>
            </DialogHeader>

            <div className='py-4'>
              {/* Document Preview Controls */}
              <div className='bg-gray-100 rounded-t-lg p-2 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setDocumentZoom(Math.max(documentZoom - 10, 50))}
                    disabled={documentZoom <= 50}
                  >
                    -
                  </Button>
                  <span className='text-sm'>{documentZoom}%</span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setDocumentZoom(Math.min(documentZoom + 10, 200))}
                    disabled={documentZoom >= 200}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Document Preview Area */}
              <div
                className='bg-gray-100 rounded-b-lg p-4 flex flex-col items-center justify-center h-80 overflow-auto'
                style={{ zoom: `${documentZoom}%` }}
              >
                {viewDocument.fileUrl ? (
                  viewDocument.filename?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={viewDocument.fileUrl}
                      alt={viewDocument.name}
                      className='max-w-full max-h-full object-contain'
                    />
                  ) : viewDocument.filename?.endsWith('.pdf') ? (
                    <div className='w-full h-full flex flex-col'>
                      <iframe
                        src={viewDocument.fileUrl}
                        title={viewDocument.name}
                        className='w-full h-full border-0'
                      />
                    </div>
                  ) : (
                    <div className='flex flex-col items-center justify-center'>
                      <FileText className='w-16 h-16 text-gray-400 mb-4' />
                      <p className='text-gray-600 mb-2'>{viewDocument.filename}</p>
                    </div>
                  )
                ) : (
                  <div className='flex flex-col items-center justify-center'>
                    <FileText className='w-16 h-16 text-gray-400 mb-4' />
                    <p className='text-gray-600'>No file available</p>
                  </div>
                )}
              </div>

              {/* Document Metadata */}
              <div className='mt-4 space-y-2'>
                <div className='flex justify-between py-2 border-b'>
                  <span className='text-sm font-medium text-gray-500'>Status</span>
                  <span>{getStatusBadge(viewDocument.status)}</span>
                </div>

                {viewDocument.expiryDate && (
                  <div className='flex justify-between py-2 border-b'>
                    <span className='text-sm font-medium text-gray-500'>Expiry Date</span>
                    <span className='text-sm text-gray-900'>
                      {format(parseISO(viewDocument.expiryDate), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}

              </div>
            </div>

            <DialogFooter className='flex gap-2'>
              <Button
                variant='outline'
                className='gap-2'
                onClick={() => handleDownloadDocument(viewDocument)}
                disabled={!viewDocument.fileUrl}
              >
                <Download className='h-4 w-4' />
                Download
              </Button>
              <Button
                variant='outline'
                className='gap-2 text-red-600 hover:text-red-700'
                onClick={() => handleDeleteDocument(viewDocument)}
              >
                <Trash2 className='h-4 w-4' />
                Delete
              </Button>
              <DialogClose asChild>
                <Button variant='outline'>Close</Button>
              </DialogClose>
              <Button
                onClick={() => {
                  setViewDocument(null);
                  handleDocumentUpload(viewDocument.id);
                }}
              >
                Update Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MaidDocumentsPage;
