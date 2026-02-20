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
import { nationalities, religions, maritalStatuses } from '@/data/maidProfileData';
import { User, Calendar, Globe, Heart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const MaidPersonalStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation functions
  const validateField = (field, value) => {
    switch (field) {
      case 'full_name':
        if (!value) return 'Full name is required';
        if (value.length < 2) return 'Name is too short';
        return null;
      case 'date_of_birth':
        if (!value) return 'Date of birth is required';
        const age = calculateAge(value);
        if (age < 18) return 'You must be at least 18 years old';
        if (age > 65) return 'Age must be 65 or under';
        return null;
      case 'nationality':
        if (!value) return 'Nationality is required';
        return null;
      case 'religion':
        if (!value) return 'Please select an option';
        return null;
      case 'marital_status':
        if (!value) return 'Marital status is required';
        return null;
      default:
        return null;
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Handle input change
  const handleChange = (field, value) => {
    updateFormData({ [field]: value });

    // Clear error on change
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

  // Validate all fields
  const validateAll = () => {
    const fields = ['full_name', 'date_of_birth', 'nationality', 'religion', 'marital_status'];
    const newErrors = {};

    fields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    setTouched(
      fields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    );

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
    formData.date_of_birth &&
    formData.nationality &&
    formData.religion &&
    formData.marital_status &&
    !validateField('full_name', formData.full_name) &&
    !validateField('date_of_birth', formData.date_of_birth);

  // Get max date (must be at least 18)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Get min date (must be 65 or under)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 65);
  const minDateString = minDate.toISOString().split('T')[0];

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

          {/* Date of Birth */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Date of Birth *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                onBlur={() => handleBlur('date_of_birth')}
                min={minDateString}
                max={maxDateString}
                className={cn(
                  'pl-10 bg-white/10 border-white/20 text-white',
                  touched.date_of_birth && errors.date_of_birth && 'border-red-500'
                )}
              />
            </div>
            {touched.date_of_birth && errors.date_of_birth && (
              <StepError message={errors.date_of_birth} />
            )}
            {formData.date_of_birth && !errors.date_of_birth && (
              <p className="text-xs text-gray-400 mt-1">
                Age: {calculateAge(formData.date_of_birth)} years old
              </p>
            )}
          </motion.div>

          {/* Nationality */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Nationality *</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.nationality || ''}
                onValueChange={(value) => handleChange('nationality', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.nationality && errors.nationality && 'border-red-500',
                    !formData.nationality && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('nationality')}
                >
                  <SelectValue placeholder="Select your nationality" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  {nationalities.map((nat) => (
                    <SelectItem
                      key={nat}
                      value={nat}
                      className="text-white hover:bg-gray-700"
                    >
                      {nat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {touched.nationality && errors.nationality && (
              <StepError message={errors.nationality} />
            )}
          </motion.div>

          {/* Religion */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Religion *</label>
            <div className="relative">
              <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.religion || ''}
                onValueChange={(value) => handleChange('religion', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.religion && errors.religion && 'border-red-500',
                    !formData.religion && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('religion')}
                >
                  <SelectValue placeholder="Select your religion" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {religions.map((rel) => (
                    <SelectItem
                      key={rel}
                      value={rel}
                      className="text-white hover:bg-gray-700"
                    >
                      {rel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {touched.religion && errors.religion && (
              <StepError message={errors.religion} />
            )}
          </motion.div>

          {/* Marital Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Marital Status *</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.marital_status || ''}
                onValueChange={(value) => handleChange('marital_status', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.marital_status && errors.marital_status && 'border-red-500',
                    !formData.marital_status && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('marital_status')}
                >
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {maritalStatuses.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="text-white hover:bg-gray-700"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {touched.marital_status && errors.marital_status && (
              <StepError message={errors.marital_status} />
            )}
          </motion.div>
        </div>

        <StepTip>
          This information helps families find the right match for their needs.
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

export default MaidPersonalStep;
