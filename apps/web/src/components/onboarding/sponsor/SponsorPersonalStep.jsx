import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Briefcase, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Occupation options for sponsors
const OCCUPATIONS = [
  'Business Owner',
  'Government Employee',
  'Private Sector Employee',
  'Self-Employed',
  'Retired',
  'Diplomat',
  'Medical Professional',
  'Legal Professional',
  'Engineer',
  'Educator',
  'Military/Police',
  'Homemaker',
  'Other',
];

const SponsorPersonalStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case 'full_name':
        if (!value) return 'Full name is required';
        if (value.length < 2) return 'Name is too short';
        return null;
      case 'occupation':
        if (!value) return 'Please select your occupation';
        return null;
      default:
        return null;
    }
  };

  // Handle input change
  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle blur
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Validate all
  const validateAll = () => {
    const fields = ['full_name', 'occupation'];
    const newErrors = {};

    fields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    setTouched(fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));

    return Object.keys(newErrors).length === 0;
  };

  // Handle continue
  const handleContinue = () => {
    if (validateAll()) {
      awardPoints(30, 'Personal info completed');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid =
    formData.full_name &&
    formData.occupation &&
    !validateField('full_name', formData.full_name);

  return (
    <div className="space-y-4">
      <StepCard
        title="Personal Information"
        description="Tell us about yourself"
        icon={User}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Full Name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.full_name || ''}
                onChange={(e) => handleChange('full_name', e.target.value)}
                onBlur={() => handleBlur('full_name')}
                className={cn(
                  'pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400',
                  touched.full_name && errors.full_name && 'border-red-500'
                )}
              />
            </div>
            {touched.full_name && errors.full_name && (
              <StepError message={errors.full_name} />
            )}
          </motion.div>

          {/* Occupation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Occupation *</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.occupation || ''}
                onValueChange={(value) => handleChange('occupation', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.occupation && errors.occupation && 'border-red-500',
                    !formData.occupation && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('occupation')}
                >
                  <SelectValue placeholder="Select your occupation" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  {OCCUPATIONS.map((occ) => (
                    <SelectItem
                      key={occ}
                      value={occ}
                      className="text-white hover:bg-gray-700"
                    >
                      {occ}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {touched.occupation && errors.occupation && (
              <StepError message={errors.occupation} />
            )}
          </motion.div>

          {/* Company (optional) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Company/Employer <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Company or employer name"
                value={formData.company || ''}
                onChange={(e) => handleChange('company', e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </motion.div>
        </div>

        <StepTip>
          Your occupation helps us match you with suitable domestic workers.
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

export default SponsorPersonalStep;
