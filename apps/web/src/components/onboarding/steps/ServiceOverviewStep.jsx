import React from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { PREMIUM_FEATURES } from '@/data/onboardingConfig';
import {
  Crown,
  Check,
  X,
  Sparkles,
  Zap,
  Star,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ServiceOverviewStep = () => {
  const { userType, nextStep, previousStep, awardPoints } = useOnboarding();

  const features = PREMIUM_FEATURES[userType] || PREMIUM_FEATURES.maid;

  const handleContinue = () => {
    awardPoints(15, 'Reviewed service options');
    nextStep();
  };

  // Get user-specific benefits messaging
  const getBenefitsIntro = () => {
    switch (userType) {
      case 'maid':
        return {
          freeTitle: 'Start Free',
          freeSubtitle: 'Get discovered by families and agencies',
          premiumTitle: 'Go Premium',
          premiumSubtitle: 'Stand out and get more opportunities',
          highlight: 'New maids get featured for 3 days FREE!',
          highlightIcon: Sparkles,
        };
      case 'sponsor':
        return {
          freeTitle: 'Basic Access',
          freeSubtitle: 'Browse and connect with domestic workers',
          premiumTitle: 'Premium Access',
          premiumSubtitle: 'Unlimited connections and full verification',
          highlight: 'Find your perfect helper faster',
          highlightIcon: Zap,
        };
      case 'agency':
        return {
          freeTitle: 'Starter Plan',
          freeSubtitle: 'Manage your recruitment basics',
          premiumTitle: 'Business Plan',
          premiumSubtitle: 'Scale your recruitment business',
          highlight: 'Grow your agency with powerful tools',
          highlightIcon: TrendingUp,
        };
      default:
        return {
          freeTitle: 'Free',
          freeSubtitle: 'Basic features',
          premiumTitle: 'Premium',
          premiumSubtitle: 'All features',
          highlight: '',
          highlightIcon: Star,
        };
    }
  };

  const benefits = getBenefitsIntro();
  const HighlightIcon = benefits.highlightIcon;

  return (
    <div className="space-y-4">
      {/* Highlight banner */}
      {benefits.highlight && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-3"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/30 flex items-center justify-center">
            <HighlightIcon className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-yellow-200 text-sm font-medium">{benefits.highlight}</p>
        </motion.div>
      )}

      <StepCard
        title="Choose Your Plan"
        description="Compare features and pick what works for you"
        icon={Crown}
        showHeader={true}
      >
        <div className="mt-4 space-y-4">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Free Tier */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/20 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <h3 className="text-white font-semibold">{benefits.freeTitle}</h3>
              </div>
              <p className="text-gray-400 text-xs mb-4">{benefits.freeSubtitle}</p>
              <div className="space-y-2">
                {features.free.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-start gap-2"
                  >
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Premium Tier */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4 relative overflow-hidden"
            >
              {/* Premium badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg">
                PREMIUM
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">{benefits.premiumTitle}</h3>
              </div>
              <p className="text-gray-300 text-xs mb-4">{benefits.premiumSubtitle}</p>
              <div className="space-y-2">
                {features.premium.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="flex items-start gap-2"
                  >
                    <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white text-xs">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 rounded-xl overflow-hidden"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-400 p-3">Feature</th>
                  <th className="text-center text-gray-400 p-3 w-20">Free</th>
                  <th className="text-center text-yellow-400 p-3 w-20">Premium</th>
                </tr>
              </thead>
              <tbody>
                {features.comparison.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={cn(
                      'border-b border-white/5',
                      index % 2 === 0 && 'bg-white/5'
                    )}
                  >
                    <td className="text-gray-300 p-3">{row.feature}</td>
                    <td className="text-center p-3">
                      {row.free === true ? (
                        <Check className="w-4 h-4 text-green-400 mx-auto" />
                      ) : row.free === false ? (
                        <X className="w-4 h-4 text-gray-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">{row.free}</span>
                      )}
                    </td>
                    <td className="text-center p-3">
                      {row.premium === true ? (
                        <Check className="w-4 h-4 text-yellow-400 mx-auto" />
                      ) : row.premium === false ? (
                        <X className="w-4 h-4 text-gray-500 mx-auto" />
                      ) : (
                        <span className="text-yellow-400">{row.premium}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Note about upgrading later */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-gray-400 text-xs"
          >
            You'll start with the free plan. Upgrade anytime from your dashboard.
          </motion.p>
        </div>
      </StepCard>

      <StepNavigation
        onNext={handleContinue}
        onPrevious={previousStep}
        nextLabel="Continue"
      />
    </div>
  );
};

export default ServiceOverviewStep;
