import React from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { USER_TYPE_THEMES } from '@/data/onboardingConfig';
import { Check } from 'lucide-react';

const UserTypeStep = () => {
  const { setUserType, userType, nextStep, previousStep } = useOnboarding();

  const userTypes = [
    {
      type: 'sponsor',
      ...USER_TYPE_THEMES.sponsor,
      highlights: ['Verified maids', 'Background checks', 'Secure payments'],
    },
    {
      type: 'maid',
      ...USER_TYPE_THEMES.maid,
      highlights: ['Find families', 'Verified employers', 'Fair salaries'],
    },
    {
      type: 'agency',
      ...USER_TYPE_THEMES.agency,
      highlights: ['Manage listings', 'Track placements', 'Analytics'],
    },
  ];

  const handleSelect = (type) => {
    setUserType(type);
  };

  const handleContinue = () => {
    if (userType) {
      nextStep();
    }
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Choose Your Account Type"
        description="Select the option that best describes you"
        showHeader={true}
      >
        <div className="grid grid-cols-1 gap-3 mt-4">
          {userTypes.map((item, index) => {
            const isSelected = userType === item.type;

            return (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleSelect(item.type)}
                className="cursor-pointer group"
              >
                <Card
                  className={`h-full transition-all duration-300 border-2 ${
                    isSelected
                      ? 'border-white bg-white/20 shadow-lg scale-[1.02]'
                      : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br ${item.primary}`}
                      >
                        <img
                          src={item.icon}
                          alt={item.label}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">
                            {item.label}
                          </h3>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mt-1">
                          {item.description}
                        </p>

                        {/* Highlights */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.highlights.map((highlight) => (
                            <span
                              key={highlight}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-white/30 text-white'
                                  : 'bg-white/10 text-gray-300'
                              }`}
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </StepCard>

      <StepNavigation
        onNext={handleContinue}
        onPrevious={previousStep}
        isDisabled={!userType}
        showPrevious={true}
        isFirstStep={false}
        nextLabel={userType ? `Continue as ${USER_TYPE_THEMES[userType]?.label}` : 'Select an option'}
      />
    </div>
  );
};

export default UserTypeStep;
