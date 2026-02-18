import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Shield, Users, Globe, Zap } from 'lucide-react';

const OnboardingWelcome = ({ onNext }) => {
  const features = [
    {
      icon: Shield,
      title: 'Verified Profiles',
      description: 'All profiles are thoroughly verified',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Trusted Network',
      description: 'Connect with 2,000+ families',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Globe,
      title: 'GCC Coverage',
      description: 'Available in all 6 GCC countries',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Zap,
      title: 'Quick Process',
      description: 'Average 8-day placement time',
      color: 'from-orange-500 to-amber-500',
    },
  ];

  return (
    <Card className='glass-effect border-white/20 bg-white/5'>
      <CardContent className='p-8'>
        <div className='text-center mb-8'>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='text-3xl font-bold text-white mb-4'
          >
            Welcome to{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400'>
              Ethiopian Maids
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='text-gray-200 text-lg'
          >
            The premier platform connecting Ethiopian domestic workers with families across the GCC
          </motion.p>
        </div>

        {/* Feature Grid */}
        <div className='grid grid-cols-2 gap-4 mb-8'>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className='p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300'
              >
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} mb-3`}
                >
                  <Icon className='w-5 h-5 text-white' />
                </div>
                <h3 className='text-white font-semibold text-sm mb-1'>
                  {feature.title}
                </h3>
                <p className='text-gray-300 text-xs'>{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Button
            onClick={onNext}
            size='lg'
            className='w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl text-lg font-semibold py-6'
          >
            Get Started
            <ArrowRight className='ml-2 w-5 h-5' />
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default OnboardingWelcome;
