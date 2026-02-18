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
  Users,
  BarChart3,
  Upload,
  Globe,
  Headphones,
  Star,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Premium features comparison for agencies
const PREMIUM_FEATURES = [
  {
    feature: 'Maid Listings',
    free: '10',
    premium: 'Unlimited',
    icon: Users,
  },
  {
    feature: 'Analytics Dashboard',
    free: 'Basic',
    premium: 'Advanced',
    icon: BarChart3,
  },
  {
    feature: 'Team Members',
    free: '1',
    premium: '10+',
    icon: Users,
  },
  {
    feature: 'Bulk Import',
    free: false,
    premium: true,
    icon: Upload,
  },
  {
    feature: 'API Access',
    free: false,
    premium: true,
    icon: Globe,
  },
  {
    feature: 'Priority Support',
    free: false,
    premium: true,
    icon: Headphones,
  },
  {
    feature: 'Featured Listing',
    free: false,
    premium: true,
    icon: Star,
  },
  {
    feature: 'Verified Badge',
    free: false,
    premium: true,
    icon: Zap,
  },
];

// Premium plans for agencies
const PREMIUM_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$99',
    period: '/month',
    popular: false,
    savings: null,
    features: ['Up to 50 listings', 'Basic analytics', '3 team members'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$249',
    period: '/month',
    popular: true,
    savings: 'Most Popular',
    features: ['Unlimited listings', 'Advanced analytics', '10 team members', 'API access'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$499',
    period: '/month',
    popular: false,
    savings: 'Best Value',
    features: ['Everything in Pro', 'Dedicated support', 'Custom integrations', 'White-label options'],
  },
];

const AgencyPremiumUpsellStep = () => {
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
      nextStep();
    }
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Grow Your Agency"
        description="Unlock premium features"
        icon={Crown}
        showHeader={true}
        className="border-yellow-500/30"
      >
        <div className="space-y-5 mt-4">
          {/* Premium badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-600/30 to-amber-600/30 border border-yellow-500/50">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Agency Premium</span>
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

            {PREMIUM_FEATURES.slice(0, 6).map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={cn(
                    'grid grid-cols-3 gap-0 py-2 px-3',
                    idx % 2 === 0 ? 'bg-white/5' : 'bg-transparent'
                  )}
                >
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Icon className="w-3.5 h-3.5 text-gray-500" />
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

            <div className="space-y-2">
              {PREMIUM_PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={cn(
                      'w-full p-3 rounded-lg border text-left transition-all relative',
                      isSelected
                        ? 'bg-yellow-600/20 border-yellow-500'
                        : 'bg-white/5 border-white/20 hover:bg-white/10',
                      plan.popular && !isSelected && 'border-purple-500/50'
                    )}
                  >
                    {plan.savings && (
                      <span className={cn(
                        'absolute -top-2 right-3 text-[10px] px-2 py-0.5 rounded-full',
                        plan.popular ? 'bg-purple-600 text-white' : 'bg-green-600 text-white'
                      )}>
                        {plan.savings}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium text-sm">{plan.name}</h4>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {plan.features.slice(0, 2).join(' • ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{plan.price}</p>
                        <p className="text-[10px] text-gray-500">{plan.period}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1/2 left-2 transform -translate-y-1/2">
                        <Check className="w-4 h-4 text-yellow-400" />
                      </div>
                    )}
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-medium">
                    {PREMIUM_PLANS.find((p) => p.id === selectedPlan)?.name} Plan
                  </span>
                </div>
                <span className="text-yellow-400 font-bold">
                  {PREMIUM_PLANS.find((p) => p.id === selectedPlan)?.price}
                </span>
              </div>
              <ul className="space-y-1">
                {PREMIUM_PLANS.find((p) => p.id === selectedPlan)?.features.map((f, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-yellow-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-gray-500 text-xs mt-2">
                Complete payment after profile setup.
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
                Continue with {PREMIUM_PLANS.find((p) => p.id === selectedPlan)?.name}
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
            Upgrade anytime from your agency dashboard
          </p>
        </div>

        <StepTip>
          Premium agencies get 5x more visibility and candidate applications.
        </StepTip>
      </StepCard>

      <StepNavigation
        onNext={selectedPlan ? handleContinueWithPlan : handleSkip}
        onPrevious={previousStep}
        nextLabel={selectedPlan ? `Continue with ${PREMIUM_PLANS.find((p) => p.id === selectedPlan)?.name}` : 'Skip & Continue Free'}
        showSkip={false}
      />
    </div>
  );
};

export default AgencyPremiumUpsellStep;
