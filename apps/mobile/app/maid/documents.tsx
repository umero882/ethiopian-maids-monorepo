/**
 * Maid Documents Screen
 *
 * Fully synced with web MaidDocumentsPage.jsx
 * Features:
 * - Document completion progress tracking
 * - Required documents section
 * - Tabbed filtering (All, Required, Identification, Expiring, Health)
 * - Document upload with Expo Document Picker
 * - Document preview modal
 * - Verification status display
 * - Expiry date tracking
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  useDocuments,
  MaidDocument,
  DocumentType,
  DocumentStatus,
  DOCUMENT_TYPE_LABELS,
  REQUIRED_DOCUMENT_TYPES,
  getDocumentExpiryStatus,
  formatDocumentDate,
} from '../../hooks/useDocuments';

// Tab configuration - synced with web
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'required', label: 'Required' },
  { key: 'identification', label: 'ID' },
  { key: 'expiring', label: 'Expiring' },
  { key: 'health', label: 'Health' },
];

export default function MaidDocumentsScreen() {
  const {
    documents,
    isLoading,
    error,
    uploadProgress,
    isUploading,
    refetch,
    uploadDocument,
    deleteDocument,
    getDocumentsByCategory,
    completionPercentage,
  } = useDocuments();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<MaidDocument | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle document selection for upload
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];

      if (!selectedDocType) {
        Alert.alert('Error', 'Please select a document type first');
        return;
      }

      const uploadResult = await uploadDocument({
        file: {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/pdf',
          size: asset.size,
        },
        documentType: selectedDocType,
        title: asset.name,
      });

      if (uploadResult.success) {
        Alert.alert('Success', 'Document uploaded successfully');
        setShowUploadModal(false);
        setSelectedDocType(null);
      } else {
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload document');
      }
    } catch (err: any) {
      console.error('Document picker error:', err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  // Handle image selection for upload
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];

      if (!selectedDocType) {
        Alert.alert('Error', 'Please select a document type first');
        return;
      }

      const fileName = asset.uri.split('/').pop() || `image_${Date.now()}.jpg`;

      const uploadResult = await uploadDocument({
        file: {
          uri: asset.uri,
          name: fileName,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        },
        documentType: selectedDocType,
        title: fileName,
      });

      if (uploadResult.success) {
        Alert.alert('Success', 'Document uploaded successfully');
        setShowUploadModal(false);
        setSelectedDocType(null);
      } else {
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload document');
      }
    } catch (err: any) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Handle camera capture
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera access');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];

      if (!selectedDocType) {
        Alert.alert('Error', 'Please select a document type first');
        return;
      }

      const fileName = `photo_${Date.now()}.jpg`;

      const uploadResult = await uploadDocument({
        file: {
          uri: asset.uri,
          name: fileName,
          type: 'image/jpeg',
          size: asset.fileSize,
        },
        documentType: selectedDocType,
        title: fileName,
      });

      if (uploadResult.success) {
        Alert.alert('Success', 'Document uploaded successfully');
        setShowUploadModal(false);
        setSelectedDocType(null);
      } else {
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload document');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (doc: MaidDocument) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete ${doc.document_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteDocument(doc.id);
            if (result.success) {
              Alert.alert('Deleted', 'Document deleted successfully');
              setShowPreviewModal(false);
              setSelectedDocument(null);
            } else {
              Alert.alert('Error', result.error || 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  // Open document upload modal for a specific type
  const openUploadModal = (docType?: DocumentType) => {
    setSelectedDocType(docType || null);
    setShowUploadModal(true);
  };

  // Open document preview
  const openPreview = (doc: MaidDocument) => {
    setSelectedDocument(doc);
    setShowPreviewModal(true);
  };

  // Open document in external viewer
  const openDocumentExternal = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this document');
      }
    } catch (err) {
      console.error('Error opening URL:', err);
      Alert.alert('Error', 'Failed to open document');
    }
  };

  // Get status badge color and text
  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return { bg: '#DEF7EC', text: '#03543F', label: 'Verified' };
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E', label: 'Pending' };
      case 'rejected':
        return { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' };
      case 'expired':
        return { bg: '#FEE2E2', text: '#991B1B', label: 'Expired' };
      case 'not_uploaded':
        return { bg: '#F3F4F6', text: '#6B7280', label: 'Not Uploaded' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', label: 'Unknown' };
    }
  };

  // Get document icon color based on type
  const getDocumentIconColor = (docType: DocumentType) => {
    if (['passport', 'visa'].includes(docType)) return '#3B82F6'; // Blue - identification
    if (['medical_certificate'].includes(docType)) return '#10B981'; // Green - health
    if (['cooking_certificate', 'language_certificate', 'skill_certificate'].includes(docType)) return '#8B5CF6'; // Purple - skills
    if (['police_clearance'].includes(docType)) return '#EF4444'; // Red - legal
    if (['employment_contract', 'experience_letter', 'reference_letter'].includes(docType)) return '#F59E0B'; // Yellow - employment
    return '#6B7280'; // Gray - other
  };

  const filteredDocuments = getDocumentsByCategory(activeTab);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Documents',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1F2937',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => openUploadModal()}
              style={styles.headerButton}
            >
              <Ionicons name="add" size={24} color="#8B5CF6" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
      >
        {/* Completion Progress Card - synced with web */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Document Completion</Text>
            <Text style={styles.cardSubtitle}>Upload all required documents to complete your profile.</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Required Documents</Text>
              <Text style={styles.progressValue}>{completionPercentage}% Complete</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
            </View>

            <View style={styles.statusMessage}>
              {completionPercentage < 100 ? (
                <>
                  <Ionicons name="warning" size={16} color="#F59E0B" />
                  <Text style={styles.warningText}>Required documents missing</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.successText}>All required documents uploaded</Text>
                </>
              )}
            </View>

            {/* Required Documents Quick View */}
            <View style={styles.requiredDocsGrid}>
              {REQUIRED_DOCUMENT_TYPES.map((docType) => {
                const doc = documents.find((d) => d.document_type === docType);
                const hasDoc = doc && doc.status !== 'not_uploaded';

                return (
                  <View
                    key={docType}
                    style={[
                      styles.requiredDocItem,
                      { backgroundColor: hasDoc ? '#DEF7EC' : '#FEE2E2' },
                    ]}
                  >
                    <View style={styles.requiredDocContent}>
                      <Ionicons
                        name={hasDoc ? 'checkmark-circle' : 'alert-circle'}
                        size={18}
                        color={hasDoc ? '#10B981' : '#EF4444'}
                      />
                      <Text style={styles.requiredDocLabel} numberOfLines={1}>
                        {DOCUMENT_TYPE_LABELS[docType]}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.requiredDocButton,
                        { backgroundColor: hasDoc ? '#fff' : '#8B5CF6' },
                      ]}
                      onPress={() => openUploadModal(docType)}
                    >
                      <Text
                        style={[
                          styles.requiredDocButtonText,
                          { color: hasDoc ? '#374151' : '#fff' },
                        ]}
                      >
                        {hasDoc ? 'Update' : 'Upload'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Tabs - synced with web */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Documents List */}
        <View style={styles.documentsCard}>
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => {
              const statusBadge = getStatusBadge(doc.status);
              const expiryStatus = getDocumentExpiryStatus(doc.expiry_date);
              const iconColor = getDocumentIconColor(doc.document_type);

              return (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.documentItem}
                  onPress={() => doc.status !== 'not_uploaded' && openPreview(doc)}
                >
                  <View style={styles.documentLeft}>
                    <View style={[styles.documentIcon, { backgroundColor: `${iconColor}20` }]}>
                      <Ionicons name="document-text" size={20} color={iconColor} />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName} numberOfLines={1}>
                        {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_name}
                      </Text>
                      <Text style={styles.documentMeta}>
                        {doc.status !== 'not_uploaded'
                          ? `Uploaded ${formatDocumentDate(doc.created_at)}`
                          : 'No file uploaded'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.documentRight}>
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusBadge.text }]}>
                        {statusBadge.label}
                      </Text>
                    </View>

                    {/* Expiry Warning */}
                    {expiryStatus && expiryStatus.status !== 'valid' && (
                      <View style={styles.expiryWarning}>
                        <Ionicons
                          name="alert-circle"
                          size={14}
                          color={expiryStatus.status === 'expired' ? '#EF4444' : '#F59E0B'}
                        />
                        <Text
                          style={[
                            styles.expiryText,
                            { color: expiryStatus.status === 'expired' ? '#EF4444' : '#F59E0B' },
                          ]}
                        >
                          {expiryStatus.message}
                        </Text>
                      </View>
                    )}

                    {/* Actions */}
                    <View style={styles.documentActions}>
                      {doc.status === 'not_uploaded' ? (
                        <TouchableOpacity
                          style={styles.uploadButton}
                          onPress={() => openUploadModal(doc.document_type)}
                        >
                          <Ionicons name="cloud-upload" size={18} color="#8B5CF6" />
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => openPreview(doc)}
                          >
                            <Ionicons name="eye" size={18} color="#3B82F6" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => openUploadModal(doc.document_type)}
                          >
                            <Ionicons name="cloud-upload" size={18} color="#10B981" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No documents found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all'
                  ? "You haven't uploaded any documents yet."
                  : activeTab === 'required'
                  ? 'You have uploaded all required documents.'
                  : activeTab === 'expiring'
                  ? "You don't have any documents expiring soon."
                  : `You don't have any ${activeTab} documents.`}
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => openUploadModal()}>
                <Text style={styles.emptyButtonText}>Upload Document</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showUploadModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDocType ? `Upload ${DOCUMENT_TYPE_LABELS[selectedDocType]}` : 'Upload Document'}
              </Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Document Type Selection if not pre-selected */}
            {!selectedDocType && (
              <View style={styles.docTypeSection}>
                <Text style={styles.sectionLabel}>Select Document Type</Text>
                <ScrollView style={styles.docTypeList}>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, label]) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.docTypeItem}
                      onPress={() => setSelectedDocType(type as DocumentType)}
                    >
                      <Text style={styles.docTypeLabel}>{label}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Upload Options */}
            {selectedDocType && (
              <View style={styles.uploadOptions}>
                {isUploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                    <Text style={styles.uploadingText}>Uploading... {uploadProgress}%</Text>
                    <View style={styles.uploadProgressBar}>
                      <View style={[styles.uploadProgressFill, { width: `${uploadProgress}%` }]} />
                    </View>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity style={styles.uploadOption} onPress={handlePickDocument}>
                      <View style={[styles.uploadOptionIcon, { backgroundColor: '#EEF2FF' }]}>
                        <Ionicons name="document" size={24} color="#4F46E5" />
                      </View>
                      <View style={styles.uploadOptionText}>
                        <Text style={styles.uploadOptionTitle}>Choose File</Text>
                        <Text style={styles.uploadOptionSubtitle}>PDF, JPG, or PNG (max 10MB)</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.uploadOption} onPress={handlePickImage}>
                      <View style={[styles.uploadOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                        <Ionicons name="image" size={24} color="#16A34A" />
                      </View>
                      <View style={styles.uploadOptionText}>
                        <Text style={styles.uploadOptionTitle}>Choose from Gallery</Text>
                        <Text style={styles.uploadOptionSubtitle}>Select an image from your photos</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.uploadOption} onPress={handleTakePhoto}>
                      <View style={[styles.uploadOptionIcon, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="camera" size={24} color="#D97706" />
                      </View>
                      <View style={styles.uploadOptionText}>
                        <Text style={styles.uploadOptionTitle}>Take Photo</Text>
                        <Text style={styles.uploadOptionSubtitle}>Capture document with camera</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowUploadModal(false);
                setSelectedDocType(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal visible={showPreviewModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedDocument?.document_name || 'Document Preview'}
              </Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedDocument && (
              <ScrollView style={styles.previewContent}>
                {/* Document Preview */}
                <View style={styles.previewImageContainer}>
                  {selectedDocument.document_url ? (
                    selectedDocument.mime_type?.startsWith('image/') ||
                    selectedDocument.document_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <Image
                        source={{ uri: selectedDocument.document_url }}
                        style={styles.previewImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.pdfPreview}>
                        <Ionicons name="document-text" size={64} color="#4F46E5" />
                        <Text style={styles.pdfText}>PDF Document</Text>
                        <TouchableOpacity
                          style={styles.openButton}
                          onPress={() => openDocumentExternal(selectedDocument.document_url)}
                        >
                          <Text style={styles.openButtonText}>Open Document</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  ) : (
                    <View style={styles.noPreview}>
                      <Ionicons name="document-outline" size={64} color="#D1D5DB" />
                      <Text style={styles.noPreviewText}>No preview available</Text>
                    </View>
                  )}
                </View>

                {/* Document Details */}
                <View style={styles.previewDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Document Type</Text>
                    <Text style={styles.detailValue}>
                      {DOCUMENT_TYPE_LABELS[selectedDocument.document_type]}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusBadge(selectedDocument.status).bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getStatusBadge(selectedDocument.status).text },
                        ]}
                      >
                        {getStatusBadge(selectedDocument.status).label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Upload Date</Text>
                    <Text style={styles.detailValue}>
                      {formatDocumentDate(selectedDocument.created_at)}
                    </Text>
                  </View>

                  {selectedDocument.expiry_date && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Expiry Date</Text>
                      <Text style={styles.detailValue}>
                        {formatDocumentDate(selectedDocument.expiry_date)}
                      </Text>
                    </View>
                  )}

                  {selectedDocument.rejection_reason && (
                    <View style={styles.rejectionBox}>
                      <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                      <Text style={styles.rejectionText}>
                        {selectedDocument.rejection_reason}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.previewActions}>
                  <TouchableOpacity
                    style={styles.updateButton}
                    onPress={() => {
                      setShowPreviewModal(false);
                      openUploadModal(selectedDocument.document_type);
                    }}
                  >
                    <Ionicons name="cloud-upload" size={18} color="#fff" />
                    <Text style={styles.updateButtonText}>Update Document</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteDocument(selectedDocument)}
                  >
                    <Ionicons name="trash" size={18} color="#EF4444" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },

  // Card styles
  card: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  cardContent: {
    padding: 16,
  },

  // Progress styles
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#F59E0B',
  },
  successText: {
    fontSize: 14,
    color: '#10B981',
  },

  // Required docs grid
  requiredDocsGrid: {
    marginTop: 16,
    gap: 10,
  },
  requiredDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  requiredDocContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  requiredDocLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  requiredDocButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  requiredDocButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Tabs
  tabsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabsContent: {
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#fff',
  },

  // Documents list
  documentsCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  documentMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  documentRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 11,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  uploadButton: {
    padding: 4,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  previewModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 16,
  },

  // Document type selection
  docTypeSection: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  docTypeList: {
    maxHeight: 300,
  },
  docTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  docTypeLabel: {
    fontSize: 15,
    color: '#1F2937',
  },

  // Upload options
  uploadOptions: {
    padding: 16,
    gap: 12,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  uploadOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOptionText: {
    flex: 1,
  },
  uploadOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  uploadOptionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  uploadingText: {
    fontSize: 16,
    color: '#8B5CF6',
    marginTop: 16,
    fontWeight: '600',
  },
  uploadProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  cancelButton: {
    margin: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Preview modal
  previewContent: {
    flex: 1,
  },
  previewImageContainer: {
    height: 300,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pdfPreview: {
    alignItems: 'center',
    gap: 12,
  },
  pdfText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  openButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noPreview: {
    alignItems: 'center',
    gap: 8,
  },
  noPreviewText: {
    fontSize: 14,
    color: '#6B7280',
  },
  previewDetails: {
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  rejectionBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 13,
    color: '#991B1B',
  },
  previewActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
