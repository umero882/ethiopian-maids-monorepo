/**
 * Hooks Index
 *
 * Export all custom hooks for easy importing.
 */

export { useAuth } from './useAuth';
export { useNotifications, useUnreadNotificationCount } from './useNotifications';
export type { Notification } from './useNotifications';
export { usePushNotifications } from './usePushNotifications';
export type { UsePushNotificationsReturn } from './usePushNotifications';
export { useConversations, useMessages, useCreateConversation, useUnreadMessageCount } from './useMessages';
export type { Message, Conversation } from './useMessages';

// Dashboard hooks
export {
  useSponsorDashboard,
  useMaidDashboard,
  useAgencyDashboard,
  useAgencyDashboardRealtime,
  useMaidDashboardRealtime,
  useSponsorDashboardRealtime,
  useRecentBookings,
  useRecentJobs,
} from './useDashboard';
export type {
  ProfileInfo,
  SponsorDashboardStats,
  MaidDashboardStats,
  AgencyDashboardStats,
  AgencyActivity,
  MaidStatusSummary,
  AgencyFinancials,
  PipelineStage,
  DashboardData,
  RealtimeDashboardData,
  RecentBooking,
  RecentJob,
} from './useDashboard';

// Payment methods hooks
export {
  usePaymentMethods,
  useDefaultPaymentMethod,
  getPaymentMethodDisplay,
  getPaymentMethodIcon,
  isCardExpiringSoon,
  formatExpiration,
} from './usePaymentMethods';
export type { PaymentMethod, AddPaymentMethodInput } from './usePaymentMethods';

// Reviews hooks
export {
  useReviewsGiven,
  useReviewsReceived,
  useMaidReviews,
  useReviewMutations,
  useCanReview,
  formatReviewDate,
  getStarRating,
} from './useReviews';
export type { Review, ReviewStats, CreateReviewInput } from './useReviews';

// Settings hooks
export {
  useSettings,
  useLocalSettings,
  useProfileSettings,
  AVAILABLE_LANGUAGES,
  THEME_OPTIONS,
} from './useSettings';
export type {
  UserSettings,
  NotificationSettings,
  PrivacySettings,
  AppSettings,
  ProfileData,
} from './useSettings';

// Biometrics hooks
export {
  useBiometrics,
  isBiometricsAvailable,
  isBiometricsEnabled,
} from './useBiometrics';
export type { BiometricType, BiometricState, UseBiometricsReturn } from './useBiometrics';

// Support hooks
export {
  useSupport,
  useFAQ,
  useSupportTickets,
  useContactSupport,
  FAQ_ITEMS,
  SUPPORT_CATEGORIES,
} from './useSupport';
export type {
  FAQItem,
  SupportCategory,
  SupportTicket,
  CreateTicketInput,
} from './useSupport';

// Subscription hooks
export {
  useSubscription,
  useSubscriptionPricing,
  useFeatureAccess,
  SUBSCRIPTION_PLANS,
} from './useSubscription';
export type {
  PlanType,
  BillingCycle,
  UserType,
  PlanConfig,
  PlanLimits,
  Subscription,
  UsageStats,
} from './useSubscription';

// Documents hooks
export {
  useDocuments,
  getDocumentExpiryStatus,
  formatDocumentDate,
  DOCUMENT_TYPE_LABELS,
  REQUIRED_DOCUMENT_TYPES,
  DOCUMENT_CATEGORIES,
} from './useDocuments';
export type {
  MaidDocument,
  DocumentType,
  DocumentStatus,
  UploadDocumentInput,
  VerificationHistoryItem,
  UseDocumentsReturn,
} from './useDocuments';

// Calendar hooks
export {
  useCalendar,
  REMINDER_INTERVALS,
} from './useCalendar';
export type {
  CalendarEvent,
  Task,
  Participant,
} from './useCalendar';

// Notification Settings hooks (synced with web)
export {
  useNotificationSettings,
  DEFAULT_SETTINGS as DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_CATEGORIES,
} from './useNotificationSettings';
export type {
  NotificationSettings,
  NotificationTypePreference,
  NotificationTypes,
  ChannelType,
  EmailFrequency,
  UseNotificationSettingsReturn,
} from './useNotificationSettings';
