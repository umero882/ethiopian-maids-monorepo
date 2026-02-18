import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard from '../shared/StepCard';
import { SingleButton } from '../shared/StepNavigation';
import { USER_TYPE_THEMES } from '@/data/onboardingConfig';
import {
  PartyPopper,
  ArrowRight,
  Shield,
  CheckCircle,
  Star,
  Sparkles,
} from 'lucide-react';

const CongratulationsStep = () => {
  const { userType, nextStep, awardPoints, triggerCelebration, gamification } = useOnboarding();

  const theme = USER_TYPE_THEMES[userType];

  // Trigger celebration on mount
  useEffect(() => {
    // Small delay for better effect
    const timer = setTimeout(() => {
      triggerCelebration('confetti-cannon');
      awardPoints(100, 'Account created!');
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const userTypeMessages = {
    maid: {
      title: 'Welcome to Your New Beginning!',
      subtitle: "You're on your way to finding great opportunities",
      highlights: [
        { icon: CheckCircle, text: 'Email verified' },
        { icon: Shield, text: 'Phone secured' },
        { icon: Star, text: 'Account created' },
      ],
      nextStepPreview: "Now let's build your professional profile",
    },
    sponsor: {
      title: 'Welcome to the Family Network!',
      subtitle: "You're ready to find your perfect helper",
      highlights: [
        { icon: CheckCircle, text: 'Email verified' },
        { icon: Shield, text: 'Phone secured' },
        { icon: Star, text: 'Account created' },
      ],
      nextStepPreview: "Now let's set up your household preferences",
    },
    agency: {
      title: 'Welcome to the Business Network!',
      subtitle: "You're ready to grow your recruitment business",
      highlights: [
        { icon: CheckCircle, text: 'Email verified' },
        { icon: Shield, text: 'Phone secured' },
        { icon: Star, text: 'Account created' },
      ],
      nextStepPreview: "Now let's register your agency details",
    },
  };

  const content = userTypeMessages[userType] || userTypeMessages.maid;

  return (
    <div className="space-y-4">
      <StepCard showHeader={false}>
        <div className="text-center py-6">
          {/* Animated celebration icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-6 shadow-lg"
          >
            <PartyPopper className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title with sparkles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <Sparkles className="absolute -left-2 -top-2 w-6 h-6 text-yellow-400" />
            <Sparkles className="absolute -right-2 -top-2 w-6 h-6 text-yellow-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {content.title}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-gray-200 mb-6"
          >
            {content.subtitle}
          </motion.p>

          {/* Achievement highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mb-6"
          >
            {content.highlights.map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full"
              >
                <item.icon className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Points earned display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl border border-purple-500/30 mb-6"
          >
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-bold text-lg">
              {gamification.points} Points
            </span>
            <span className="text-gray-300">earned so far!</span>
          </motion.div>

          {/* User type badge */}
          {theme && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex justify-center mb-6"
            >
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full">
                <img
                  src={theme.icon}
                  alt={theme.label}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-white font-medium">{theme.label} Account</span>
              </div>
            </motion.div>
          )}

          {/* Next step preview */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-gray-400 text-sm"
          >
            {content.nextStepPreview}
          </motion.p>
        </div>
      </StepCard>

      {/* Progress indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 text-sm">Account Setup</span>
          <span className="text-green-400 text-sm font-medium">Complete!</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '30%' }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Account setup done</span>
          <span>Profile setup next</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <SingleButton
          onClick={nextStep}
          label="Continue to Profile Setup"
          icon={ArrowRight}
          variant="primary"
        />
      </motion.div>
    </div>
  );
};

export default CongratulationsStep;
