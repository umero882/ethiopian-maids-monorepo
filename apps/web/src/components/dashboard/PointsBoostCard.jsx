import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sparkles,
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import subscriptionService from '@/services/subscriptionService';
import { calculateStepPoints } from '@/lib/profileCompletion';
import { format } from 'date-fns';

const PAID_PLANS = subscriptionService.getPaidBoostPlans();

const PointsBoostCard = () => {
  const { user } = useAuth();
  const { pointsBoost, activatePointsBoost, purchasePointsBoost, activatePaidBoost, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [stepPoints, setStepPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [purchasing, setPurchasing] = useState(null); // planKey being purchased
  const [showPurchase, setShowPurchase] = useState(false);

  // Handle Stripe success redirect: activate paid boost subscription record
  useEffect(() => {
    const boostSuccess = searchParams.get('boost_success');
    const planKey = searchParams.get('plan');
    if (boostSuccess === 'true' && planKey) {
      // Clear URL params
      searchParams.delete('boost_success');
      searchParams.delete('plan');
      setSearchParams(searchParams, { replace: true });
      // Activate the paid boost subscription record in DB
      activatePaidBoost(planKey);
    }
  }, [searchParams, setSearchParams, activatePaidBoost]);

  // Fetch profile and calculate step-based points
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const profile = await subscriptionService.getProfileForPoints(user.id);
        if (profile) {
          setStepPoints(calculateStepPoints(profile));
        } else {
          setStepPoints(calculateStepPoints(null));
        }
      } catch (err) {
        console.error('Failed to fetch profile for points:', err);
        setStepPoints(calculateStepPoints(null));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const totalPoints = stepPoints ? stepPoints.totalEarned + stepPoints.bonusEarned : 0;
  const maxPoints = stepPoints ? stepPoints.totalPossible + stepPoints.bonusPossible : 1000;
  const days = totalPoints / 100;
  const isEligible = totalPoints >= 100; // At least 100 points = 1 day

  const handleActivate = async () => {
    setActivating(true);
    try {
      const breakdown = stepPoints ? {
        steps: stepPoints.steps.map(s => ({ key: s.key, label: s.label, earned: s.earned, max: s.points })),
        bonus: stepPoints.bonus.filter(b => b.earned > 0).map(b => ({ key: b.key, label: b.label, earned: b.earned })),
      } : {};
      await activatePointsBoost(totalPoints, breakdown);
      setConfirmOpen(false);
    } finally {
      setActivating(false);
    }
  };

  const handlePurchase = async (planKey) => {
    setPurchasing(planKey);
    try {
      await purchasePointsBoost(planKey);
      // User will be redirected to Stripe Checkout
    } finally {
      setPurchasing(null);
    }
  };

  const getCardState = () => {
    if (pointsBoost?.status === 'active') return 'active';
    if (pointsBoost?.status === 'expired') return 'expired';
    if (!isEligible) return 'not_eligible';
    return 'available';
  };

  const cardState = getCardState();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-t-lg">
          <div className="h-6 bg-amber-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
    >
      <Card className="overflow-hidden border-amber-200">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <CardTitle className="text-lg font-bold">Profile Points Boost</CardTitle>
            </div>
            {cardState === 'active' && (
              <Badge className="bg-green-500 hover:bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
            {cardState === 'expired' && (
              <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                Expired
              </Badge>
            )}
          </div>
          <p className="text-amber-100 text-sm mt-1">
            Earn points by completing each onboarding step — 100 points = 1 free premium day
          </p>
        </CardHeader>

        <CardContent className="pt-6 space-y-5">
          {/* Total Points Summary */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-gray-500">Points Earned</span>
                </div>
                <p className="text-lg font-bold text-amber-600">{totalPoints}</p>
                <p className="text-xs text-gray-400">of {maxPoints}</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-gray-500">Premium Days</span>
                </div>
                <p className="text-lg font-bold text-green-600">{days.toFixed(1)}</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-gray-500">Steps Done</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {stepPoints?.steps.filter(s => s.completed).length || 0}/{stepPoints?.steps.length || 0}
                </p>
              </div>
            </div>
            {/* Overall progress */}
            <div className="mt-3">
              <Progress value={(totalPoints / maxPoints) * 100} className="h-2" />
            </div>
          </div>

          {/* Step-by-Step Breakdown (collapsible) */}
          <div>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
            >
              {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showBreakdown ? 'Hide' : 'Show'} Points Breakdown
            </button>

            {showBreakdown && stepPoints && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                {/* Required Steps */}
                {stepPoints.steps.map((step) => (
                  <div key={step.key} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-gray-50">
                    <div className="flex items-center gap-2">
                      {step.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${step.completed ? 'text-gray-700' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${step.earned === step.points ? 'text-green-600' : step.earned > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {step.earned}/{step.points}
                      </span>
                      <span className="text-xs text-gray-400">pts</span>
                    </div>
                  </div>
                ))}

                {/* Bonus section */}
                {stepPoints.bonus.length > 0 && (
                  <>
                    <div className="text-xs font-medium text-gray-500 mt-3 mb-1 px-3">BONUS POINTS</div>
                    {stepPoints.bonus.map((b) => (
                      <div key={b.key} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-yellow-50">
                        <div className="flex items-center gap-2">
                          {b.earned > 0 ? (
                            <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-amber-200 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${b.earned > 0 ? 'text-gray-700' : 'text-gray-500'}`}>
                            {b.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${b.earned > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {b.earned > 0 ? `+${b.earned}` : `0/${b.points}`}
                          </span>
                          <span className="text-xs text-gray-400">pts</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* State-specific content */}
          {cardState === 'available' && (
            <Button
              onClick={() => setConfirmOpen(true)}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold"
              disabled={subLoading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Activate Boost — {days.toFixed(1)} Days Free Premium
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {cardState === 'active' && pointsBoost && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Boost Active</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Days Remaining</span>
                  <p className="font-bold text-green-700">{pointsBoost.daysRemaining} days</p>
                </div>
                <div>
                  <span className="text-gray-500">Expires</span>
                  <p className="font-bold text-gray-700">
                    {pointsBoost.expiresAt ? format(new Date(pointsBoost.expiresAt), 'MMM dd, yyyy') : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {cardState === 'expired' && pointsBoost && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-600">Boost Expired</span>
              </div>
              <p className="text-sm text-gray-500">
                Your points boost expired on{' '}
                {pointsBoost.expiresAt ? format(new Date(pointsBoost.expiresAt), 'MMM dd, yyyy') : '—'}.
                Complete more of your profile and activate a new boost!
              </p>
              {isEligible && (
                <Button
                  onClick={() => setConfirmOpen(true)}
                  variant="outline"
                  className="w-full mt-3 border-amber-300 text-amber-700 hover:bg-amber-50"
                  disabled={subLoading}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Activate New Boost — {days.toFixed(1)} Days
                </Button>
              )}
            </div>
          )}

          {cardState === 'not_eligible' && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                Complete more onboarding steps to earn at least 100 points (1 premium day).
                You currently have <strong>{totalPoints} points</strong>.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/maid/profile')}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Complete Your Profile
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Paid Boost Purchase Section — shown when expired, active (extend), or not eligible */}
          {(cardState === 'expired' || cardState === 'active' || cardState === 'not_eligible') && (
            <div className="border-t border-gray-200 pt-5">
              <button
                onClick={() => setShowPurchase(!showPurchase)}
                className="flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-800 transition-colors w-full"
              >
                <CreditCard className="h-4 w-4" />
                {showPurchase ? 'Hide' : 'Buy More'} Premium Boost Time
                {showPurchase ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
              </button>

              {showPurchase && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  {Object.values(PAID_PLANS).map((plan) => (
                    <div
                      key={plan.key}
                      className={`relative rounded-lg border-2 p-4 text-center transition-all hover:shadow-md ${
                        plan.key === 'fifteen_days'
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}
                    >
                      {plan.key === 'fifteen_days' && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                          <Badge className="bg-purple-600 text-white text-[10px] px-2 py-0.5">
                            Popular
                          </Badge>
                        </div>
                      )}
                      <p className="text-lg font-bold text-gray-900">{plan.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{plan.points} points</p>
                      <div className="mt-2">
                        <span className="text-2xl font-extrabold text-purple-700">
                          {plan.priceAED.toFixed(0)}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">AED</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">~${plan.priceUSD} USD</p>
                      <Button
                        size="sm"
                        onClick={() => handlePurchase(plan.key)}
                        disabled={purchasing !== null || subLoading}
                        className={`w-full mt-3 text-white font-medium ${
                          plan.key === 'fifteen_days'
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-gray-800 hover:bg-gray-900'
                        }`}
                      >
                        {purchasing === plan.key ? (
                          <>
                            <span className="animate-spin mr-1">&#9696;</span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                            Buy Now
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </motion.div>
              )}
              {showPurchase && (
                <p className="text-[11px] text-gray-400 mt-3 text-center">
                  Secure payment via Stripe. 100 points = 1 day = ~1 USD. Premium features include
                  unlimited profile views, job applications, messages, and a verified badge.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog (free boost) */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Activate Points Boost
            </DialogTitle>
            <DialogDescription>
              Convert your earned points into premium features.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 rounded-lg p-4 my-2 border border-amber-100">
            {/* Step breakdown in dialog */}
            {stepPoints && (
              <div className="space-y-1.5 mb-3">
                {stepPoints.steps.filter(s => s.earned > 0).map((step) => (
                  <div key={step.key} className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {step.label}
                    </span>
                    <span className="font-medium text-amber-600">{step.earned} pts</span>
                  </div>
                ))}
                {stepPoints.bonus.filter(b => b.earned > 0).map((b) => (
                  <div key={b.key} className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      {b.label}
                    </span>
                    <span className="font-medium text-amber-600">+{b.earned} pts</span>
                  </div>
                ))}
              </div>
            )}
            <hr className="border-amber-200 mb-2" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Points</span>
              <span className="font-bold text-amber-600">{totalPoints} points</span>
            </div>
            <div className="flex justify-between text-base mt-1">
              <span className="font-medium">Premium Days</span>
              <span className="font-bold text-green-600">{days.toFixed(1)} days</span>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            This will activate premium features including unlimited profile views, job applications,
            message threads, and a verified badge for the duration of your boost.
          </p>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={activating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleActivate}
              disabled={activating}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
            >
              {activating ? (
                <>
                  <span className="animate-spin mr-2">&#9696;</span>
                  Activating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Activate Boost
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PointsBoostCard;
