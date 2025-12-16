import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Download,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  Zap,
  Users,
  HardDrive,
  Activity,
  Crown,
  Shield,
  Building2,
  ArrowUpCircle,
  RefreshCw,
  FileText,
  AlertCircle,
  TrendingUp,
  Briefcase,
  MessageSquare,
  Eye,
  Receipt,
  Sparkles,
  ChevronRight,
  Info,
  Check,
  X
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { billingService } from '@/services/billingService.graphql';
import { stripeBillingService } from '@/services/stripeBillingService';
import { syncSubscriptionAfterPayment, detectPlanFromPayment } from '@/services/subscriptionSyncService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useSubscription, SUBSCRIPTION_PLANS } from '@/contexts/SubscriptionContext';
import { useSearchParams } from 'react-router-dom';

const AgencyBillingPage = () => {
  const { user } = useAuth();
  const { refreshSubscription, subscriptionPlan, dbSubscription } = useSubscription();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [billingData, setBillingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Dialogs
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Forms
  const [refundForm, setRefundForm] = useState({
    reason: '',
    details: ''
  });

  const [paymentMethodForm, setPaymentMethodForm] = useState({
    type: 'credit_card',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvc: '',
    name: ''
  });

  const userId = user?.id;
  const agencyId = user?.agency_id || user?.id;

  // Check for successful payment return from Stripe and sync subscription
  useEffect(() => {
    const handlePaymentReturn = async () => {
      const success = searchParams.get('success');
      const sessionId = searchParams.get('session_id');

      if (success === 'true' && userId) {
        console.log('[AgencyBilling] Detected successful payment return, syncing subscription...');
        setIsSyncing(true);
        setSyncMessage('Activating your subscription...');

        try {
          // Detect plan type from the payment (default to Agency Pro)
          const planDetails = {
            planName: 'Professional',
            planType: 'pro',
            amount: 49900, // 499 AED in fils
            currency: 'AED',
            billingPeriod: 'monthly',
            stripeSessionId: sessionId,
          };

          const result = await syncSubscriptionAfterPayment(userId, planDetails);

          if (result.success) {
            setSyncMessage('Subscription activated successfully!');
            // Clear URL params
            setSearchParams({});
            // Refresh subscription context to update global state
            await refreshSubscription();
            // Reload billing data
            await loadBillingData();
          } else {
            setSyncMessage('Subscription may need manual activation. Please contact support if issues persist.');
          }
        } catch (error) {
          console.error('[AgencyBilling] Error syncing subscription:', error);
          setSyncMessage('Error activating subscription. Click "Sync" to try again.');
        } finally {
          setIsSyncing(false);
          // Clear message after 5 seconds
          setTimeout(() => setSyncMessage(null), 5000);
        }
      }
    };

    handlePaymentReturn();
  }, [searchParams, userId]);

  useEffect(() => {
    if (userId) {
      loadBillingData();
    }
  }, [userId, agencyId]);

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await billingService.getBillingData(userId, agencyId);

      if (fetchError) {
        console.error('Failed to load billing data:', fetchError);
        setError(fetchError.message || 'Failed to load billing data');
        return;
      }

      setBillingData(data);
    } catch (err) {
      console.error('Failed to load billing data:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBillingData();
    setIsRefreshing(false);
  };

  // Manual sync subscription (for when auto-sync fails or user needs to re-sync)
  const handleSyncSubscription = async () => {
    if (!userId) return;

    setIsSyncing(true);
    setSyncMessage('Syncing subscription...');

    try {
      // Default to Agency Pro plan for manual sync
      const planDetails = {
        planName: 'Professional',
        planType: 'pro',
        amount: 49900,
        currency: 'AED',
        billingPeriod: 'monthly',
      };

      const result = await syncSubscriptionAfterPayment(userId, planDetails);

      if (result.success) {
        setSyncMessage('Subscription synced successfully!');
        // Refresh subscription context to update global state
        await refreshSubscription();
        await loadBillingData();
      } else {
        setSyncMessage('Failed to sync. Please contact support.');
      }
    } catch (error) {
      console.error('[AgencyBilling] Error syncing:', error);
      setSyncMessage('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    try {
      // Get Stripe customer ID from subscription data
      const stripeCustomerId = dbSubscription?.stripe_customer_id;

      if (!stripeCustomerId) {
        toast({
          title: 'No Payment Method',
          description: 'Please subscribe to a plan first to add a payment method.',
          variant: 'destructive',
        });
        return;
      }

      // Redirect to Stripe Customer Portal for secure payment method management
      const returnUrl = `${window.location.origin}/dashboard/agency/billing`;
      const result = await stripeBillingService.createPortalSession(stripeCustomerId, returnUrl);

      if (!result.success) {
        toast({
          title: 'Portal Error',
          description: result.error || 'Unable to open billing portal. Please try again.',
          variant: 'destructive',
        });
      }
      // If successful, user will be redirected to Stripe Portal
    } catch (error) {
      console.error('Failed to update payment method:', error);
      toast({
        title: 'Error',
        description: 'Unable to open payment settings. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      if (invoice.receipt_url) {
        window.open(invoice.receipt_url, '_blank');
      } else {
        const invoiceText = `
INVOICE
========================================
Invoice Number: ${invoice.invoice_number}
Date: ${formatDate(invoice.issued_date)}
Amount: ${formatCurrency(invoice.amount, invoice.currency)}
Status: ${invoice.status}
Description: ${invoice.description}
========================================
Thank you for your business!
        `.trim();

        const blob = new Blob([invoiceText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoice.invoice_number}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  const handleRequestRefund = async () => {
    if (!selectedInvoice) return;

    try {
      console.log('Refund request:', {
        invoice: selectedInvoice,
        reason: refundForm.reason,
        details: refundForm.details
      });
      setIsRefundDialogOpen(false);
      setSelectedInvoice(null);
      setRefundForm({ reason: '', details: '' });
      alert('Refund request submitted. Our team will review it within 2-3 business days.');
    } catch (error) {
      console.error('Failed to request refund:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      succeeded: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      completed: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      overdue: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
      failed: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: X }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (used, limit) => {
    if (limit === -1 || limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get upgrade button text based on current subscription plan
  const getUpgradeButtonConfig = () => {
    const currentPlan = subscriptionPlan || subscription?.plan_type || 'free';
    const planLower = currentPlan.toLowerCase();

    if (planLower === 'premium') {
      return { text: 'Premium Plan', disabled: true, showIcon: false };
    }
    if (planLower === 'pro') {
      return { text: 'Upgrade to Premium', disabled: false, showIcon: true };
    }
    return { text: 'Upgrade to Pro', disabled: false, showIcon: true };
  };

  // Check if user is on a specific plan
  const isOnPlan = (planType) => {
    const currentPlan = subscriptionPlan || subscription?.plan_type || 'free';
    return currentPlan.toLowerCase() === planType.toLowerCase();
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
            <p className="text-gray-600 mt-1">Loading billing information...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                    <div className="h-8 w-24 bg-gray-200 rounded" />
                    <div className="h-4 w-40 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-8 w-8 bg-gray-200 rounded mb-3" />
                  <div className="h-6 w-16 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and billing information</p>
        </div>
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button variant="link" className="ml-2 p-0 h-auto text-red-700 hover:text-red-900" onClick={loadBillingData}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No Data State
  if (!billingData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and billing information</p>
        </div>
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <CreditCard className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Billing Data</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Unable to load billing information. Please try again or contact support.
            </p>
            <Button onClick={loadBillingData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    subscription,
    usage,
    invoices = [],
    payments = [],
    available_plans = []
  } = billingData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and billing information</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncSubscription}
            disabled={isSyncing}
            className="border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            <Zap className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Subscription'}
          </Button>
        </div>
      </div>

      {/* Sync Message Alert */}
      {syncMessage && (
        <Alert className={`border-l-4 ${
          syncMessage.includes('success') ? 'border-l-green-500 bg-green-50' :
          syncMessage.includes('Error') || syncMessage.includes('Failed') ? 'border-l-red-500 bg-red-50' :
          'border-l-orange-500 bg-orange-50'
        }`}>
          <Zap className={`h-4 w-4 ${
            syncMessage.includes('success') ? 'text-green-600' :
            syncMessage.includes('Error') || syncMessage.includes('Failed') ? 'text-red-600' :
            'text-orange-600'
          }`} />
          <AlertDescription className={
            syncMessage.includes('success') ? 'text-green-800' :
            syncMessage.includes('Error') || syncMessage.includes('Failed') ? 'text-red-800' :
            'text-orange-800'
          }>
            {syncMessage}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
          <TabsList className="bg-gray-100/80">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white">
              <Crown className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-white">
              <Activity className="h-4 w-4 mr-2" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-white">
              <Receipt className="h-4 w-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-white">
              <Sparkles className="h-4 w-4 mr-2" />
              Plans
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleUpdatePaymentMethod}>
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Payment
            </Button>
            {(() => {
              const upgradeConfig = getUpgradeButtonConfig();
              return upgradeConfig.disabled ? (
                <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-2 text-sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {upgradeConfig.text}
                </Badge>
              ) : (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  onClick={() => setActiveTab('plans')}
                >
                  {upgradeConfig.showIcon && <ArrowUpCircle className="h-4 w-4 mr-2" />}
                  {upgradeConfig.text}
                </Button>
              );
            })()}
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Current Subscription Card */}
          <Card className="overflow-hidden border-0 shadow-lg">
            {(() => {
              // Use context subscription plan as primary source, fallback to billing data
              const currentPlan = subscriptionPlan || subscription?.plan_type || 'free';
              const planDisplayName = dbSubscription?.plan_name || subscription?.plan_name ||
                (currentPlan === 'premium' ? 'Premium' : currentPlan === 'pro' ? 'Professional' : 'Free');
              const planAmount = dbSubscription?.amount || subscription?.amount || 0;
              const planCurrency = dbSubscription?.currency || subscription?.currency || 'AED';
              const planStatus = dbSubscription?.status || subscription?.status || (currentPlan !== 'free' ? 'active' : 'free');
              const billingPeriod = dbSubscription?.billing_period || subscription?.billing_period || 'monthly';
              const periodEnd = dbSubscription?.end_date || subscription?.current_period_end;

              // Choose gradient based on plan
              const gradientClass = currentPlan === 'premium'
                ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500'
                : currentPlan === 'pro'
                ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500'
                : 'bg-gradient-to-r from-gray-500 via-gray-400 to-gray-300';

              return (
                <>
                  <div className={`${gradientClass} p-6 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Crown className="h-8 w-8" />
                        </div>
                        <div>
                          <p className="text-white/80 text-sm">Current Plan</p>
                          <h2 className="text-3xl font-bold">{planDisplayName}</h2>
                          {currentPlan !== 'free' && (
                            <Badge className="mt-1 bg-white/20 text-white border-white/30">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active Subscription
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-bold">
                          {currentPlan === 'free' ? 'Free' : formatCurrency(planAmount, planCurrency)}
                        </p>
                        {currentPlan !== 'free' && <p className="text-white/80">per {billingPeriod}</p>}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Status</p>
                        {getStatusBadge(planStatus)}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Billing Period</p>
                        <p className="font-medium capitalize">{billingPeriod}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Next Billing Date</p>
                        <p className="font-medium">{currentPlan === 'free' ? 'N/A' : formatDate(periodEnd)}</p>
                      </div>
                    </div>

                    {/* Features */}
                    {subscription?.features && subscription.features.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <p className="text-sm font-medium text-gray-900 mb-3">Included Features</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {subscription.features.slice(0, 8).map((feature, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              <span className="truncate">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </>
              );
            })()}
          </Card>

          {/* Usage Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{usage?.current_period?.maids_added || 0}</p>
                <p className="text-sm text-gray-500">Maid Profiles</p>
                {usage?.limits?.maids !== -1 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Usage</span>
                      <span>{usage?.current_period?.maids_added || 0} / {usage?.limits?.maids || 0}</span>
                    </div>
                    <Progress
                      value={getUsagePercentage(usage?.current_period?.maids_added || 0, usage?.limits?.maids || 1)}
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
                    <Briefcase className="h-5 w-5 text-green-600" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{usage?.current_period?.jobs_posted || 0}</p>
                <p className="text-sm text-gray-500">Jobs Posted</p>
                {usage?.limits?.jobs !== -1 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Usage</span>
                      <span>{usage?.current_period?.jobs_posted || 0} / {usage?.limits?.jobs || 0}</span>
                    </div>
                    <Progress
                      value={getUsagePercentage(usage?.current_period?.jobs_posted || 0, usage?.limits?.jobs || 1)}
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{usage?.current_period?.messages_sent || 0}</p>
                <p className="text-sm text-gray-500">Messages Sent</p>
                {usage?.limits?.messages_per_month !== -1 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Usage</span>
                      <span>{usage?.current_period?.messages_sent || 0} / {usage?.limits?.messages_per_month || '∞'}</span>
                    </div>
                    <Progress
                      value={getUsagePercentage(usage?.current_period?.messages_sent || 0, usage?.limits?.messages_per_month || 1)}
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:scale-110 transition-transform">
                    <Eye className="h-5 w-5 text-orange-600" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{usage?.current_period?.profile_views || 0}</p>
                <p className="text-sm text-gray-500">Profile Views</p>
                <p className="text-xs text-gray-400 mt-3">This billing period</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments */}
          <Card>
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Recent Payments</CardTitle>
                    <CardDescription>Your latest transactions</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('invoices')}>
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="p-3 bg-gray-100 rounded-full mb-3">
                    <Receipt className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No payments found</p>
                  <p className="text-sm text-gray-400">Your payment history will appear here</p>
                </div>
              ) : (
                <div className="divide-y">
                  {payments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <CreditCard className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.description || 'Subscription Payment'}</p>
                          <p className="text-sm text-gray-500">{formatDate(payment.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</p>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          {/* Billing Period Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">Current Billing Period</p>
                  <p className="text-sm text-blue-700">
                    {formatDate(usage?.current_period?.period_start)} - {formatDate(usage?.current_period?.period_end || subscription?.current_period_end)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Current Usage
                </CardTitle>
                <CardDescription>Track your resource consumption this billing period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Maid Profiles */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Maid Profiles</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {usage?.current_period?.maids_added || 0}
                      {usage?.limits?.maids !== -1 && <span className="text-gray-400"> / {usage?.limits?.maids}</span>}
                    </span>
                  </div>
                  <Progress
                    value={getUsagePercentage(usage?.current_period?.maids_added || 0, usage?.limits?.maids || 1)}
                    className={`h-2 ${getUsageColor(getUsagePercentage(usage?.current_period?.maids_added || 0, usage?.limits?.maids || 1))}`}
                  />
                </div>

                {/* Jobs Posted */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Jobs Posted</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {usage?.current_period?.jobs_posted || 0}
                      {usage?.limits?.jobs !== -1 && <span className="text-gray-400"> / {usage?.limits?.jobs}</span>}
                    </span>
                  </div>
                  <Progress
                    value={getUsagePercentage(usage?.current_period?.jobs_posted || 0, usage?.limits?.jobs || 1)}
                    className="h-2"
                  />
                </div>

                {/* Storage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Storage</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {usage?.current_period?.storage_used_gb || 0} GB
                      {usage?.limits?.storage_gb !== -1 && <span className="text-gray-400"> / {usage?.limits?.storage_gb} GB</span>}
                    </span>
                  </div>
                  <Progress
                    value={getUsagePercentage(usage?.current_period?.storage_used_gb || 0, usage?.limits?.storage_gb || 1)}
                    className="h-2"
                  />
                </div>

                {/* Active Users */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Team Members</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {usage?.current_period?.active_users || 1}
                      {usage?.limits?.users !== -1 && <span className="text-gray-400"> / {usage?.limits?.users}</span>}
                    </span>
                  </div>
                  <Progress
                    value={getUsagePercentage(usage?.current_period?.active_users || 1, usage?.limits?.users || 1)}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Plan Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Plan Limits
                </CardTitle>
                <CardDescription>Your current plan allocations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Maid Profiles</span>
                  </div>
                  <Badge variant="secondary">
                    {usage?.limits?.maids === -1 ? 'Unlimited' : usage?.limits?.maids || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Job Postings</span>
                  </div>
                  <Badge variant="secondary">
                    {usage?.limits?.jobs === -1 ? 'Unlimited' : usage?.limits?.jobs || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Messages / Month</span>
                  </div>
                  <Badge variant="secondary">
                    {usage?.limits?.messages_per_month === -1 ? 'Unlimited' : (usage?.limits?.messages_per_month || 0).toLocaleString()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Storage</span>
                  </div>
                  <Badge variant="secondary">
                    {usage?.limits?.storage_gb === -1 ? 'Unlimited' : `${usage?.limits?.storage_gb || 0} GB`}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Team Members</span>
                  </div>
                  <Badge variant="secondary">
                    {usage?.limits?.users === -1 ? 'Unlimited' : usage?.limits?.users || 1}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upgrade CTA - Only show if not on Premium plan */}
          {!isOnPlan('premium') && (
            <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Sparkles className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {isOnPlan('pro') ? 'Unlock Premium Features' : 'Need more resources?'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {isOnPlan('pro')
                          ? 'Upgrade to Premium for unlimited resources, priority support, and exclusive features.'
                          : 'Upgrade your plan to unlock higher limits and premium features.'}
                      </p>
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600" onClick={() => setActiveTab('plans')}>
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    {isOnPlan('pro') ? 'Upgrade to Premium' : 'View Plans'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {isOnPlan('premium') && (
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Crown className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Premium Plan Active</h3>
                      <p className="text-sm text-gray-600">You have access to all premium features and unlimited resources.</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-4 py-2">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Premium Member
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>View and download your past invoices</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">{invoices.length} invoices</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Receipt className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Your invoices will appear here once you make your first payment.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${invoice.status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                          <Receipt className={`h-5 w-5 ${invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <p className="text-sm text-gray-500">{invoice.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span>Issued: {formatDate(invoice.issued_date)}</span>
                            {invoice.paid_date && <span>Paid: {formatDate(invoice.paid_date)}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          {invoice.status === 'paid' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-500 hover:text-gray-700"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsRefundDialogOpen(true);
                              }}
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Need help with billing?</p>
                  <p className="text-sm text-blue-700">
                    Contact our support team at support@ethiomaids.com for any billing questions or concerns.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose the Perfect Plan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Select a plan that fits your agency's needs. Upgrade anytime to unlock more features and resources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {available_plans.map((plan) => {
              const isCurrent = plan.name.toLowerCase() === subscription?.plan_name?.toLowerCase() ||
                               plan.id === subscription?.plan_type;

              return (
                <Card
                  key={plan.id}
                  className={`relative transition-all duration-300 hover:shadow-xl ${
                    plan.popular ? 'ring-2 ring-orange-500 scale-105' : ''
                  } ${isCurrent ? 'ring-2 ring-green-500 bg-green-50/30' : ''}`}
                >
                  {plan.popular && !isCurrent && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 shadow-lg">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-600 text-white px-4 py-1 shadow-lg">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Current Plan
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pt-8 pb-4">
                    <CardTitle className="text-xl mb-1">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">{formatCurrency(plan.price)}</span>
                      <span className="text-gray-500">/{plan.interval}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-6">
                      {(plan.features || []).map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Plan Limits Summary */}
                    {plan.limits && (
                      <div className="p-3 bg-gray-50 rounded-lg mb-4 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Maids</span>
                          <span className="font-medium">{plan.limits.maids === -1 ? 'Unlimited' : plan.limits.maids}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Jobs</span>
                          <span className="font-medium">{plan.limits.jobs === -1 ? 'Unlimited' : plan.limits.jobs}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Storage</span>
                          <span className="font-medium">{plan.limits.storage_gb === -1 ? 'Unlimited' : `${plan.limits.storage_gb} GB`}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      className={`w-full ${
                        isCurrent
                          ? 'bg-gray-100 text-gray-500 cursor-default'
                          : plan.popular
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                          : ''
                      }`}
                      variant={isCurrent ? 'secondary' : plan.popular ? 'default' : 'outline'}
                      disabled={isCurrent}
                      onClick={() => {
                        if (!isCurrent) {
                          alert(`To upgrade to ${plan.name}, please contact support or complete checkout.`);
                        }
                      }}
                    >
                      {isCurrent ? 'Current Plan' : plan.price > (subscription?.amount || 0) ? 'Upgrade' : 'Switch'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ or Contact */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-6 text-center">
              <h3 className="font-medium text-gray-900 mb-2">Need a custom plan?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Contact us for enterprise pricing and custom solutions tailored to your agency's needs.
              </p>
              <Button variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Method Dialog */}
      <Dialog open={isPaymentMethodDialogOpen} onOpenChange={setIsPaymentMethodDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle>Update Payment Method</DialogTitle>
                <DialogDescription>Add or update your payment information</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-name">Cardholder Name</Label>
              <Input
                id="card-name"
                value={paymentMethodForm.name}
                onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                value={paymentMethodForm.card_number}
                onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, card_number: e.target.value }))}
                placeholder="1234 5678 9012 3456"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={paymentMethodForm.expiry_month} onValueChange={(value) => setPaymentMethodForm(prev => ({ ...prev, expiry_month: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                        {(i + 1).toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={paymentMethodForm.expiry_year} onValueChange={(value) => setPaymentMethodForm(prev => ({ ...prev, expiry_year: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(10)].map((_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  value={paymentMethodForm.cvc}
                  onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, cvc: e.target.value }))}
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsPaymentMethodDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePaymentMethod}
              disabled={!paymentMethodForm.name || !paymentMethodForm.card_number}
            >
              Update Payment Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Request Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <DialogTitle>Request Refund</DialogTitle>
                <DialogDescription>
                  {selectedInvoice && `Request refund for ${selectedInvoice.invoice_number}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for refund</Label>
              <Select value={refundForm.reason} onValueChange={(value) => setRefundForm(prev => ({ ...prev, reason: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billing_error">Billing Error</SelectItem>
                  <SelectItem value="service_issue">Service Issue</SelectItem>
                  <SelectItem value="duplicate_charge">Duplicate Charge</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional details</Label>
              <Textarea
                value={refundForm.details}
                onChange={(e) => setRefundForm(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Please provide additional details about your refund request..."
                rows={4}
              />
            </div>

            {selectedInvoice && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Refund Amount:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Refunds typically take 3-5 business days to process
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestRefund}
              disabled={!refundForm.reason}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Submit Refund Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyBillingPage;
