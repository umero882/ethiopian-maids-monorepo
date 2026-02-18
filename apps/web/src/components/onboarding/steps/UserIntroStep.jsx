import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { USER_TYPE_THEMES } from '@/data/onboardingConfig';
import {
  FileText,
  Shield,
  Briefcase,
  MessageSquare,
  Users,
  Building,
  Search,
  CheckCircle,
  Star,
  Clock,
  Award,
  BarChart,
} from 'lucide-react';

const UserIntroStep = () => {
  const { userType, nextStep, previousStep } = useOnboarding();

  const theme = USER_TYPE_THEMES[userType];

  // User-type-specific journey steps and benefits
  const content = useMemo(() => {
    switch (userType) {
      case 'maid':
        return {
          title: 'Your Journey to Employment',
          subtitle: 'Join thousands of domestic workers finding opportunities',
          journeySteps: [
            {
              icon: FileText,
              title: 'Create Profile',
              description: 'Build your professional profile with skills and experience',
            },
            {
              icon: Shield,
              title: 'Get Verified',
              description: 'Complete identity verification for trust and safety',
            },
            {
              icon: Search,
              title: 'Get Discovered',
              description: 'Families and agencies will find your profile',
            },
            {
              icon: Briefcase,
              title: 'Start Working',
              description: 'Accept offers and begin your new role',
            },
          ],
          benefits: [
            'Free profile creation',
            'Direct contact with families',
            'Verified employers only',
            'Fair salary guidance',
            'Secure messaging',
            '24/7 support available',
          ],
        };

      case 'sponsor':
        return {
          title: 'Find Your Perfect Helper',
          subtitle: 'Connect with verified domestic workers across the GCC',
          journeySteps: [
            {
              icon: FileText,
              title: 'Create Account',
              description: 'Quick registration with identity verification',
            },
            {
              icon: Search,
              title: 'Browse Profiles',
              description: 'Filter by skills, experience, and nationality',
            },
            {
              icon: MessageSquare,
              title: 'Connect',
              description: 'Message candidates and schedule interviews',
            },
            {
              icon: CheckCircle,
              title: 'Hire',
              description: 'Finalize your hiring with secure contracts',
            },
          ],
          benefits: [
            'Verified worker profiles',
            'Background check support',
            'Secure messaging',
            'Contract templates',
            'Fair pricing guidance',
            'Dedicated support',
          ],
        };

      case 'agency':
        return {
          title: 'Grow Your Recruitment Business',
          subtitle: 'Manage your workforce and connect with families',
          journeySteps: [
            {
              icon: Building,
              title: 'Register Agency',
              description: 'Verify your business with license and credentials',
            },
            {
              icon: Users,
              title: 'Add Workers',
              description: 'Build your roster of domestic workers',
            },
            {
              icon: BarChart,
              title: 'Track Placements',
              description: 'Monitor applications and manage contracts',
            },
            {
              icon: Award,
              title: 'Build Reputation',
              description: 'Earn reviews and grow your business',
            },
          ],
          benefits: [
            'Bulk worker management',
            'Analytics dashboard',
            'Lead generation',
            'Placement tracking',
            'Team collaboration',
            'Priority listings',
          ],
        };

      default:
        return null;
    }
  }, [userType]);

  if (!content || !theme) return null;

  return (
    <div className="space-y-4">
      {/* Hero section with journey steps */}
      <StepCard
        title={content.title}
        description={content.subtitle}
        showHeader={true}
      >
        <div className="mt-6 space-y-4">
          {/* Journey steps */}
          <div className="relative">
            {/* Vertical line connecting steps */}
            <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-white/20" />

            {content.journeySteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className="relative flex items-start gap-4 mb-4 last:mb-0"
              >
                {/* Step number circle */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${theme.primary} flex items-center justify-center z-10`}>
                  <step.icon className="w-5 h-5 text-white" />
                </div>

                {/* Step content */}
                <div className="flex-1 pt-1">
                  <h4 className="text-white font-semibold text-sm">
                    {step.title}
                  </h4>
                  <p className="text-gray-300 text-xs mt-0.5">
                    {step.description}
                  </p>
                </div>

                {/* Step number badge */}
                <div className="absolute left-8 -top-1 w-4 h-4 rounded-full bg-white text-xs font-bold text-purple-600 flex items-center justify-center">
                  {index + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </StepCard>

      {/* Benefits section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
      >
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-semibold">What You Get</h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {content.benefits.map((benefit, index) => (
            <motion.div
              key={benefit}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-gray-200 text-xs">{benefit}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Estimated time */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center justify-center gap-2 text-gray-300 text-sm"
      >
        <Clock className="w-4 h-4" />
        <span>Registration takes about 5-10 minutes</span>
      </motion.div>

      <StepNavigation
        onNext={nextStep}
        onPrevious={previousStep}
        nextLabel="Let's Begin"
      />
    </div>
  );
};

export default UserIntroStep;
