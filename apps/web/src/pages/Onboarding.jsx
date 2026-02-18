import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import OnboardingUserTypeSelect from '@/components/onboarding/OnboardingUserTypeSelect';
import OnboardingUserTypeIntro from '@/components/onboarding/OnboardingUserTypeIntro';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedUserType, setSelectedUserType] = useState('');

  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUserTypeSelect = (userType) => {
    setSelectedUserType(userType);
    handleNext();
  };

  const handleComplete = () => {
    // Navigate to register with pre-selected userType
    navigate(`/register?userType=${selectedUserType}`);
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className='flex items-center justify-center gap-2 mb-8'>
      {[1, 2, 3].map((step) => (
        <div key={step} className='flex items-center'>
          <motion.div
            initial={false}
            animate={{
              scale: currentStep === step ? 1.2 : 1,
              backgroundColor: currentStep >= step ? '#8B5CF6' : 'rgba(255,255,255,0.2)',
            }}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentStep >= step ? 'bg-purple-500' : 'bg-white/20'
            }`}
          />
          {step < 3 && (
            <div
              className={`w-8 h-0.5 mx-1 transition-all duration-300 ${
                currentStep > step ? 'bg-purple-500' : 'bg-white/20'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center py-12 px-4'>
      <div className='max-w-lg w-full'>
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className='flex justify-center mb-6'
        >
          <img
            src='/images/logo/ethiopian-maids-logo.png'
            alt='Ethiopian Maids'
            className='h-16 w-auto drop-shadow-2xl'
          />
        </motion.div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Step Counter */}
        <div className='text-center mb-6'>
          <span className='text-white/60 text-sm'>
            Step {currentStep} of {totalSteps}
          </span>
        </div>

        {/* Page Content */}
        <AnimatePresence mode='wait'>
          {currentStep === 1 && (
            <motion.div
              key='step1'
              variants={pageVariants}
              initial='initial'
              animate='animate'
              exit='exit'
              transition={{ duration: 0.3 }}
            >
              <OnboardingWelcome onNext={handleNext} />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key='step2'
              variants={pageVariants}
              initial='initial'
              animate='animate'
              exit='exit'
              transition={{ duration: 0.3 }}
            >
              <OnboardingUserTypeSelect
                onSelect={handleUserTypeSelect}
                onBack={handleBack}
                selectedType={selectedUserType}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key='step3'
              variants={pageVariants}
              initial='initial'
              animate='animate'
              exit='exit'
              transition={{ duration: 0.3 }}
            >
              <OnboardingUserTypeIntro
                userType={selectedUserType}
                onBack={handleBack}
                onComplete={handleComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
