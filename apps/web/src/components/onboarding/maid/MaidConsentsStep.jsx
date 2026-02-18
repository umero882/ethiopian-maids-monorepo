import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileCheck,
  Shield,
  Bell,
  Users,
  ExternalLink,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CONSENT_ITEMS = [
  {
    id: 'termsAccepted',
    title: 'Terms of Service',
    description: 'I agree to the Terms of Service and Privacy Policy',
    icon: FileCheck,
    required: true,
    link: '/terms',
  },
  {
    id: 'privacyAccepted',
    title: 'Privacy Policy',
    description: 'I consent to the collection and use of my personal data',
    icon: Shield,
    required: true,
    link: '/privacy',
  },
  {
    id: 'backgroundCheckConsent',
    title: 'Background Check',
    description: 'I consent to background verification for employment purposes',
    icon: Users,
    required: true,
    link: null,
  },
  {
    id: 'communicationConsent',
    title: 'Communication',
    description: 'I agree to receive job opportunities and platform updates',
    icon: Bell,
    required: false,
    link: null,
  },
];

const MaidConsentsStep = () => {
  const { consents, updateConsent, nextStep, previousStep, awardPoints, triggerCelebration } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Handle consent change
  const handleConsentChange = (id, checked) => {
    updateConsent(id, checked);

    // Clear error if accepting required consent
    if (errors[id] && checked) {
      setErrors((prev) => ({ ...prev, [id]: null }));
    }
  };

  // Validate all required consents
  const validateAll = () => {
    const newErrors = {};
    const requiredItems = CONSENT_ITEMS.filter((item) => item.required);

    requiredItems.forEach((item) => {
      if (!consents[item.id]) {
        newErrors[item.id] = 'This consent is required';
      }
    });

    setErrors(newErrors);
    setTouched(
      CONSENT_ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: true }), {})
    );

    return Object.keys(newErrors).length === 0;
  };

  // Handle continue
  const handleContinue = () => {
    if (validateAll()) {
      awardPoints(50, 'Consents completed');
      triggerCelebration('confetti-rain');
      nextStep();
    }
  };

  // Check if all required consents are accepted
  const allRequiredAccepted = CONSENT_ITEMS.filter((item) => item.required).every(
    (item) => consents[item.id]
  );

  // Count accepted consents
  const acceptedCount = CONSENT_ITEMS.filter((item) => consents[item.id]).length;

  // Accept all required
  const acceptAllRequired = () => {
    CONSENT_ITEMS.filter((item) => item.required).forEach((item) => {
      updateConsent(item.id, true);
    });
    setErrors({});
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Almost Done!"
        description="Review and accept the terms"
        icon={FileCheck}
        showHeader={true}
      >
        <div className="mt-4 space-y-4">
          {/* Quick accept button */}
          {!allRequiredAccepted && (
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={acceptAllRequired}
              className="w-full py-2 px-4 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-400 text-sm font-medium hover:bg-purple-600/30 transition-colors"
            >
              Accept All Required Terms
            </motion.button>
          )}

          {/* Consent items */}
          <div className="space-y-3">
            {CONSENT_ITEMS.map((item, index) => {
              const isChecked = consents[item.id];
              const hasError = touched[item.id] && errors[item.id];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'p-3 rounded-lg border transition-all',
                    isChecked
                      ? 'bg-green-500/10 border-green-500/30'
                      : hasError
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-white/5 border-white/10'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      <Checkbox
                        id={item.id}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleConsentChange(item.id, checked)}
                        className={cn(
                          'border-white/30',
                          isChecked && 'bg-green-500 border-green-500'
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={item.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <item.icon
                          className={cn(
                            'w-4 h-4 flex-shrink-0',
                            isChecked ? 'text-green-400' : 'text-gray-400'
                          )}
                        />
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isChecked ? 'text-white' : 'text-gray-300'
                          )}
                        >
                          {item.title}
                          {item.required && (
                            <span className="text-red-400 ml-1">*</span>
                          )}
                        </span>
                      </label>

                      <p className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </p>

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mt-1"
                        >
                          Read more
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {hasError && (
                        <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors[item.id]}
                        </div>
                      )}
                    </div>

                    {isChecked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0"
                      >
                        <Check className="w-5 h-5 text-green-400" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Progress indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 rounded-lg p-3 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Accepted</span>
              <span className="text-white text-sm font-medium">
                {acceptedCount} / {CONSENT_ITEMS.length}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(acceptedCount / CONSENT_ITEMS.length) * 100}%`,
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
              />
            </div>
          </motion.div>

          {/* Legal note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-gray-500 text-xs"
          >
            By continuing, you confirm that you have read and understood all terms.
          </motion.p>
        </div>

        <StepTip>
          Required items (*) must be accepted to complete registration.
        </StepTip>
      </StepCard>

      <StepNavigation
        onNext={handleContinue}
        onPrevious={previousStep}
        isDisabled={!allRequiredAccepted}
        nextLabel={allRequiredAccepted ? 'Complete Registration' : 'Accept Required Terms'}
      />
    </div>
  );
};

export default MaidConsentsStep;
