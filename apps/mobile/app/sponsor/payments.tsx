/**
 * Sponsor Payment Settings Screen
 *
 * Allows sponsors to manage their payment methods.
 * Features: Add cards, set default, remove payment methods.
 * Connects with the web app PaymentMethodManager functionality.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  usePaymentMethods,
  PaymentMethod,
  getPaymentMethodDisplay,
  getPaymentMethodIcon,
  isCardExpiringSoon,
  formatExpiration,
} from '../../hooks';

// Card brand icons/colors
const cardBrandStyles: Record<string, { color: string; icon: string }> = {
  visa: { color: '#1A1F71', icon: 'card' },
  mastercard: { color: '#EB001B', icon: 'card' },
  amex: { color: '#006FCF', icon: 'card' },
  discover: { color: '#FF6600', icon: 'card' },
  default: { color: '#6B7280', icon: 'card-outline' },
};

export default function SponsorPaymentsScreen() {
  const {
    paymentMethods,
    defaultPaymentMethod,
    loading,
    error,
    refetch,
    addPaymentMethod,
    setDefaultPaymentMethod,
    removePaymentMethod,
    isProcessing,
  } = usePaymentMethods();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingCard, setAddingCard] = useState(false);

  // Form state for adding new card
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cardholderName: '',
    nickname: '',
  });

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle set as default
  const handleSetDefault = async (pm: PaymentMethod) => {
    if (pm.is_default) return;

    Alert.alert(
      'Set as Default',
      `Make "${getPaymentMethodDisplay(pm)}" your default payment method?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Default',
          onPress: async () => {
            const success = await setDefaultPaymentMethod(pm.id);
            if (success) {
              Alert.alert('Success', 'Default payment method updated');
            } else {
              Alert.alert('Error', 'Failed to update default payment method');
            }
          },
        },
      ]
    );
  };

  // Handle remove payment method
  const handleRemove = (pm: PaymentMethod) => {
    if (pm.is_default && paymentMethods.length > 1) {
      Alert.alert(
        'Cannot Remove',
        'Please set another payment method as default before removing this one.'
      );
      return;
    }

    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove "${getPaymentMethodDisplay(pm)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removePaymentMethod(pm.id);
            if (success) {
              Alert.alert('Success', 'Payment method removed');
            } else {
              Alert.alert('Error', 'Failed to remove payment method');
            }
          },
        },
      ]
    );
  };

  // Validate card number (basic Luhn check)
  const isValidCardNumber = (num: string): boolean => {
    const cleanNum = num.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleanNum)) return false;

    let sum = 0;
    let isEven = false;
    for (let i = cleanNum.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNum[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  // Detect card brand from number
  const detectCardBrand = (num: string): string => {
    const cleanNum = num.replace(/\s/g, '');
    if (/^4/.test(cleanNum)) return 'visa';
    if (/^5[1-5]/.test(cleanNum)) return 'mastercard';
    if (/^3[47]/.test(cleanNum)) return 'amex';
    if (/^6(?:011|5)/.test(cleanNum)) return 'discover';
    return 'unknown';
  };

  // Format card number with spaces
  const formatCardNumber = (num: string): string => {
    const cleanNum = num.replace(/\D/g, '');
    const groups = cleanNum.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleanNum;
  };

  // Handle add new card
  const handleAddCard = async () => {
    const { cardNumber, expMonth, expYear, cardholderName, nickname } = cardForm;

    // Validation
    if (!cardholderName.trim()) {
      Alert.alert('Error', 'Please enter the cardholder name');
      return;
    }

    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!isValidCardNumber(cleanCardNumber)) {
      Alert.alert('Error', 'Please enter a valid card number');
      return;
    }

    const month = parseInt(expMonth, 10);
    const year = parseInt(expYear, 10);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (month < 1 || month > 12) {
      Alert.alert('Error', 'Please enter a valid expiration month (01-12)');
      return;
    }

    const fullYear = year < 100 ? 2000 + year : year;
    if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
      Alert.alert('Error', 'Card has expired');
      return;
    }

    setAddingCard(true);

    try {
      // Note: In production, you would use Stripe.js to tokenize the card
      // Here we're storing safe metadata only
      const result = await addPaymentMethod({
        methodType: 'card',
        cardBrand: detectCardBrand(cleanCardNumber),
        cardLast4: cleanCardNumber.slice(-4),
        cardExpMonth: month,
        cardExpYear: fullYear,
        billingName: cardholderName.trim(),
        nickname: nickname.trim() || undefined,
        isDefault: paymentMethods.length === 0, // First card becomes default
      });

      if (result) {
        Alert.alert('Success', 'Payment method added successfully');
        setShowAddModal(false);
        setCardForm({
          cardNumber: '',
          expMonth: '',
          expYear: '',
          cardholderName: '',
          nickname: '',
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add payment method');
    } finally {
      setAddingCard(false);
    }
  };

  // Show payment method actions
  const showActions = (pm: PaymentMethod) => {
    const actions: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [];

    if (!pm.is_default) {
      actions.push({
        text: 'Set as Default',
        onPress: () => handleSetDefault(pm),
      });
    }

    actions.push({
      text: 'Remove',
      style: 'destructive',
      onPress: () => handleRemove(pm),
    });

    actions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Payment Method Options', getPaymentMethodDisplay(pm), actions);
  };

  // Render payment method card
  const renderPaymentMethod = ({ item: pm }: { item: PaymentMethod }) => {
    const brandStyle = cardBrandStyles[pm.card_brand || 'default'] || cardBrandStyles.default;
    const expiringSoon = isCardExpiringSoon(pm);

    return (
      <TouchableOpacity
        style={[styles.paymentCard, pm.is_default && styles.defaultCard]}
        onPress={() => showActions(pm)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconContainer, { backgroundColor: brandStyle.color + '15' }]}>
            <Ionicons
              name={getPaymentMethodIcon(pm) as any}
              size={24}
              color={brandStyle.color}
            />
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{getPaymentMethodDisplay(pm)}</Text>
              {pm.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            {pm.method_type === 'card' && (
              <Text style={styles.cardSubtitle}>
                {pm.card_brand?.toUpperCase() || 'CARD'} **** {pm.card_last4}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.moreButton} onPress={() => showActions(pm)}>
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {pm.method_type === 'card' && pm.card_exp_month && pm.card_exp_year && (
          <View style={styles.cardDetails}>
            <View style={styles.expiryContainer}>
              <Text style={styles.expiryLabel}>Expires</Text>
              <Text style={[styles.expiryValue, expiringSoon && styles.expiryWarning]}>
                {formatExpiration(pm)}
                {expiringSoon && ' (Expiring Soon)'}
              </Text>
            </View>
            <Text style={styles.billingName}>{pm.billing_name}</Text>
          </View>
        )}

        {!pm.is_verified && (
          <View style={styles.unverifiedBanner}>
            <Ionicons name="warning-outline" size={14} color="#F59E0B" />
            <Text style={styles.unverifiedText}>Verification pending</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && !paymentMethods.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Payment Methods',
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle-outline" size={26} color="#3B82F6" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        {/* Summary Header */}
        <View style={styles.summaryHeader}>
          <View style={styles.summaryCard}>
            <Ionicons name="card" size={24} color="#3B82F6" />
            <Text style={styles.summaryCount}>{paymentMethods.length}</Text>
            <Text style={styles.summaryLabel}>
              {paymentMethods.length === 1 ? 'Payment Method' : 'Payment Methods'}
            </Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
          <Text style={styles.infoText}>
            Your payment information is securely stored and encrypted
          </Text>
        </View>

        {/* Payment Methods List */}
        <FlatList
          data={paymentMethods}
          renderItem={renderPaymentMethod}
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
              <Ionicons name="card-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Payment Methods</Text>
              <Text style={styles.emptySubtitle}>
                Add a payment method to start booking services
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Payment Method</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            paymentMethods.length > 0 ? (
              <TouchableOpacity
                style={styles.addNewButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add-circle-outline" size={22} color="#3B82F6" />
                <Text style={styles.addNewButtonText}>Add New Payment Method</Text>
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Add Payment Method Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Payment Method</Text>
              <TouchableOpacity
                onPress={handleAddCard}
                disabled={addingCard}
              >
                <Text style={[styles.modalSave, addingCard && styles.modalSaveDisabled]}>
                  {addingCard ? 'Adding...' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Card Type Info */}
              <View style={styles.cardTypeInfo}>
                <View style={styles.cardIcons}>
                  <View style={[styles.cardIcon, { backgroundColor: '#1A1F71' }]}>
                    <Text style={styles.cardIconText}>VISA</Text>
                  </View>
                  <View style={[styles.cardIcon, { backgroundColor: '#EB001B' }]}>
                    <Text style={styles.cardIconText}>MC</Text>
                  </View>
                  <View style={[styles.cardIcon, { backgroundColor: '#006FCF' }]}>
                    <Text style={styles.cardIconText}>AMEX</Text>
                  </View>
                </View>
                <Text style={styles.cardTypeLabel}>We accept major credit cards</Text>
              </View>

              {/* Card Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  value={cardForm.cardNumber}
                  onChangeText={(text) =>
                    setCardForm({ ...cardForm, cardNumber: formatCardNumber(text) })
                  }
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={23}
                />
              </View>

              {/* Expiry Row */}
              <View style={styles.expiryRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Month</Text>
                  <TextInput
                    style={styles.input}
                    value={cardForm.expMonth}
                    onChangeText={(text) =>
                      setCardForm({ ...cardForm, expMonth: text.replace(/\D/g, '').slice(0, 2) })
                    }
                    placeholder="MM"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.inputLabel}>Year</Text>
                  <TextInput
                    style={styles.input}
                    value={cardForm.expYear}
                    onChangeText={(text) =>
                      setCardForm({ ...cardForm, expYear: text.replace(/\D/g, '').slice(0, 4) })
                    }
                    placeholder="YY"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              </View>

              {/* Cardholder Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput
                  style={styles.input}
                  value={cardForm.cardholderName}
                  onChangeText={(text) => setCardForm({ ...cardForm, cardholderName: text })}
                  placeholder="Name on card"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
              </View>

              {/* Nickname (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Nickname <Text style={styles.optionalLabel}>(Optional)</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={cardForm.nickname}
                  onChangeText={(text) => setCardForm({ ...cardForm, nickname: text })}
                  placeholder="e.g., Personal Card, Work Card"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Security Note */}
              <View style={styles.securityNote}>
                <Ionicons name="lock-closed-outline" size={16} color="#6B7280" />
                <Text style={styles.securityNoteText}>
                  Your card information is securely encrypted and never stored on our servers.
                  We only save the last 4 digits for your reference.
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
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
  headerButton: {
    marginRight: 8,
    padding: 8,
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#059669',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  defaultCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  defaultBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  expiryValue: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  expiryWarning: {
    color: '#F59E0B',
  },
  billingName: {
    fontSize: 12,
    color: '#6B7280',
  },
  unverifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#FCD34D',
  },
  unverifiedText: {
    fontSize: 12,
    color: '#92400E',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 8,
  },
  addNewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  cardTypeInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  cardIcons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  cardIcon: {
    width: 48,
    height: 30,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardTypeLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  optionalLabel: {
    fontWeight: '400',
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  expiryRow: {
    flexDirection: 'row',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});
