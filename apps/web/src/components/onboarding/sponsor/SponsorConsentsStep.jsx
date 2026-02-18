import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Shield, Bell, Scale, ExternalLink, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Consent items
const CONSENT_ITEMS = [
  {
    id: 'terms',
    label: 'Terms of Service',
    description: 'I agree to the platform terms of service for sponsors',
    required: true,
    icon: FileText,
    link: '/terms',
  },
  {
    id: 'privacy',
    label: 'Privacy Policy',
    description: 'I consent to the collection and processing of my personal data',
    required: true,
    icon: Shield,
    link: '/privacy',
  },
  {
    id: 'background_check',
    label: 'Background Verification',
    description: 'I authorize verification of my identity and employment status',
    required: true,
    icon: Scale,
    link: null,
  },
  {
    id: 'communication',
    label: 'Communication Preferences',
    description: 'I agree to receive service updates and notifications',
    required: false,
    icon: Bell,
    link: null,
  },
];

// Fair employment commitment
const EMPLOYMENT_COMMITMENTS = [
  'Provide safe and healthy working conditions',
  'Pay agreed salary on time every month',
  'Respect labor law requirements for domestic workers',
  'Not confiscate passport or identity documents',
  'Provide adequate rest time and days off',
  'Treat domestic worker with dignity and respect',
];

const SponsorConsentsStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints, triggerCelebration } = useOnboarding();

  const [errors, setErrors] = useState({});

  // Get current consents
  const consents = formData.consents || {};
  const employmentCommitment = formData.employment_commitment || false;

  // Toggle consent
  const toggleConsent = (id) => {
    const newConsents = {
      ...consents,
      [id]: !consents[id],
    };
    updateFormData({ consents: newConsents });

    // Clear error if checking
    if (!consents[id] && errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: null }));
    }
  };

  // Toggle employment commitment
  const toggleEmploymentCommitment = () => {
    updateFormData({ employment_commitment: !employmentCommitment });
    if (!employmentCommitment && errors.employment_commitment) {
      setErrors((prev) => ({ ...prev, employment_commitment: null }));
    }
  };

  // Accept all required
  const acceptAllRequired = () => {
    const newConsents = { ...consents };
    CONSENT_ITEMS.forEach((item) => {
      if (item.required) {
        newConsents[item.id] = true;
      }
    });
    updateFormData({
      consents: newConsents,
      employment_commitment: true,
    });
    setErrors({});
  };

  // Validate
  const validateAll = () => {
    const newErrors = {};

    CONSENT_ITEMS.forEach((item) => {
      if (item.required && !consents[item.id]) {
        newErrors[item.id] = `You must accept the ${item.label}`;
      }
    });

    if (!employmentCommitment) {
      newErrors.employment_commitment = 'You must agree to the fair employment commitment';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle continue
  const handleContinue = () => {
    if (validateAll()) {
      awardPoints(50, 'Consents completed');
      triggerCelebration('confetti-burst');
      nextStep();
    }
  };

  // Check if all required are accepted
  const allRequiredAccepted =
    CONSENT_ITEMS.filter((i) => i.required).every((i) => consents[i.id]) &&
    employmentCommitment;

  // Count accepted
  const acceptedCount =
    CONSENT_ITEMS.filter((i) => consents[i.id]).length +
    (employmentCommitment ? 1 : 0);

  const totalRequired =
    CONSENT_ITEMS.filter((i) => i.required).length + 1; // +1 for employment commitment

  return (
    <div className="space-y-4">
      <StepCard
        title="Terms & Agreements"
        description="Review and accept to continue"
        icon={FileText}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Accept all required button */}
          {!allRequiredAccepted && (
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={acceptAllRequired}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Accept All Required
            </motion.button>
          )}

          {/* Progress indicator */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Agreements Progress</span>
            <span className={cn(
              'font-medium',
              allRequiredAccepted ? 'text-green-400' : 'text-gray-300'
            )}>
              {acceptedCount}/{CONSENT_ITEMS.length + 1} accepted
            </span>
          </div>

          {/* Consent items */}
          <div className="space-y-3">
            {CONSENT_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const isChecked = consents[item.id] || false;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'p-3 rounded-lg border transition-all',
                    isChecked
                      ? 'bg-green-600/10 border-green-500/50'
                      : errors[item.id]
                      ? 'bg-red-600/10 border-red-500/50'
                      : 'bg-white/5 border-white/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={item.id}
                      checked={isChecked}
                      onCheckedChange={() => toggleConsent(item.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className={cn(
                          'w-4 h-4',
                          isChecked ? 'text-green-400' : 'text-gray-400'
                        )} />
                        <label
                          htmlFor={item.id}
                          className="text-white text-sm font-medium cursor-pointer"
                        >
                          {item.label}
                          {item.required && (
                            <span className="text-red-400 ml-1">*</span>
                          )}
                        </label>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mt-1">{item.description}</p>
                    </div>
                    {isChecked && (
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                  {errors[item.id] && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors[item.id]}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Fair Employment Commitment */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              'p-4 rounded-lg border transition-all',
              employmentCommitment
                ? 'bg-blue-600/10 border-blue-500/50'
                : errors.employment_commitment
                ? 'bg-red-600/10 border-red-500/50'
                : 'bg-white/5 border-white/20'
            )}
          >
            <div className="flex items-start gap-3 mb-3">
              <Checkbox
                id="employment_commitment"
                checked={employmentCommitment}
                onCheckedChange={toggleEmploymentCommitment}
                className="mt-0.5"
              />
              <div>
                <label
                  htmlFor="employment_commitment"
                  className="text-white text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <Scale className={cn(
                    'w-4 h-4',
                    employmentCommitment ? 'text-blue-400' : 'text-gray-400'
                  )} />
                  Fair Employment Commitment
                  <span className="text-red-400">*</span>
                </label>
                <p className="text-gray-400 text-xs mt-1">
                  I commit to ethical treatment of domestic workers
                </p>
              </div>
              {employmentCommitment && (
                <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
              )}
            </div>

            <div className="ml-7 space-y-1.5">
              {EMPLOYMENT_COMMITMENTS.map((commitment, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-gray-400"
                >
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    employmentCommitment ? 'bg-blue-400' : 'bg-gray-600'
                  )} />
                  {commitment}
                </div>
              ))}
            </div>

            {errors.employment_commitment && (
              <p className="text-red-400 text-xs mt-3 flex items-center gap-1 ml-7">
                <AlertTriangle className="w-3 h-3" />
                {errors.employment_commitment}
              </p>
            )}
          </motion.div>

          {/* Final confirmation */}
          {allRequiredAccepted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-green-400 text-sm font-medium">
                  All agreements accepted
                </p>
                <p className="text-gray-400 text-xs">
                  You're ready to complete your sponsor profile!
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <StepTip>
          We take ethical employment seriously. Your commitment protects workers.
        </StepTip>
      </StepCard>

      <StepNavigation
        onNext={handleContinue}
        onPrevious={previousStep}
        isDisabled={!allRequiredAccepted}
        nextLabel="Complete Profile"
      />
    </div>
  );
};

export default SponsorConsentsStep;
