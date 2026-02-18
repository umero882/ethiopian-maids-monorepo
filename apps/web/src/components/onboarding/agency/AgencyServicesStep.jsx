import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Briefcase, Check, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

// Service categories
const SERVICE_CATEGORIES = [
  {
    id: 'recruitment',
    name: 'Recruitment Services',
    services: [
      { id: 'housemaid', label: 'Housemaids', icon: '🏠' },
      { id: 'nanny', label: 'Nannies/Babysitters', icon: '👶' },
      { id: 'driver', label: 'Drivers', icon: '🚗' },
      { id: 'cook', label: 'Cooks/Chefs', icon: '👨‍🍳' },
      { id: 'elderly_care', label: 'Elderly Care', icon: '👴' },
      { id: 'nurse', label: 'Private Nurses', icon: '👩‍⚕️' },
      { id: 'gardener', label: 'Gardeners', icon: '🌿' },
      { id: 'security', label: 'Security Guards', icon: '👮' },
    ],
  },
  {
    id: 'additional',
    name: 'Additional Services',
    services: [
      { id: 'visa_processing', label: 'Visa Processing', icon: '📄' },
      { id: 'medical_check', label: 'Medical Checkups', icon: '🏥' },
      { id: 'training', label: 'Pre-Deployment Training', icon: '📚' },
      { id: 'translation', label: 'Translation Services', icon: '🗣️' },
      { id: 'airport_transfer', label: 'Airport Transfers', icon: '✈️' },
      { id: 'replacement', label: 'Replacement Guarantee', icon: '🔄' },
      { id: 'legal', label: 'Legal Support', icon: '⚖️' },
      { id: 'followup', label: 'Post-Placement Follow-up', icon: '📞' },
    ],
  },
];

// Specializations
const SPECIALIZATIONS = [
  { id: 'ethiopian', label: 'Ethiopian Workers', flag: '🇪🇹' },
  { id: 'filipino', label: 'Filipino Workers', flag: '🇵🇭' },
  { id: 'indonesian', label: 'Indonesian Workers', flag: '🇮🇩' },
  { id: 'srilankan', label: 'Sri Lankan Workers', flag: '🇱🇰' },
  { id: 'indian', label: 'Indian Workers', flag: '🇮🇳' },
  { id: 'bangladeshi', label: 'Bangladeshi Workers', flag: '🇧🇩' },
];

const AgencyServicesStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints, triggerCelebration } = useOnboarding();

  const [errors, setErrors] = useState({});

  // Get current selections
  const selectedServices = formData.services || [];
  const selectedSpecializations = formData.specializations || [];

  // Toggle service
  const toggleService = (serviceId) => {
    const current = selectedServices;
    const newList = current.includes(serviceId)
      ? current.filter((s) => s !== serviceId)
      : [...current, serviceId];
    updateFormData({ services: newList });

    // Award achievement for 5+ services
    if (newList.length === 5 && !current.includes(serviceId)) {
      triggerCelebration('confetti-burst');
    }

    if (errors.services) {
      setErrors((prev) => ({ ...prev, services: null }));
    }
  };

  // Toggle specialization
  const toggleSpecialization = (specId) => {
    const current = selectedSpecializations;
    const newList = current.includes(specId)
      ? current.filter((s) => s !== specId)
      : [...current, specId];
    updateFormData({ specializations: newList });
  };

  // Validate
  const validateAll = () => {
    const newErrors = {};

    if (selectedServices.length === 0) {
      newErrors.services = 'Please select at least one service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle continue
  const handleContinue = () => {
    if (validateAll()) {
      awardPoints(30, 'Services configured');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid = selectedServices.length > 0;

  // Get all services flat list
  const getAllServices = () => {
    return SERVICE_CATEGORIES.flatMap((cat) => cat.services);
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Services Offered"
        description="What does your agency provide?"
        icon={Briefcase}
        showHeader={true}
      >
        <div className="space-y-5 mt-4">
          {/* Service Categories */}
          {SERVICE_CATEGORIES.map((category, catIdx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">{category.name}</h3>
                <span className="text-xs text-purple-400">
                  {category.services.filter((s) => selectedServices.includes(s.id)).length} selected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {category.services.map((service) => {
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={cn(
                        'flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all text-sm',
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 text-white'
                          : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                      )}
                    >
                      <span className="text-lg">{service.icon}</span>
                      <span className="flex-1 truncate">{service.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-green-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {errors.services && (
            <StepError message={errors.services} />
          )}

          {/* Specializations */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Specializations
                <span className="text-gray-500">(optional)</span>
              </label>
              {selectedSpecializations.length > 0 && (
                <span className="text-xs text-green-400">
                  {selectedSpecializations.length} selected
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((spec) => {
                const isSelected = selectedSpecializations.includes(spec.id);
                return (
                  <button
                    key={spec.id}
                    onClick={() => toggleSpecialization(spec.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all',
                      isSelected
                        ? 'bg-green-600/30 border-green-500 text-white'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    <span>{spec.flag}</span>
                    {spec.label}
                    {isSelected && <Check className="w-3 h-3 text-green-400" />}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Services Summary */}
          {selectedServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <h4 className="text-white text-sm font-medium mb-2">Services Summary</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Briefcase className="w-4 h-4 text-purple-400 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {selectedServices.slice(0, 6).map((serviceId) => {
                      const service = getAllServices().find((s) => s.id === serviceId);
                      return (
                        <span
                          key={serviceId}
                          className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full"
                        >
                          {service?.icon} {service?.label}
                        </span>
                      );
                    })}
                    {selectedServices.length > 6 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full">
                        +{selectedServices.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                {selectedSpecializations.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-green-400 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {selectedSpecializations.map((specId) => {
                        const spec = SPECIALIZATIONS.find((s) => s.id === specId);
                        return (
                          <span
                            key={specId}
                            className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full"
                          >
                            {spec?.flag} {spec?.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Achievement hint */}
          {selectedServices.length >= 3 && selectedServices.length < 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-xs text-purple-400">
                Add {5 - selectedServices.length} more service{5 - selectedServices.length > 1 ? 's' : ''} to unlock "Service Pro" badge!
              </p>
            </motion.div>
          )}
        </div>

        <StepTip>
          Agencies with diverse services get 50% more visibility.
        </StepTip>
      </StepCard>

      <StepNavigation
        onNext={handleContinue}
        onPrevious={previousStep}
        isDisabled={!isFormValid}
        nextLabel="Continue"
      />
    </div>
  );
};

export default AgencyServicesStep;
