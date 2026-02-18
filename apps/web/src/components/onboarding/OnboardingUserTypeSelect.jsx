import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Heart, Users, Building, ArrowRight } from 'lucide-react';

const OnboardingUserTypeSelect = ({ onSelect, onBack, selectedType }) => {
  const userTypes = [
    {
      type: 'maid',
      title: 'Domestic Worker',
      subtitle: 'Looking for employment',
      description: 'Find meaningful employment opportunities with verified families across the GCC',
      icon: Heart,
      image: '/images/Registration icon/maid-new.png',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      highlights: ['Access job listings', 'Build your profile', 'Connect with sponsors'],
    },
    {
      type: 'sponsor',
      title: 'Family / Sponsor',
      subtitle: 'Hiring domestic help',
      description: 'Find trusted Ethiopian domestic workers for your household needs',
      icon: Users,
      image: '/images/Registration icon/sponsor-new.png',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      highlights: ['Browse verified profiles', 'Easy hiring process', 'Secure communication'],
    },
    {
      type: 'agency',
      title: 'Recruitment Agency',
      subtitle: 'Managing placements',
      description: 'Manage your recruitment business and connect workers with families',
      icon: Building,
      image: '/images/Registration icon/agency-new.png',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      highlights: ['Manage multiple workers', 'Analytics dashboard', 'Subscription plans'],
    },
  ];

  return (
    <Card className='glass-effect border-white/20 bg-white/5'>
      <CardContent className='p-8'>
        <div className='text-center mb-6'>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='text-2xl font-bold text-white mb-2'
          >
            What best describes you?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='text-gray-300'
          >
            Select your account type to continue
          </motion.p>
        </div>

        {/* User Type Cards */}
        <div className='space-y-4 mb-6'>
          {userTypes.map((type, index) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.type;

            return (
              <motion.div
                key={type.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                onClick={() => onSelect(type.type)}
                className='cursor-pointer group'
              >
                <div
                  className={`
                    relative p-5 rounded-xl border transition-all duration-300
                    ${isSelected
                      ? `${type.bgColor} ${type.borderColor} border-2 shadow-lg`
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <div className='flex items-center gap-4'>
                    {/* Icon/Image */}
                    <div
                      className={`
                        flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center
                        bg-white overflow-hidden shadow-sm
                      `}
                    >
                      <img
                        src={type.image}
                        alt={`${type.title} icon`}
                        className='w-full h-full object-cover'
                      />
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-white font-bold text-lg'>
                        {type.title}
                      </h3>
                      <p className='text-gray-300 text-sm'>
                        {type.subtitle}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <ArrowRight
                      className={`w-5 h-5 transition-all duration-300 ${
                        isSelected ? 'text-white translate-x-1' : 'text-gray-400 group-hover:text-white group-hover:translate-x-1'
                      }`}
                    />
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      className={`absolute bottom-0 left-0 h-1 rounded-full bg-gradient-to-r ${type.color}`}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
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

export default OnboardingUserTypeSelect;
