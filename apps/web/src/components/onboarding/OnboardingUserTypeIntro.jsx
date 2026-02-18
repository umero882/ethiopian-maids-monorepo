import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Briefcase,
  Search,
  MessageCircle,
  FileCheck,
  UserPlus,
  Shield,
  Target,
  Building,
  BarChart,
  Users,
} from 'lucide-react';

const OnboardingUserTypeIntro = ({ userType, onBack, onComplete }) => {
  // Content based on user type
  const content = {
    maid: {
      title: 'Ready to Find Your Next Opportunity?',
      subtitle: 'Join thousands of Ethiopian domestic workers finding meaningful employment',
      image: '/images/Registration icon/maid-new.png',
      color: 'from-purple-500 to-pink-500',
      steps: [
        {
          icon: UserPlus,
          title: 'Create Your Profile',
          description: 'Build a professional profile showcasing your skills and experience',
        },
        {
          icon: Shield,
          title: 'Get Verified',
          description: 'Complete verification to build trust with potential employers',
        },
        {
          icon: Target,
          title: 'Get Matched',
          description: 'Receive job opportunities from verified families across the GCC',
        },
        {
          icon: Briefcase,
          title: 'Start Working',
          description: 'Begin your new career with a trusted employer',
        },
      ],
      benefits: [
        'Access to 1,000+ verified job opportunities',
        'Direct communication with sponsors',
        'Secure and trusted platform',
        'Support throughout the process',
      ],
    },
    sponsor: {
      title: 'Find Trusted Domestic Help',
      subtitle: 'Connect with verified Ethiopian domestic workers for your household',
      image: '/images/Registration icon/sponsor-new.png',
      color: 'from-blue-500 to-cyan-500',
      steps: [
        {
          icon: UserPlus,
          title: 'Create Account',
          description: 'Register and complete your family profile',
        },
        {
          icon: Search,
          title: 'Browse Profiles',
          description: 'Search through 1,000+ verified worker profiles',
        },
        {
          icon: MessageCircle,
          title: 'Connect & Interview',
          description: 'Contact candidates and conduct interviews',
        },
        {
          icon: FileCheck,
          title: 'Hire & Onboard',
          description: 'Complete paperwork and welcome your new worker',
        },
      ],
      benefits: [
        '100% verified worker profiles',
        'Background checks included',
        'Secure messaging system',
        'Average 8-day hiring process',
      ],
    },
    agency: {
      title: 'Grow Your Recruitment Business',
      subtitle: 'Manage placements and connect workers with families at scale',
      image: '/images/Registration icon/agency-new.png',
      color: 'from-green-500 to-emerald-500',
      steps: [
        {
          icon: Building,
          title: 'Register Agency',
          description: 'Set up your agency profile and credentials',
        },
        {
          icon: Users,
          title: 'Manage Workers',
          description: 'Add and manage your pool of domestic workers',
        },
        {
          icon: Target,
          title: 'Match & Place',
          description: 'Connect workers with families seeking help',
        },
        {
          icon: BarChart,
          title: 'Track & Grow',
          description: 'Monitor placements and scale your business',
        },
      ],
      benefits: [
        'Multi-worker management dashboard',
        'Analytics and reporting tools',
        'Priority listing for workers',
        'Dedicated agency support',
      ],
    },
  };

  const currentContent = content[userType] || content.sponsor;

  return (
    <Card className='glass-effect border-white/20 bg-white/5'>
      <CardContent className='p-8'>
        {/* Header with Image */}
        <div className='text-center mb-6'>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-md mb-4 overflow-hidden'
          >
            <img
              src={currentContent.image}
              alt='User type'
              className='w-full h-full object-cover'
            />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='text-2xl font-bold text-white mb-2'
          >
            {currentContent.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='text-gray-300 text-sm'
          >
            {currentContent.subtitle}
          </motion.p>
        </div>

        {/* Process Steps */}
        <div className='space-y-3 mb-6'>
          {currentContent.steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className='flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10'
              >
                <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center'>
                  <Icon className='w-4 h-4 text-gray-700' />
                </div>
                <div>
                  <h4 className='text-white font-semibold text-sm'>{step.title}</h4>
                  <p className='text-gray-400 text-xs'>{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className='mb-6'
        >
          <h3 className='text-white font-semibold text-sm mb-3'>What you get:</h3>
          <div className='space-y-2'>
            {currentContent.benefits.map((benefit, index) => (
              <div key={index} className='flex items-center gap-2 text-gray-300 text-sm'>
                <CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0' />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className='space-y-3'
        >
          <Button
            onClick={onComplete}
            size='lg'
            className={`w-full bg-gradient-to-r ${currentContent.color} hover:opacity-90 text-white shadow-lg hover:shadow-xl text-lg font-semibold py-6`}
          >
            Create My Account
            <ArrowRight className='ml-2 w-5 h-5' />
          </Button>
          <Button
            onClick={onBack}
            variant='ghost'
            className='w-full text-gray-300 hover:text-white hover:bg-white/10'
          >
            <ArrowLeft className='mr-2 w-4 h-4' />
            Back
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default OnboardingUserTypeIntro;
