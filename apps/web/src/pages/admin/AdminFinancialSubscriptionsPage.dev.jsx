import React, { useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  MoreHorizontal,
  Eye,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  Download,
  Upload,
  Crown,
  Star,
  Zap,
  AlertCircle,
  Users,
  Building2,
  Briefcase,
  Copy,
  ExternalLink,
  Mail,
  Phone,
  Activity,
  BarChart3,
  History,
  FileText,
  MessageSquare,
  Search as SearchIcon,
  Webhook,
  ArrowRight,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAdminSubscriptions } from '@/hooks/admin/useAdminSubscriptions';
import { toast } from '@/components/ui/use-toast';

const AdminFinancialSubscriptionsPage = () => {
  const {
    subscriptions,
    summary,
    monthlyTrend,
    selectedSubscription,
    totalCount,
    loading,
    statsLoading,
    trendLoading,
    actionLoading,
    error,
    currentPage,
    totalPages,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    goToPage,
    setSelectedSubscription,
    fetchSubscriptionById,
    pauseSubscription,
    cancelSubscription,
    reactivateSubscription,
    refresh
  } = useAdminSubscriptions();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Format currency
  const formatCurrency = (amount, currency = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString, fallback = '-') => {
    if (!dateString) return fallback;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return fallback;
    }
  };

  const handleSubscriptionAction = async (subscriptionId, action) => {
    switch (action) {
      case 'pause':
        await pauseSubscription(subscriptionId);
        break;
      case 'cancel':
        await cancelSubscription(subscriptionId);
        break;
      case 'reactivate':
        await reactivateSubscription(subscriptionId);
        break;
    }
  };

  const handleViewDetails = async (subscription) => {
    // Open dialog immediately with basic subscription data (already enriched from list)
    setSelectedSubscription(subscription);
    setIsDialogOpen(true);
    setDialogLoading(true);

    // Fetch full details in background (includes usage, logs, etc.)
    try {
      await fetchSubscriptionById(subscription.id);
    } finally {
      setDialogLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Active', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      trialing: { label: 'Trialing', icon: Star, color: 'bg-blue-100 text-blue-800' },
      past_due: { label: 'Past Due', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' },
      paused: { label: 'Paused', icon: PauseCircle, color: 'bg-gray-100 text-gray-800' },
      expired: { label: 'Expired', icon: Clock, color: 'bg-gray-100 text-gray-800' }
    };

    // Handle null, undefined, or empty status
    const normalizedStatus = status?.toLowerCase?.()?.trim?.();
    const config = statusConfig[normalizedStatus] || { label: 'Unknown', icon: AlertCircle, color: 'bg-gray-100 text-gray-800' };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPlanTypeBadge = (type) => {
    const typeConfig = {
      free: { label: 'Free', icon: Zap, color: 'bg-gray-100 text-gray-800' },
      pro: { label: 'Pro', icon: Star, color: 'bg-blue-100 text-blue-800' },
      premium: { label: 'Premium', icon: Crown, color: 'bg-purple-100 text-purple-800' },
      basic: { label: 'Basic', icon: Zap, color: 'bg-gray-100 text-gray-800' }
    };

    // Handle null, undefined, or empty plan_type
    const normalizedType = type?.toLowerCase?.()?.trim?.();
    const config = typeConfig[normalizedType] || { label: 'Standard', icon: Zap, color: 'bg-gray-100 text-gray-800' };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getUserTypeBadge = (type) => {
    const typeConfig = {
      maid: { label: 'Maid', color: 'bg-blue-100 text-blue-800', icon: Briefcase },
      agency: { label: 'Agency', color: 'bg-purple-100 text-purple-800', icon: Building2 },
      sponsor: { label: 'Sponsor', color: 'bg-green-100 text-green-800', icon: Users }
    };

    // Handle null, undefined, or empty user_type
    const normalizedType = type?.toLowerCase?.()?.trim?.();
    const config = typeConfig[normalizedType] || { label: 'User', color: 'bg-gray-100 text-gray-800', icon: Users };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Helper to copy text to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast?.({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  // Get webhook event status badge
  const getWebhookStatusBadge = (status) => {
    if (status >= 200 && status < 300) {
      return <Badge className="bg-green-100 text-green-800">Success</Badge>;
    } else if (status >= 400) {
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
  };

  // Format webhook event type for display
  const formatEventType = (eventType) => {
    if (!eventType) return 'Unknown';
    return eventType
      .replace(/^(customer\.|invoice\.|subscription\.)/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get default features based on plan type
  const getDefaultFeatures = (planType) => {
    const normalizedPlanType = planType?.toLowerCase?.()?.trim?.();
    const featuresByPlan = {
      free: [
        'Basic profile creation',
        'Limited search visibility',
        'Up to 3 job applications per month'
      ],
      basic: [
        'Enhanced profile features',
        'Standard search visibility',
        'Up to 10 job applications per month',
        'Basic messaging'
      ],
      pro: [
        'Priority profile placement',
        'Enhanced search visibility',
        'Unlimited job applications',
        'Advanced messaging features',
        'Profile analytics'
      ],
      premium: [
        'Featured profile placement',
        'Maximum search visibility',
        'Unlimited job applications',
        'Priority customer support',
        'Advanced messaging with read receipts',
        'Detailed profile analytics',
        'Verified badge eligibility',
        'Export data features'
      ]
    };
    return featuresByPlan[normalizedPlanType] || null;
  };

  const SubscriptionDetailDialog = ({ subscription, open, onOpenChange, loading: detailsLoading }) => {
    if (!subscription) return null;

    // Get features from subscription or use defaults based on plan_type
    const storedFeatures = subscription.features;
    const hasStoredFeatures = Array.isArray(storedFeatures) && storedFeatures.length > 0;
    const defaultFeatures = getDefaultFeatures(subscription.plan_type);
    const features = hasStoredFeatures ? storedFeatures : (defaultFeatures || []);
    const isUsingDefaults = !hasStoredFeatures && defaultFeatures;

    const usageData = subscription.subscription_usages || [];
    const webhookLogs = subscription.webhook_event_logs || [];
    const statusLogs = subscription.subscription_status_logs || [];
    const latestUsage = usageData[0] || {};

    // Calculate usage percentage for visual display
    const getUsagePercentage = (current, max) => {
      if (!max || max === 0) return 0;
      return Math.min((current / max) * 100, 100);
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{subscription.plan_name || 'Subscription'}</h2>
                    {getStatusBadge(subscription.status)}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>ID:</span>
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {subscription.id?.substring(0, 8)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(subscription.id, 'Subscription ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <span>•</span>
                    <span>{formatCurrency(subscription.amount, subscription.currency || 'AED')}/{subscription.billing_period || 'month'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {subscription.stripe_subscription_id && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://dashboard.stripe.com/subscriptions/${subscription.stripe_subscription_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Stripe
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="overview" className="flex-1">
            <div className="border-b px-6">
              <TabsList className="h-12 bg-transparent p-0 gap-6">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="usage"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Usage
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0"
                >
                  <Webhook className="h-4 w-4 mr-2" />
                  Payment Events
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0"
                >
                  <History className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[calc(90vh-220px)]">
              {/* Overview Tab */}
              <TabsContent value="overview" className="p-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Information Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        User Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {subscription.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg">{subscription.user?.name || 'Unknown User'}</p>
                            {subscription.user?.isPlaceholder && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                Profile not linked
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {getUserTypeBadge(subscription.user_type)}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>Email</span>
                          </div>
                          {subscription.user?.email && subscription.user.email !== 'No email available' ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{subscription.user.email}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(subscription.user.email, 'Email')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Not available</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>User ID</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {subscription.user_id?.substring(0, 12)}...
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(subscription.user_id, 'User ID')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Member Since</span>
                          </div>
                          <span className="text-sm">{formatDate(subscription.created_at)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subscription Details Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Subscription Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Plan</span>
                        <div className="flex items-center gap-2">
                          {getPlanTypeBadge(subscription.plan_type)}
                          <span className="text-sm font-medium">{subscription.plan_name}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Price</span>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(subscription.amount, subscription.currency || 'AED')}
                          <span className="text-sm font-normal text-muted-foreground">/{subscription.billing_period || 'month'}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Payment Status</span>
                        <Badge variant={subscription.payment_status === 'paid' ? 'default' : 'secondary'}>
                          {subscription.payment_status || 'Unknown'}
                        </Badge>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Current Period</span>
                          <span>
                            {formatDate(subscription.start_date)} - {(subscription.end_date || subscription.expires_at) ? formatDate(subscription.end_date || subscription.expires_at) : 'Ongoing'}
                          </span>
                        </div>

                        {subscription.trial_end_date && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Trial Ends</span>
                            <span>{formatDate(subscription.trial_end_date)}</span>
                          </div>
                        )}

                        {subscription.cancelled_at && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Cancelled At</span>
                            <span className="text-red-600">{formatDate(subscription.cancelled_at)}</span>
                          </div>
                        )}

                        {subscription.grace_period_ends && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Grace Period Ends</span>
                            <span className="text-yellow-600">{formatDate(subscription.grace_period_ends)}</span>
                          </div>
                        )}
                      </div>

                      {subscription.stripe_subscription_id && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Stripe Subscription</span>
                            <div className="flex items-center gap-1">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {subscription.stripe_subscription_id.substring(0, 14)}...
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(subscription.stripe_subscription_id, 'Stripe ID')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Plan Features Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Plan Features
                        {isUsingDefaults && (
                          <Badge variant="outline" className="text-xs font-normal ml-2">
                            Default
                          </Badge>
                        )}
                      </CardTitle>
                      {isUsingDefaults && (
                        <p className="text-xs text-muted-foreground">
                          Showing standard features for {subscription.plan_type || 'this'} plan
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {features.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No features listed for this plan</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Stats Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {subscription.last_payment_attempt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Last Payment</span>
                          <span className="text-sm">{formatDate(subscription.last_payment_attempt)}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Payment Retries</span>
                        {subscription.payment_retry_count > 0 ? (
                          <Badge variant="destructive">{subscription.payment_retry_count} retries</Badge>
                        ) : (
                          <Badge variant="outline">No retries</Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status Changes</span>
                        <span className="text-sm font-medium">{statusLogs.length}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Webhook Events</span>
                        <span className="text-sm font-medium">{webhookLogs.length}</span>
                      </div>

                      {subscription.metadata && Object.keys(subscription.metadata).length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Metadata</p>
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(subscription.metadata, null, 2)}
                            </pre>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Usage Tab */}
              <TabsContent value="usage" className="p-6 mt-0">
                {detailsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">Loading usage data...</span>
                  </div>
                ) : usageData.length > 0 ? (
                  <div className="space-y-6">
                    {/* Current Period Usage */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Current Period Usage</CardTitle>
                        <CardDescription>
                          {formatDate(latestUsage.period_start)} - {formatDate(latestUsage.period_end)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                              <FileText className="h-4 w-4" />
                              <span className="text-xs font-medium">Job Postings</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-700">{latestUsage.job_postings_active || 0}</p>
                          </div>

                          <div className="p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2 text-green-600 mb-1">
                              <Users className="h-4 w-4" />
                              <span className="text-xs font-medium">Maid Listings</span>
                            </div>
                            <p className="text-2xl font-bold text-green-700">{latestUsage.maid_listings_active || 0}</p>
                          </div>

                          <div className="p-4 bg-purple-50 rounded-lg">
                            <div className="flex items-center gap-2 text-purple-600 mb-1">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-xs font-medium">Messages Sent</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-700">{latestUsage.messages_sent || 0}</p>
                          </div>

                          <div className="p-4 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-2 text-orange-600 mb-1">
                              <SearchIcon className="h-4 w-4" />
                              <span className="text-xs font-medium">Searches</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-700">{latestUsage.candidate_searches_performed || 0}</p>
                          </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Profile Views</span>
                              <span className="text-sm font-medium">{latestUsage.profile_views || 0}</span>
                            </div>
                            <Progress value={getUsagePercentage(latestUsage.profile_views, 100)} className="h-2" />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Candidates Saved</span>
                              <span className="text-sm font-medium">{latestUsage.candidates_saved || 0}</span>
                            </div>
                            <Progress value={getUsagePercentage(latestUsage.candidates_saved, 50)} className="h-2" />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Sponsor Connections</span>
                              <span className="text-sm font-medium">{latestUsage.sponsor_connections || 0}</span>
                            </div>
                            <Progress value={getUsagePercentage(latestUsage.sponsor_connections, 20)} className="h-2" />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Job Applications</span>
                              <span className="text-sm font-medium">{latestUsage.job_applications_submitted || 0}</span>
                            </div>
                            <Progress value={getUsagePercentage(latestUsage.job_applications_submitted, 30)} className="h-2" />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Message Threads</span>
                              <span className="text-sm font-medium">{latestUsage.message_threads_used || 0}</span>
                            </div>
                            <Progress value={getUsagePercentage(latestUsage.message_threads_used, 20)} className="h-2" />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Bulk Uploads</span>
                              <span className="text-sm font-medium">{latestUsage.bulk_uploads_performed || 0}</span>
                            </div>
                            <Progress value={getUsagePercentage(latestUsage.bulk_uploads_performed, 10)} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Historical Usage */}
                    {usageData.length > 1 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Usage History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead className="text-right">Jobs</TableHead>
                                <TableHead className="text-right">Listings</TableHead>
                                <TableHead className="text-right">Messages</TableHead>
                                <TableHead className="text-right">Searches</TableHead>
                                <TableHead className="text-right">Views</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {usageData.map((usage, index) => (
                                <TableRow key={usage.id || index}>
                                  <TableCell className="font-medium">
                                    {formatDate(usage.period_start)} - {formatDate(usage.period_end)}
                                  </TableCell>
                                  <TableCell className="text-right">{usage.job_postings_active || 0}</TableCell>
                                  <TableCell className="text-right">{usage.maid_listings_active || 0}</TableCell>
                                  <TableCell className="text-right">{usage.messages_sent || 0}</TableCell>
                                  <TableCell className="text-right">{usage.candidate_searches_performed || 0}</TableCell>
                                  <TableCell className="text-right">{usage.profile_views || 0}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-1">No Usage Data</h3>
                    <p className="text-sm text-muted-foreground">Usage tracking data is not available for this subscription</p>
                  </div>
                )}
              </TabsContent>

              {/* Payment Events Tab */}
              <TabsContent value="payments" className="p-6 mt-0">
                {detailsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">Loading payment events...</span>
                  </div>
                ) : webhookLogs.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Payment & Webhook Events</CardTitle>
                      <CardDescription>Recent payment-related webhook events from Stripe</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {webhookLogs.map((log, index) => (
                          <div
                            key={log.id || index}
                            className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              log.response_status >= 200 && log.response_status < 300
                                ? 'bg-green-100'
                                : log.response_status >= 400
                                ? 'bg-red-100'
                                : 'bg-gray-100'
                            }`}>
                              <Webhook className={`h-5 w-5 ${
                                log.response_status >= 200 && log.response_status < 300
                                  ? 'text-green-600'
                                  : log.response_status >= 400
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{formatEventType(log.event_type)}</span>
                                {getWebhookStatusBadge(log.response_status)}
                                {log.retry_count > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {log.retry_count} retries
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{formatDate(log.received_at || log.created_at)}</span>
                                {log.processing_duration_ms && (
                                  <span>{log.processing_duration_ms}ms</span>
                                )}
                                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                  {log.event_id?.substring(0, 20)}...
                                </code>
                              </div>
                              {log.error_message && (
                                <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                                  {log.error_message}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12">
                    <Webhook className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-1">No Payment Events</h3>
                    <p className="text-sm text-muted-foreground">No webhook events have been recorded for this subscription</p>
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="p-6 mt-0">
                {detailsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">Loading history...</span>
                  </div>
                ) : statusLogs.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Status Change History</CardTitle>
                      <CardDescription>Timeline of subscription status changes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

                        <div className="space-y-6">
                          {statusLogs.map((log, index) => (
                            <div key={log.id || index} className="relative flex gap-4">
                              {/* Timeline dot */}
                              <div className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                log.new_status === 'active' ? 'bg-green-100' :
                                log.new_status === 'cancelled' ? 'bg-red-100' :
                                log.new_status === 'paused' ? 'bg-yellow-100' :
                                'bg-gray-100'
                              }`}>
                                {log.new_status === 'active' ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : log.new_status === 'cancelled' ? (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                ) : log.new_status === 'paused' ? (
                                  <PauseCircle className="h-5 w-5 text-yellow-600" />
                                ) : (
                                  <Clock className="h-5 w-5 text-gray-600" />
                                )}
                              </div>

                              <div className="flex-1 pb-6">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {log.old_status || 'New'}
                                  </Badge>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  {getStatusBadge(log.new_status)}
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  {formatDate(log.created_at)}
                                </p>
                                {log.reason && (
                                  <p className="text-sm bg-gray-50 p-2 rounded mt-2">
                                    <span className="font-medium">Reason:</span> {log.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-1">No Status History</h3>
                    <p className="text-sm text-muted-foreground">No status changes have been recorded for this subscription</p>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Footer Actions */}
          <DialogFooter className="border-t p-4 bg-gray-50">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                Last updated: {formatDate(subscription.updated_at)}
              </div>
              <div className="flex items-center gap-2">
                {subscription.status === 'active' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleSubscriptionAction(subscription.id, 'pause');
                        onOpenChange(false);
                      }}
                    >
                      <PauseCircle className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        handleSubscriptionAction(subscription.id, 'cancel');
                        onOpenChange(false);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
                {subscription.status === 'paused' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      handleSubscriptionAction(subscription.id, 'reactivate');
                      onOpenChange(false);
                    }}
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Reactivate
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Loading skeleton
  if (loading && subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage user subscriptions and billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message || 'Failed to load subscriptions'}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Lifetime revenue</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary.monthlyRecurring)}</div>
                <p className="text-xs text-muted-foreground">Active subscriptions MRR</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary.activeCount}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">{summary.pastDueCount}</div>
                <p className="text-xs text-muted-foreground">Past due subscriptions</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user ID, plan name..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={filters.status} onValueChange={(v) => updateFilter('status', v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.planType} onValueChange={(v) => updateFilter('planType', v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plan Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.userType} onValueChange={(v) => updateFilter('userType', v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="maid">Maids</SelectItem>
                <SelectItem value="sponsor">Sponsors</SelectItem>
                <SelectItem value="agency">Agencies</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions ({totalCount})</CardTitle>
          <CardDescription>
            Complete subscription management with billing and user information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 && !loading ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions found</h3>
              <p className="text-gray-500">
                {hasActiveFilters ? 'Try adjusting your filters' : 'No subscriptions in the database yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => {
                    // Helper to get display name
                    const getUserDisplayName = () => {
                      if (subscription.user?.name && subscription.user.name !== subscription.user_id) {
                        return subscription.user.name;
                      }
                      // Truncate long IDs for display
                      if (subscription.user_id) {
                        return subscription.user_id.length > 12
                          ? `${subscription.user_id.substring(0, 8)}...`
                          : subscription.user_id;
                      }
                      return 'Unknown User';
                    };

                    const getAvatarInitials = () => {
                      if (subscription.user?.name && subscription.user.name !== subscription.user_id) {
                        return subscription.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                      }
                      if (subscription.user_id) {
                        return subscription.user_id.substring(0, 2).toUpperCase();
                      }
                      return 'U';
                    };

                    return (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {getAvatarInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium" title={subscription.user_id || ''}>
                              {getUserDisplayName()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getUserTypeBadge(subscription.user_type)}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{subscription.plan_name || 'No Plan'}</div>
                          {getPlanTypeBadge(subscription.plan_type)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(subscription.status)}
                          {subscription.payment_retry_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {subscription.payment_retry_count} retries
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-semibold">
                            {formatCurrency(subscription.amount, subscription.currency || 'AED')}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            /{subscription.billing_period || 'month'}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(subscription.start_date)}</div>
                          {(subscription.end_date || subscription.expires_at) ? (
                            <div className="text-muted-foreground text-xs">
                              to {formatDate(subscription.end_date || subscription.expires_at)}
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-xs italic">
                              Ongoing
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(subscription.created_at)}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={actionLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(subscription)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {subscription.status === 'active' && (
                              <DropdownMenuItem
                                onClick={() => handleSubscriptionAction(subscription.id, 'pause')}
                              >
                                <PauseCircle className="mr-2 h-4 w-4 text-yellow-500" />
                                Pause
                              </DropdownMenuItem>
                            )}
                            {subscription.status === 'paused' && (
                              <DropdownMenuItem
                                onClick={() => handleSubscriptionAction(subscription.id, 'reactivate')}
                              >
                                <PlayCircle className="mr-2 h-4 w-4 text-green-500" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            {['active', 'paused', 'past_due'].includes(subscription.status) && (
                              <DropdownMenuItem
                                onClick={() => handleSubscriptionAction(subscription.id, 'cancel')}
                              >
                                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export Data
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({totalCount} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1 || loading}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || loading}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Subscription Detail Dialog */}
      <SubscriptionDetailDialog
        subscription={selectedSubscription}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        loading={dialogLoading}
      />
    </div>
  );
};

export default AdminFinancialSubscriptionsPage;
