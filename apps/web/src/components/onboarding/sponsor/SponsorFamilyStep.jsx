import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Baby, Heart, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// Family size options
const FAMILY_SIZES = [
  { value: '1', label: '1 person (Single)', icon: '👤' },
  { value: '2', label: '2 people (Couple)', icon: '👥' },
  { value: '3-4', label: '3-4 people (Small family)', icon: '👨‍👩‍👧' },
  { value: '5-6', label: '5-6 people (Medium family)', icon: '👨‍👩‍👧‍👦' },
  { value: '7+', label: '7+ people (Large family)', icon: '👨‍👩‍👧‍👦' },
];

// Children options
const CHILDREN_OPTIONS = [
  { value: 'none', label: 'No children', icon: '✖️' },
  { value: 'infants', label: 'Infants (0-2 years)', icon: '👶' },
  { value: 'toddlers', label: 'Toddlers (2-5 years)', icon: '🧒' },
  { value: 'children', label: 'Children (5-12 years)', icon: '👧' },
  { value: 'teenagers', label: 'Teenagers (12+ years)', icon: '👩' },
  { value: 'mixed', label: 'Mixed ages', icon: '👨‍👩‍👧‍👦' },
];

// Elderly care options
const ELDERLY_OPTIONS = [
  { value: 'none', label: 'No elderly members', icon: '✖️' },
  { value: 'one', label: 'One elderly member', icon: '👵' },
  { value: 'multiple', label: 'Multiple elderly members', icon: '👴👵' },
];

// Property types
const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', icon: '🏢' },
  { value: 'villa', label: 'Villa', icon: '🏡' },
  { value: 'townhouse', label: 'Townhouse', icon: '🏘️' },
  { value: 'compound', label: 'Compound Villa', icon: '🏛️' },
  { value: 'other', label: 'Other', icon: '🏠' },
];

const SponsorFamilyStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case 'family_size':
        if (!value) return 'Please select your family size';
        return null;
      case 'property_type':
        if (!value) return 'Please select your property type';
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
    const fields = ['family_size', 'property_type'];
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
      awardPoints(25, 'Family info completed');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid = formData.family_size && formData.property_type;

  return (
    <div className="space-y-4">
      <StepCard
        title="Family Details"
        description="Tell us about your household"
        icon={Users}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Family Size */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Family Size *</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.family_size || ''}
                onValueChange={(value) => handleChange('family_size', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.family_size && errors.family_size && 'border-red-500',
                    !formData.family_size && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('family_size')}
                >
                  <SelectValue placeholder="Select family size" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {FAMILY_SIZES.map((size) => (
                    <SelectItem
                      key={size.value}
                      value={size.value}
                      className="text-white hover:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <span>{size.icon}</span>
                        {size.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {touched.family_size && errors.family_size && (
              <StepError message={errors.family_size} />
            )}
          </motion.div>

          {/* Children */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Children <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <Baby className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.children || ''}
                onValueChange={(value) => handleChange('children', value)}
              >
                <SelectTrigger className="pl-10 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Do you have children?" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {CHILDREN_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-white hover:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Elderly */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Elderly Members <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.elderly || ''}
                onValueChange={(value) => handleChange('elderly', value)}
              >
                <SelectTrigger className="pl-10 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Any elderly family members?" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {ELDERLY_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-white hover:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Property Type */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Property Type *</label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.property_type || ''}
                onValueChange={(value) => handleChange('property_type', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.property_type && errors.property_type && 'border-red-500',
                    !formData.property_type && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('property_type')}
                >
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {PROPERTY_TYPES.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-white hover:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {touched.property_type && errors.property_type && (
              <StepError message={errors.property_type} />
            )}
          </motion.div>

          {/* Family summary */}
          {(formData.family_size || formData.children || formData.property_type) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <h4 className="text-white text-sm font-medium mb-2">Your Household</h4>
              <div className="space-y-1.5 text-sm">
                {formData.family_size && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>{FAMILY_SIZES.find(s => s.value === formData.family_size)?.label}</span>
                  </div>
                )}
                {formData.children && formData.children !== 'none' && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Baby className="w-4 h-4 text-blue-400" />
                    <span>{CHILDREN_OPTIONS.find(c => c.value === formData.children)?.label}</span>
                  </div>
                )}
                {formData.property_type && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Home className="w-4 h-4 text-green-400" />
                    <span>{PROPERTY_TYPES.find(p => p.value === formData.property_type)?.label}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <StepTip>
          This helps us recommend domestic workers with relevant experience.
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

export default SponsorFamilyStep;
