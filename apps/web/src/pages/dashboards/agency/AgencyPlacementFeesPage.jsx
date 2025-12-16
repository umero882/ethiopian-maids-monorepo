import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { placementFeesService } from '@/services/placementFeesService.graphql';
import { placementFeePaymentService } from '@/services/placementFeePaymentService';
import { PLACEMENT_FEE_AMOUNTS } from '@/config/stripeConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Wallet,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertCircle,
  FileText,
  User,
  MapPin,
  Calendar,
  RefreshCw,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Building2,
  Sparkles,
  ChevronRight,
  Info,
  Plus,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Check,
  CreditCardIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AgencyPlacementFeesPage = () => {
  const { user } = useAuth();
  const agencyId = user?.id;

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data state
  const [credits, setCredits] = useState(null);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [releasedFees, setReleasedFees] = useState(0);
  const [feeTransactions, setFeeTransactions] = useState([]);
  const [activePlacements, setActivePlacements] = useState([]);
  const [creditHistory, setCreditHistory] = useState([]);

  // Dialog state
  const [showVisaApprovalDialog, setShowVisaApprovalDialog] = useState(false);
  const [showMaidReturnDialog, setShowMaidReturnDialog] = useState(false);
  const [showAddFeeDialog, setShowAddFeeDialog] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [addFeeAmount, setAddFeeAmount] = useState(500);
  const [addFeeNotes, setAddFeeNotes] = useState('');
  const [addingFee, setAddingFee] = useState(false);

  // Payment success state
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  // Constants
  const MINIMUM_BALANCE = 500;
  const DEFAULT_CURRENCY = 'AED';
  const AVAILABLE_AMOUNTS = PLACEMENT_FEE_AMOUNTS; // [500, 1000, 2000, 5000]

  // Computed values
  const currentBalance = credits?.available_credits || 0;
  const hasLowBalance = currentBalance < MINIMUM_BALANCE;
  const hasZeroBalance = currentBalance === 0;

  // Load all dashboard data from Hasura
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await placementFeesService.getPlacementFeesDashboard(agencyId);

      if (fetchError) {
        console.error('Failed to load dashboard:', fetchError);
        setError(fetchError.message || 'Failed to load placement fees data');
        return;
      }

      if (data) {
        setCredits(data.credits);
        setEscrowBalance(data.escrowBalance);
        setReleasedFees(data.releasedFees);
        setFeeTransactions(data.feeTransactions || []);
        setActivePlacements(data.activePlacements || []);
      }

      // Load credit history separately
      const { data: history } = await placementFeesService.getCreditHistory(agencyId);
      setCreditHistory(history || []);

    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to load placement fees data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agencyId) {
      loadDashboardData();
    }
  }, [agencyId]);

  // Check for pending payments after returning from Stripe
  useEffect(() => {
    const checkPayment = async () => {
      if (!agencyId) return;

      setPaymentProcessing(true);
      try {
        const result = await placementFeePaymentService.checkPendingPayment(agencyId);

        if (result.hasPending && result.wasSuccessful) {
          // Payment was auto-confirmed via URL params - show success message and refresh data
          setPaymentSuccess({
            amount: result.data.amount,
            currency: result.data.currency,
            message: `Successfully added ${placementFeePaymentService.formatAmount(result.data.amount)} to your wallet!`,
          });
          setPendingPayment(null);
          // Refresh dashboard data to show updated balance
          await loadDashboardData();
        } else if (result.hasPending && result.wasCancelled) {
          // Payment was cancelled
          setPendingPayment(null);
          console.log('Payment was cancelled');
        } else if (result.hasPending && result.isPending && result.data) {
          // There's a pending payment - show confirmation UI
          setPendingPayment(result.data);
        }
      } catch (err) {
        console.error('Error checking payment:', err);
      } finally {
        setPaymentProcessing(false);
      }
    };

    checkPayment();

    // Also check for last successful payment info
    const lastSuccess = placementFeePaymentService.getLastSuccessfulPayment();
    if (lastSuccess) {
      setPaymentSuccess({
        amount: lastSuccess.amount,
        currency: lastSuccess.currency,
        message: `Successfully added ${placementFeePaymentService.formatAmount(lastSuccess.amount)} to your wallet!`,
      });
    }
  }, [agencyId]);

  // Handle confirming a pending payment (user completed Stripe payment and returned)
  const handleConfirmPendingPayment = async () => {
    if (!pendingPayment || !agencyId) {
      console.error('Missing pendingPayment or agencyId', { pendingPayment, agencyId });
      setError('Missing payment information. Please try again.');
      return;
    }

    console.log('Confirming payment:', { agencyId, amount: pendingPayment.amount });
    setConfirmingPayment(true);
    setError(null);

    try {
      const result = await placementFeePaymentService.processSuccessfulPayment(
        agencyId,
        pendingPayment.amount,
        pendingPayment.currency || 'AED'
      );

      console.log('Payment confirmation result:', result);

      if (result.success) {
        setPaymentSuccess({
          amount: pendingPayment.amount,
          currency: pendingPayment.currency || 'AED',
          message: `Successfully added ${formatCurrency(pendingPayment.amount)} to your wallet!`,
        });
        placementFeePaymentService.clearPendingPayment();
        setPendingPayment(null);
        await loadDashboardData();
      } else {
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Failed to confirm payment. Please try again.';
        console.error('Payment confirmation failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Payment confirmation exception:', err);
      setError(err.message || 'Failed to confirm payment');
    } finally {
      setConfirmingPayment(false);
    }
  };

  // Handle cancelling a pending payment
  const handleCancelPendingPayment = () => {
    placementFeePaymentService.clearPendingPayment();
    setPendingPayment(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  // Handle adding placement fee via Stripe
  const handleAddPlacementFee = async () => {
    if (!agencyId || addFeeAmount <= 0) return;

    // Validate amount is one of the available options
    if (!AVAILABLE_AMOUNTS.includes(addFeeAmount)) {
      setError(`Please select a valid amount: ${AVAILABLE_AMOUNTS.join(', ')} AED`);
      return;
    }

    try {
      setAddingFee(true);

      // Initiate Stripe payment
      const result = placementFeePaymentService.openPaymentWindow(agencyId, addFeeAmount);

      if (!result.success) {
        setError(result.error || 'Failed to initiate payment');
        setAddingFee(false);
        return;
      }

      // If we reach here, user will be redirected to Stripe
      // The dialog will close and balance will be updated after return
      setShowAddFeeDialog(false);
      setAddFeeAmount(500);
      setAddFeeNotes('');
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
      setAddingFee(false);
    }
  };

  // Handle manual balance update (for admin/testing purposes)
  const handleManualBalanceUpdate = async () => {
    if (!agencyId || addFeeAmount <= 0) return;

    try {
      setAddingFee(true);
      const { data, error: addError } = await placementFeesService.addPlacementFee(
        agencyId,
        parseFloat(addFeeAmount),
        DEFAULT_CURRENCY,
        addFeeNotes || 'Manual balance update'
      );

      if (addError) {
        setError(addError.message || 'Failed to add placement fee');
        return;
      }

      // Success - close dialog and refresh data
      setShowAddFeeDialog(false);
      setAddFeeAmount(500);
      setAddFeeNotes('');
      setPaymentSuccess({
        amount: addFeeAmount,
        currency: DEFAULT_CURRENCY,
        message: `Successfully added ${formatCurrency(addFeeAmount)} to your wallet!`,
      });
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to add placement fee');
    } finally {
      setAddingFee(false);
    }
  };

  // Handle visa approval
  const handleVisaApproval = async () => {
    if (!selectedPlacement) return;

    try {
      setProcessing(true);
      const { error: processError } = await placementFeesService.processVisaApproval(agencyId, selectedPlacement.id);

      if (processError) {
        setError(processError.message || 'Failed to process visa approval');
        return;
      }

      setShowVisaApprovalDialog(false);
      setSelectedPlacement(null);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to process visa approval');
    } finally {
      setProcessing(false);
    }
  };

  // Handle maid return
  const handleMaidReturn = async () => {
    if (!selectedPlacement) return;

    try {
      setProcessing(true);
      const { error: processError } = await placementFeesService.processMaidReturn(agencyId, selectedPlacement.id, returnReason);

      if (processError) {
        setError(processError.message || 'Failed to process maid return');
        return;
      }

      setShowMaidReturnDialog(false);
      setSelectedPlacement(null);
      setReturnReason('');
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to process maid return');
    } finally {
      setProcessing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Status badge helpers
  const getFeeStatusBadge = (status) => {
    const statusConfig = {
      escrow: { label: 'In Escrow', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      released: { label: 'Released', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      credited: { label: 'Credited', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Wallet },
      refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: ArrowRight }
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border px-2 py-1 text-xs font-medium`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getVisaStatusBadge = (status) => {
    const statusConfig = {
      pending_visa: { label: 'Pending Visa', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      visa_approved: { label: 'Visa Approved', color: 'bg-green-100 text-green-800 border-green-200' },
      visa_rejected: { label: 'Visa Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
      maid_returned: { label: 'Maid Returned', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      contract_completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    };

    const config = statusConfig[status] || { label: status || 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-200' };

    return (
      <Badge className={`${config.color} border px-2 py-1 text-xs font-medium`}>
        {config.label}
      </Badge>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Placement Fees</h1>
          <p className="text-gray-600 mt-1">
            Track 500 AED placement fees, escrow status, and credit balance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAddFeeDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Placement Fee
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Low/Zero Balance Warning */}
      {!loading && hasLowBalance && (
        <Alert className={`border-2 ${hasZeroBalance ? 'border-red-300 bg-red-50' : 'border-orange-300 bg-orange-50'}`}>
          <AlertTriangle className={`h-5 w-5 ${hasZeroBalance ? 'text-red-600' : 'text-orange-600'}`} />
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-semibold ${hasZeroBalance ? 'text-red-800' : 'text-orange-800'}`}>
              {hasZeroBalance ? 'No Balance - Action Required!' : 'Low Balance Warning'}
            </h3>
            <AlertDescription className={`mt-1 ${hasZeroBalance ? 'text-red-700' : 'text-orange-700'}`}>
              {hasZeroBalance ? (
                <>
                  Your wallet balance is <span className="font-bold">0.00 AED</span>.
                  To connect with sponsors and process placements, you need to maintain a minimum balance of{' '}
                  <span className="font-bold">500 AED</span> in your wallet.
                  <span className="block mt-1 text-sm">
                    Without sufficient balance, sponsors won't be able to contact you for new placements.
                  </span>
                </>
              ) : (
                <>
                  Your balance is below the recommended minimum of <span className="font-bold">500 AED</span>.
                  Current balance: <span className="font-bold">{formatCurrency(currentBalance)}</span>.
                  Add funds to ensure uninterrupted placement services.
                </>
              )}
            </AlertDescription>
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => setShowAddFeeDialog(true)}
                className={hasZeroBalance ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}
              >
                <Plus className="h-4 w-4 mr-2" />
                {hasZeroBalance ? 'Add 500 AED Now' : 'Top Up Balance'}
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Pending Payment Alert - User returned from Stripe */}
      {pendingPayment && (
        <Alert className="border-2 border-purple-300 bg-purple-50">
          <CreditCardIcon className="h-5 w-5 text-purple-600" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-purple-800">
              Complete Your Payment
            </h3>
            <AlertDescription className="mt-1 text-purple-700">
              You have a pending payment of <strong>{formatCurrency(pendingPayment.amount)}</strong>.
              If you completed the payment on Stripe, click "Confirm Payment" to update your balance.
            </AlertDescription>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={handleConfirmPendingPayment}
                disabled={confirmingPayment}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {confirmingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Payment
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelPendingPayment}
                disabled={confirmingPayment}
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Payment Success Alert */}
      {paymentSuccess && (
        <Alert className="border-2 border-green-300 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-green-800">Payment Successful!</h3>
            <AlertDescription className="mt-1 text-green-700">
              {paymentSuccess.message}
            </AlertDescription>
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-100"
                onClick={() => setPaymentSuccess(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Payment Processing Indicator */}
      {paymentProcessing && (
        <Alert className="border-2 border-blue-300 bg-blue-50">
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-blue-800">Processing Payment...</h3>
            <AlertDescription className="mt-1 text-blue-700">
              Please wait while we verify your payment and update your balance.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="link" size="sm" className="p-0 h-auto text-red-700" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credits Available */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-100 to-transparent rounded-bl-full opacity-50" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">
                Credits Available
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(credits?.available_credits || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <Sparkles className="h-3 w-3 mr-1" />
              Auto-applies to next placement
            </p>
          </CardContent>
        </Card>

        {/* Fees in Escrow */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-100 to-transparent rounded-bl-full opacity-50" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">
                Fees in Escrow
              </CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {formatCurrency(escrowBalance)}
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <Info className="h-3 w-3 mr-1" />
              Pending visa approvals
            </p>
          </CardContent>
        </Card>

        {/* Total Paid (30 Days) */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-transparent rounded-bl-full opacity-50" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">
                Released (30 Days)
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(releasedFees)}
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Successfully completed placements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b pb-4">
          <TabsList className="bg-gray-100/80">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white">
              <Building2 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="fee-history" className="data-[state=active]:bg-white">
              <History className="h-4 w-4 mr-2" />
              Fee History
            </TabsTrigger>
            <TabsTrigger value="credits" className="data-[state=active]:bg-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="active-placements" className="data-[state=active]:bg-white">
              <FileText className="h-4 w-4 mr-2" />
              Active Placements
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Placements Summary */}
            <Card>
              <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Active Placements</CardTitle>
                      <CardDescription>Placements awaiting visa approval</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{activePlacements.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {activePlacements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="p-3 bg-gray-100 rounded-full mb-3">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No active placements</p>
                    <p className="text-sm text-gray-400">New placements will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {activePlacements.slice(0, 5).map((placement) => (
                      <div key={placement.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {placement.maid?.full_name || 'Unknown Maid'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {placement.sponsor?.full_name || 'Unknown Sponsor'} • {formatDate(placement.created_at)}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          {getVisaStatusBadge(placement.fee_transaction?.visa_status || placement.status)}
                          <div className="text-sm font-medium text-gray-600">
                            {formatCurrency(placement.fee_transaction?.fee_amount || 500)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activePlacements.length > 5 && (
                  <div className="p-3 border-t bg-gray-50">
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab('active-placements')}>
                      View All ({activePlacements.length})
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Fee Transactions */}
            <Card>
              <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Recent Transactions</CardTitle>
                      <CardDescription>Latest placement fee activity</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{feeTransactions.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {feeTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="p-3 bg-gray-100 rounded-full mb-3">
                      <DollarSign className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No transactions yet</p>
                    <p className="text-sm text-gray-400">Fee transactions will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {feeTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {transaction.maid?.full_name || 'Unknown Maid'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(transaction.deducted_at || transaction.created_at)}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          {getFeeStatusBadge(transaction.fee_status)}
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(transaction.fee_amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {feeTransactions.length > 5 && (
                  <div className="p-3 border-t bg-gray-50">
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab('fee-history')}>
                      View All ({feeTransactions.length})
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{activePlacements.length}</div>
                  <div className="text-sm text-gray-600">Pending Visas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {feeTransactions.filter(t => t.fee_status === 'released').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {feeTransactions.filter(t => t.fee_status === 'credited').length}
                  </div>
                  <div className="text-sm text-gray-600">Credited</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{feeTransactions.length}</div>
                  <div className="text-sm text-gray-600">Total Transactions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee History Tab */}
        <TabsContent value="fee-history">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <History className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>All Fee Transactions</CardTitle>
                  <CardDescription>Complete history of 500 AED placement fees</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {feeTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <History className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No fee transactions yet</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    When you process placements, the fee transactions will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Date</TableHead>
                        <TableHead>Maid</TableHead>
                        <TableHead>Sponsor</TableHead>
                        <TableHead className="text-right">Fee Amount</TableHead>
                        <TableHead className="text-right">Credits Used</TableHead>
                        <TableHead className="text-right">Charged</TableHead>
                        <TableHead>Fee Status</TableHead>
                        <TableHead>Visa Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-gray-50">
                          <TableCell className="whitespace-nowrap">
                            {formatDate(transaction.deducted_at || transaction.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{transaction.maid?.full_name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{transaction.maid?.nationality}</div>
                          </TableCell>
                          <TableCell>
                            <div>{transaction.sponsor?.full_name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{transaction.sponsor?.city}</div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(transaction.fee_amount)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(transaction.credits_applied || 0)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(transaction.amount_charged)}
                          </TableCell>
                          <TableCell>{getFeeStatusBadge(transaction.fee_status)}</TableCell>
                          <TableCell>{getVisaStatusBadge(transaction.visa_status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-6">
          {/* Credit Balance Card */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <CreditCard className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Credit Balance</p>
                    <h2 className="text-3xl font-bold">{formatCurrency(credits?.available_credits || 0)}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm">Auto-apply</p>
                  <Badge className={`mt-1 ${credits?.auto_apply_credits ? 'bg-white/20' : 'bg-white/10'}`}>
                    {credits?.auto_apply_credits ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <CardDescription className="mb-4">
                Credits from returned maids auto-apply to new placements
              </CardDescription>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-sm text-gray-500 mb-1">Total Earned</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(credits?.total_credits || 0)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-sm text-gray-500 mb-1">Available</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(credits?.available_credits || 0)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-sm text-gray-500 mb-1">Reserved</div>
                  <div className="text-xl font-bold text-gray-600">
                    {formatCurrency(credits?.reserved_credits || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Transaction History */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <History className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Credit History</CardTitle>
                  <CardDescription>Earned and used credits</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {creditHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No credit transactions yet</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Credits are earned when maids are returned before visa approval.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {creditHistory.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${transaction.type === 'earned' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {transaction.type === 'earned' ? (
                            <ArrowDownRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium capitalize text-gray-900">
                            {transaction.type}: {transaction.reason}
                          </div>
                          <div className="text-sm text-gray-500">{formatDate(transaction.timestamp)}</div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'earned' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Placements Tab */}
        <TabsContent value="active-placements">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FileText className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Active Placements</CardTitle>
                    <CardDescription>Manage placements pending visa approval</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">{activePlacements.length} placements</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activePlacements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active placements</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Placements awaiting visa approval will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {activePlacements.map((placement) => (
                    <div key={placement.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Maid Details */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-700">Maid Details</span>
                          </div>
                          <div className="pl-6 space-y-1">
                            <div className="font-semibold text-gray-900">
                              {placement.maid?.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {placement.maid?.nationality || 'N/A'}
                            </div>
                            {placement.maid?.date_of_birth && (
                              <div className="text-xs text-gray-400">
                                Born: {formatDate(placement.maid.date_of_birth)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sponsor Details */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-700">Sponsor Details</span>
                          </div>
                          <div className="pl-6 space-y-1">
                            <div className="font-semibold text-gray-900">
                              {placement.sponsor?.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {[placement.sponsor?.city, placement.sponsor?.country].filter(Boolean).join(', ') || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Fee & Status */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Wallet className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-700">Fee Status</span>
                          </div>
                          <div className="pl-6 space-y-2">
                            <div className="text-xl font-bold text-gray-900">
                              {formatCurrency(placement.fee_transaction?.fee_amount || 500)}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {getFeeStatusBadge(placement.fee_transaction?.fee_status || 'escrow')}
                              {getVisaStatusBadge(placement.fee_transaction?.visa_status || placement.status)}
                            </div>
                          </div>
                        </div>

                        {/* Dates */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-700">Timeline</span>
                          </div>
                          <div className="pl-6 space-y-1">
                            <div className="text-sm text-gray-600">
                              <span className="text-gray-500">Created:</span> {formatDate(placement.created_at)}
                            </div>
                            {placement.visa_application_date && (
                              <div className="text-sm text-gray-600">
                                <span className="text-gray-500">Visa App:</span> {formatDate(placement.visa_application_date)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {(placement.contract_status === 'pending_visa' || placement.status === 'pending_visa' || placement.status === 'active') && (
                        <div className="mt-4 pt-4 border-t flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedPlacement(placement);
                              setShowVisaApprovalDialog(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Visa Approved
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            onClick={() => {
                              setSelectedPlacement(placement);
                              setShowMaidReturnDialog(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Mark Maid Returned
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Visa Approval Dialog */}
      <Dialog open={showVisaApprovalDialog} onOpenChange={setShowVisaApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle>Confirm Visa Approval</DialogTitle>
                <DialogDescription>
                  This will release the placement fee to platform revenue
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedPlacement && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-500">Maid:</span>
                <span className="font-medium">{selectedPlacement.maid?.full_name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sponsor:</span>
                <span className="font-medium">{selectedPlacement.sponsor?.full_name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-500">Fee Amount:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(selectedPlacement.fee_transaction?.fee_amount || 500)}
                </span>
              </div>
            </div>
          )}
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This action cannot be undone. The fee will be permanently released.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVisaApprovalDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleVisaApproval} disabled={processing} className="bg-green-600 hover:bg-green-700">
              {processing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Approval'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maid Return Dialog */}
      <Dialog open={showMaidReturnDialog} onOpenChange={setShowMaidReturnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <XCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <DialogTitle>Mark Maid as Returned</DialogTitle>
                <DialogDescription>
                  The fee will be converted to credit for your next placement
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedPlacement && (
            <div className="space-y-4">
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-500">Maid:</span>
                  <span className="font-medium">{selectedPlacement.maid?.full_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-500">Credit Amount:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(selectedPlacement.fee_transaction?.fee_amount || 500)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Return Reason (Optional)</label>
                <Textarea
                  placeholder="Why did the maid return?"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              The fee will be added to your credits and auto-applied to your next placement.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMaidReturnDialog(false);
                setReturnReason('');
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleMaidReturn} disabled={processing} className="bg-orange-600 hover:bg-orange-700">
              {processing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Return'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Placement Fee Dialog */}
      <Dialog open={showAddFeeDialog} onOpenChange={setShowAddFeeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCardIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle>Add Placement Fee</DialogTitle>
                <DialogDescription>
                  Pay securely via Stripe to add funds to your wallet
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Balance Display */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Current Balance</span>
                <span className={`text-xl font-bold ${currentBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(currentBalance)}
                </span>
              </div>
              {hasLowBalance && (
                <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Recommended minimum: {formatCurrency(MINIMUM_BALANCE)}
                </div>
              )}
            </div>

            {/* Amount Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Select Amount (AED)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={addFeeAmount === amount ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => setAddFeeAmount(amount)}
                    className={`h-16 flex flex-col items-center justify-center ${
                      addFeeAmount === amount
                        ? 'bg-green-600 hover:bg-green-700 border-green-600'
                        : 'hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <span className="text-lg font-bold">{amount.toLocaleString()}</span>
                    <span className="text-xs opacity-80">AED</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount to Pay:</span>
                  <span className="font-medium text-green-700">{formatCurrency(addFeeAmount)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-green-200">
                  <span className="text-gray-700 font-medium">New Balance:</span>
                  <span className="font-bold text-green-700 text-lg">
                    {formatCurrency(currentBalance + addFeeAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <svg className="h-6 w-6" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#635BFF" d="M13.976 13.176c0-.822.691-1.133 1.822-1.133 1.629 0 3.684.495 5.313 1.378V8.947c-1.778-.707-3.542-.987-5.313-.987-4.347 0-7.236 2.271-7.236 6.067 0 5.92 8.151 4.978 8.151 7.529 0 .973-.849 1.284-2.036 1.284-1.76 0-4.013-.724-5.795-1.698v4.542c1.973.849 3.969 1.209 5.795 1.209 4.453 0 7.516-2.204 7.516-6.053-.014-6.391-8.218-5.262-8.218-7.664z"/>
                </svg>
                <span>Secure payment via Stripe</span>
              </div>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              You'll be redirected to Stripe checkout. After successful payment, your balance will be <strong>automatically updated</strong>.
            </AlertDescription>
          </Alert>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddFeeDialog(false);
                setAddFeeAmount(500);
                setAddFeeNotes('');
              }}
              disabled={addingFee}
              className="sm:w-auto w-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPlacementFee}
              disabled={addingFee || !AVAILABLE_AMOUNTS.includes(addFeeAmount)}
              className="bg-green-600 hover:bg-green-700 sm:w-auto w-full"
            >
              {addingFee ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Pay {formatCurrency(addFeeAmount)}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyPlacementFeesPage;
