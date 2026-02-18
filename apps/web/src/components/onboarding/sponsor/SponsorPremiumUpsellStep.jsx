import React from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Button } from '@/components/ui/button';
import {
  Crown,
  Check,
  X,
  Sparkles,
  Eye,
  MessageSquare,
  Shield,
  Search,
  Headphones,
  Star,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Premium features comparison
const PREMIUM_FEATURES = [
  {
    feature: 'Profile Views',
    free: '10/month',
    premium: 'Unlimited',
    icon: Eye,
  },
  {
    feature: 'Contact Maids',
    free: '3/month',
    premium: 'Unlimited',
    icon: MessageSquare,
  },
  {
    feature: 'Background Checks',
    free: 'Basic',
    premium: 'Full Report',
    icon: Shield,
  },
  {
    feature: 'Saved Searches',
    free: '1',
    premium: 'Unlimited',
    icon: Search,
  },
  {
    feature: 'Priority Support',
    free: false,
    premium: true,
    icon: Headphones,
  },
  {
    feature: 'Verified Badge',
    free: false,
    premium: true,
    icon: Star,
  },
];

// Premium plans
const PREMIUM_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$29',
    period: '/month',
    popular: false,
    savings: null,
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: '$69',
    period: '/3 months',
    popular: true,
    savings: 'Save 20%',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$199',
    period: '/year',
    popular: false,
    savings: 'Save 40%',
  },
];

const SponsorPremiumUpsellStep = () => {
  const { formData, updateFormData, nextStep, previousStep } = useOnboarding();

  const selectedPlan = formData.selected_premium_plan || null;

  // Handle plan selection
  const handleSelectPlan = (planId) => {
    updateFormData({ selected_premium_plan: planId });
  };

  // Handle skip
  const handleSkip = () => {
    updateFormData({ selected_premium_plan: null, skipped_premium: true });
    nextStep();
  };

  // Handle continue with plan
  const handleContinueWithPlan = () => {
    if (selectedPlan) {
      // In a real app, this would redirect to payment
      nextStep();
    }
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Unlock Premium"
        description="Get more from your hiring experience"
        icon={Crown}
        showHeader={true}
        className="border-yellow-500/30"
      >
        <div className="space-y-5 mt-4">
          {/* Premium badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-600/30 to-amber-600/30 border border-yellow-500/50">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Premium Sponsor</span>
            </div>
          </motion.div>

          {/* Feature comparison */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg overflow-hidden border border-white/20"
          >
            <div className="grid grid-cols-3 gap-0 bg-white/5 py-2 px-3 border-b border-white/10">
              <span className="text-xs text-gray-400">Feature</span>
              <span className="text-xs text-gray-400 text-center">Free</span>
              <span className="text-xs text-yellow-400 text-center font-medium">Premium</span>
            </div>

            {PREMIUM_FEATURES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={cn(
                    'grid grid-cols-3 gap-0 py-2.5 px-3',
                    idx % 2 === 0 ? 'bg-white/5' : 'bg-transparent'
                  )}
                >
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="truncate">{item.feature}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    {typeof item.free === 'boolean' ? (
                      item.free ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-gray-600" />
                      )
                    ) : (
                      <span className="text-xs text-gray-400">{item.free}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    {typeof item.premium === 'boolean' ? (
                      item.premium ? (
                        <Check className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <X className="w-4 h-4 text-gray-600" />
                      )
                    ) : (
                      <span className="text-xs text-yellow-400 font-medium">{item.premium}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Plan selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="block text-sm text-gray-300 mb-2">
              Choose a Plan <span className="text-gray-500">(optional)</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {PREMIUM_PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={cn(
                      'relative p-3 rounded-lg border text-center transition-all',
                      isSelected
                        ? 'bg-yellow-600/20 border-yellow-500'
                        : 'bg-white/5 border-white/20 hover:bg-white/10',
                      plan.popular && !isSelected && 'border-purple-500/50'
                    )}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-[10px] px-2 py-0.5 bg-purple-600 text-white rounded-full">
                        Popular
                      </span>
                    )}
                    {plan.savings && (
                      <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] px-2 py-0.5 bg-green-600 text-white rounded-full whitespace-nowrap">
                        {plan.savings}
                      </span>
                    )}
                    <p className="text-xs text-gray-400 mb-1">{plan.name}</p>
                    <p className="text-lg font-bold text-white">{plan.price}</p>
                    <p className="text-[10px] text-gray-500">{plan.period}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Selected plan summary */}
          {selectedPlan && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-600/10 border border-yellow-500/30 rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-medium">
                    {PREMIUM_PLANS.find((p) => p.id === selectedPlan)?.name} Premium
                  </span>
                </div>
                <span className="text-yellow-400 font-bold">
                  {PREMIUM_PLANS.find((p) => p.id === selectedPlan)?.price}
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                You'll be redirected to complete payment after profile setup.
              </p>
            </motion.div>
          )}

          {/* CTA buttons */}
          <div className="space-y-2 pt-2">
            {selectedPlan && (
              <Button
                onClick={handleContinueWithPlan}
                className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Continue with Premium
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            <Button
              onClick={handleSkip}
              variant="ghost"
              className="w-full text-gray-400 hover:text-white hover:bg-white/10"
            >
              Skip for now, continue with Free
            </Button>
          </div>

          {/* Reassurance */}
          <p className="text-center text-xs text-gray-500">
            You can upgrade anytime from your dashboard
          </p>
        </div>

        <StepTip>
          Premium sponsors find suitable candidates 3x faster on average.
        </StepTip>
      </StepCard>

      <StepNavigation
        onNext={selectedPlan ? handleContinueWithPlan : handleSkip}
        onPrevious={previousStep}
        nextLabel={selectedPlan ? 'Continue with Premium' : 'Skip & Continue Free'}
        showSkip={false}
      />
    </div>
  );
};

export default SponsorPremiumUpsellStep;
