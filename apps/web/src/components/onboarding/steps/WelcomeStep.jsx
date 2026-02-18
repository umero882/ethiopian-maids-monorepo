import React from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard from '../shared/StepCard';
import { SingleButton } from '../shared/StepNavigation';
import { ArrowRight, Shield, Users, Globe, Zap } from 'lucide-react';
import { PLATFORM_STATS } from '@/data/onboardingConfig';

const WelcomeStep = () => {
  const { nextStep } = useOnboarding();

  const features = [
    {
      icon: Shield,
      title: 'Verified Profiles',
      description: 'All users are verified for safety',
      color: 'from-green-400 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Trusted Network',
      description: `${PLATFORM_STATS.totalFamilies} families connected`,
      color: 'from-blue-400 to-cyan-500',
    },
    {
      icon: Globe,
      title: 'GCC Coverage',
      description: `${PLATFORM_STATS.countriesCovered} countries served`,
      color: 'from-purple-400 to-pink-500',
    },
    {
      icon: Zap,
      title: 'Quick Process',
      description: `Avg. ${PLATFORM_STATS.avgPlacementTime} to placement`,
      color: 'from-yellow-400 to-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <StepCard showHeader={false} className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="py-4"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              Ethiopian Maids
            </span>
          </h1>
          <p className="text-lg text-gray-200 mb-6">
            The trusted platform connecting domestic workers with families across the GCC
          </p>

          {/* Stats row */}
          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{PLATFORM_STATS.totalMaids}</p>
              <p className="text-xs text-gray-300">Workers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{PLATFORM_STATS.totalFamilies}</p>
              <p className="text-xs text-gray-300">Families</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{PLATFORM_STATS.successRate}</p>
              <p className="text-xs text-gray-300">Success Rate</p>
            </div>
          </div>
        </motion.div>
      </StepCard>

      {/* Features grid */}
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 h-full">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} mb-3`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">
                {feature.title}
              </h3>
              <p className="text-gray-300 text-xs">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA Button */}
      <SingleButton
        onClick={nextStep}
        label="Get Started"
        icon={ArrowRight}
        variant="primary"
      />

      {/* Already have account link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-gray-300 text-sm"
      >
        Already have an account?{' '}
        <a
          href="/login"
          className="text-purple-300 hover:text-white font-medium transition-colors underline"
        >
          Sign in
        </a>
      </motion.p>
    </div>
  );
};

export default WelcomeStep;
