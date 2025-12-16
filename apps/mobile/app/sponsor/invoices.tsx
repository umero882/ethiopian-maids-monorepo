/**
 * Sponsor Invoices Screen
 *
 * Displays billing history and invoices for the sponsor.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { gql, useQuery } from '@apollo/client';

// Get profile ID by email
const GET_PROFILE_BY_EMAIL = gql`
  query GetProfileByEmail($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      email
    }
  }
`;

// Note: This would be replaced with actual invoice queries when available
// For now, showing a placeholder with informational content

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

// Status styles
const statusStyles: Record<string, { bg: string; text: string }> = {
  paid: { bg: '#ECFDF5', text: '#10B981' },
  pending: { bg: '#FEF3C7', text: '#F59E0B' },
  overdue: { bg: '#FEE2E2', text: '#EF4444' },
};

export default function SponsorInvoicesScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Fetch profile ID
  const { loading: profileLoading } = useQuery(GET_PROFILE_BY_EMAIL, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  // Placeholder invoices - in production, this would come from a GraphQL query
  const invoices: Invoice[] = [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refetch invoices when available
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `ETB ${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Render invoice item
  const renderInvoice = ({ item }: { item: Invoice }) => {
    const statusStyle = statusStyles[item.status] || statusStyles.pending;

    return (
      <TouchableOpacity style={styles.invoiceCard} activeOpacity={0.7}>
        <View style={styles.invoiceHeader}>
          <View>
            <Text style={styles.invoiceNumber}>{item.number}</Text>
            <Text style={styles.invoiceDate}>{formatDate(item.date)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.invoiceBody}>
          <Text style={styles.invoiceDescription}>{item.description}</Text>
          <Text style={styles.invoiceAmount}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.invoiceActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="eye-outline" size={16} color="#3B82F6" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={16} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Download</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Invoices & Billing',
        }}
      />

      <View style={styles.container}>
        {/* Summary Header */}
        <View style={styles.summaryHeader}>
          <View style={styles.summaryCard}>
            <Ionicons name="receipt" size={24} color="#3B82F6" />
            <Text style={styles.summaryCount}>{invoices.length}</Text>
            <Text style={styles.summaryLabel}>Invoices</Text>
          </View>
        </View>

        {/* Invoice List */}
        <FlatList
          data={invoices}
          renderItem={renderInvoice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Invoices Yet</Text>
              <Text style={styles.emptySubtitle}>
                Your billing history will appear here once you make your first booking or subscription payment.
              </Text>

              {/* Info Card */}
              <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>About Billing</Text>
                  <Text style={styles.infoText}>
                    Invoices are automatically generated for all transactions including booking fees, subscription payments, and service charges.
                  </Text>
                </View>
              </View>
            </View>
          }
        />
      </View>
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
  summaryHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  summaryCount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  invoiceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  invoiceDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  invoiceDescription: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    marginRight: 12,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  invoiceActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
    width: '100%',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
});
