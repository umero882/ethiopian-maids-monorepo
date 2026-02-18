import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import { getStepsForUserType, getTotalSteps, USER_TYPE_THEMES } from '@/data/onboardingConfig';
import { Trophy, Star, Zap } from 'lucide-react';
import ConfettiCelebration from './ConfettiCelebration';

const OnboardingLayout = ({ children }) => {
  const {
    userType,
    currentStep,
    completedSteps,
    gamification,
    showCelebration,
    celebrationType,
    isDraftLoaded,
  } = useOnboarding();

  // Get theme based on user type
  const theme = useMemo(() => {
    if (userType && USER_TYPE_THEMES[userType]) {
      return USER_TYPE_THEMES[userType];
    }
    // Default theme for before user type selection
    return {
      primary: 'from-purple-600 to-blue-600',
      secondary: 'from-purple-500 to-blue-500',
      accent: '#8B5CF6',
      bgGradient: 'from-purple-900 via-blue-900 to-indigo-900',
    };
  }, [userType]);

  // Calculate progress
  const totalSteps = useMemo(() => getTotalSteps(userType), [userType]);
  const progressPercentage = useMemo(() => {
    if (!totalSteps) return 0;
    return Math.round((currentStep / totalSteps) * 100);
  }, [currentStep, totalSteps]);

  // Get current step info
  const steps = useMemo(() => getStepsForUserType(userType), [userType]);
  const currentStepInfo = steps[currentStep];

  // Show loading while draft is being loaded
  if (!isDraftLoaded) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} flex flex-col`}>
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <ConfettiCelebration type={celebrationType} />
        )}
      </AnimatePresence>

      {/* Header with logo and progress */}
      <header className="w-full px-4 py-4 sm:py-6">
        <div className="max-w-lg mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-4"
          >
            <img
              src="/images/logo/ethiopian-maids-logo.png"
              alt="Ethiopian Maids"
              className="h-12 sm:h-16 w-auto drop-shadow-2xl"
            />
          </motion.div>

          {/* Progress bar section */}
          {userType && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              {/* Step counter and percentage */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <span className="text-white/80 font-medium">
                  {progressPercentage}% complete
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${theme.primary} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>

              {/* Gamification stats */}
              <div className="flex items-center justify-between pt-2">
                {/* Points */}
                <div className="flex items-center gap-1.5 text-white/80">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium">{gamification.points} pts</span>
                </div>

                {/* Level */}
                <div className="flex items-center gap-1.5 text-white/80">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium">Level {gamification.level}</span>
                </div>

                {/* Achievements count */}
                {gamification.achievements.length > 0 && (
                  <div className="flex items-center gap-1.5 text-white/80">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">
                      {gamification.achievements.length} badges
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step indicator dots (for initial steps) */}
          {!userType && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {[0, 1].map((step) => (
                <motion.div
                  key={step}
                  initial={false}
                  animate={{
                    scale: currentStep === step ? 1.2 : 1,
                    backgroundColor: currentStep >= step ? '#8B5CF6' : 'rgba(255,255,255,0.2)',
                  }}
                  className={`w-3 h-3 rounded-full ${
                    currentStep >= step ? 'bg-purple-500' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Current step title (if available) */}
      {currentStepInfo && userType && (
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-4 mb-4"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {currentStepInfo.title}
          </h2>
          {currentStepInfo.subtitle && (
            <p className="text-white/60 text-sm mt-1">
              {currentStepInfo.subtitle}
            </p>
          )}
        </motion.div>
      )}

      {/* Main content area */}
      <main className="flex-1 flex items-start justify-center px-4 pb-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Achievement toast (when new achievement is unlocked) */}
      <AnimatePresence>
        {showCelebration && celebrationType === 'achievement' && gamification.achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              <div>
                <p className="font-bold">Achievement Unlocked!</p>
                <p className="text-sm opacity-90">
                  {gamification.achievements[gamification.achievements.length - 1]?.name}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingLayout;
