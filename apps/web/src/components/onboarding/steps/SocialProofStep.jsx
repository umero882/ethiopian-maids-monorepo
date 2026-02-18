import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { TESTIMONIALS, PLATFORM_STATS } from '@/data/onboardingConfig';
import {
  Users,
  Quote,
  Star,
  ChevronLeft,
  ChevronRight,
  MapPin,
  BadgeCheck,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SocialProofStep = () => {
  const { userType, nextStep, previousStep, awardPoints } = useOnboarding();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Get testimonials for current user type
  const relevantTestimonials = TESTIMONIALS[userType] || TESTIMONIALS.maid || [];

  // Auto-advance testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % relevantTestimonials.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [relevantTestimonials.length]);

  const handlePrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) =>
      prev === 0 ? relevantTestimonials.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % relevantTestimonials.length);
  };

  const handleContinue = () => {
    awardPoints(10, 'Viewed testimonials');
    nextStep();
  };

  const currentTestimonial = relevantTestimonials[currentIndex];

  // Testimonial card variants
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Join Our Growing Community"
        description="See what others are saying"
        icon={Users}
        showHeader={true}
      >
        <div className="mt-4 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 rounded-lg p-3 text-center"
            >
              <p className="text-xl font-bold text-white">{PLATFORM_STATS.totalMaids}</p>
              <p className="text-xs text-gray-400">Workers</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 rounded-lg p-3 text-center"
            >
              <p className="text-xl font-bold text-white">{PLATFORM_STATS.totalFamilies}</p>
              <p className="text-xs text-gray-400">Families</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 rounded-lg p-3 text-center"
            >
              <p className="text-xl font-bold text-white">{PLATFORM_STATS.successRate}</p>
              <p className="text-xs text-gray-400">Success</p>
            </motion.div>
          </div>

          {/* Testimonial carousel with navigation */}
          <div className="relative">
            {/* Navigation buttons - outside the card */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Testimonial card */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/10 overflow-hidden"
                  >
                    {/* Card content */}
                    <div className="p-4">
                      {/* Header with avatar and info */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Avatar with photo */}
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-purple-500/50 ring-offset-2 ring-offset-[#1a1a2e]">
                            <img
                              src={currentTestimonial.avatar}
                              alt={currentTestimonial.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentTestimonial.name)}&background=7c3aed&color=fff&size=128`;
                              }}
                            />
                          </div>
                          {currentTestimonial.verified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#1a1a2e]">
                              <BadgeCheck className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Name and location */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-semibold text-sm truncate">
                              {currentTestimonial.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {currentTestimonial.country && currentTestimonial.destination
                                ? `${currentTestimonial.country} → ${currentTestimonial.destination}`
                                : currentTestimonial.location || currentTestimonial.country}
                            </span>
                          </div>
                          {/* Rating */}
                          <div className="flex gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'w-3.5 h-3.5',
                                  i < currentTestimonial.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-600'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quote */}
                      <div className="relative">
                        <Quote className="absolute -top-1 -left-1 w-6 h-6 text-purple-400/30" />
                        <p className="text-gray-200 text-sm leading-relaxed pl-5 italic">
                          "{currentTestimonial.quote || currentTestimonial.text}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <button
                onClick={handleNext}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-3">
              {relevantTestimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    index === currentIndex
                      ? 'bg-purple-500 w-6'
                      : 'bg-white/20 hover:bg-white/40 w-2'
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-2"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 rounded-full">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-xs">Verified Profiles</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 rounded-full">
              <CheckCircle className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400 text-xs">Secure Platform</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 rounded-full">
              <CheckCircle className="w-3 h-3 text-purple-400" />
              <span className="text-purple-400 text-xs">24/7 Support</span>
            </div>
          </motion.div>
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

export default SocialProofStep;
