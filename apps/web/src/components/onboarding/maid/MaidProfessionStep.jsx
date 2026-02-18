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
import { positions, visaStatuses, educationLevels } from '@/data/maidProfileData';
import { Briefcase, FileCheck, GraduationCap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const MaidProfessionStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case 'profession':
        if (!value) return 'Please select your profession';
        return null;
      case 'visa_status':
        if (!value) return 'Please select your visa status';
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
    const fields = ['profession', 'visa_status'];
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
      awardPoints(25, 'Profession info completed');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid =
    formData.profession &&
    formData.visa_status &&
    !validateField('profession', formData.profession) &&
    !validateField('visa_status', formData.visa_status);

  // Get profession icon
  const getProfessionEmoji = (profession) => {
    const emojis = {
      'Housemaid': '🏠',
      'Nanny': '👶',
      'Cook': '👨‍🍳',
      'Cleaner': '🧹',
      'Caregiver': '❤️',
      'Driver': '🚗',
      'Gardener': '🌱',
      'General Helper': '🤝',
      'Baby Sitter': '👶',
      'Elder Care': '👵',
      'Other': '💼',
    };
    return emojis[profession] || '💼';
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Professional Details"
        description="Tell us about your work"
        icon={Briefcase}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Profession */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Profession *</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.profession || ''}
                onValueChange={(value) => handleChange('profession', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.profession && errors.profession && 'border-red-500',
                    !formData.profession && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('profession')}
                >
                  <SelectValue placeholder="Select your profession" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {positions.map((position) => (
                    <SelectItem
                      key={position}
                      value={position}
                      className="text-white hover:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <span>{getProfessionEmoji(position)}</span>
                        {position}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {touched.profession && errors.profession && (
              <StepError message={errors.profession} />
            )}
          </motion.div>

          {/* Visa Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Visa Status *</label>
            <div className="relative">
              <FileCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.visa_status || ''}
                onValueChange={(value) => handleChange('visa_status', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.visa_status && errors.visa_status && 'border-red-500',
                    !formData.visa_status && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('visa_status')}
                >
                  <SelectValue placeholder="Select your visa status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {visaStatuses.map((status) => (
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
            {touched.visa_status && errors.visa_status && (
              <StepError message={errors.visa_status} />
            )}
          </motion.div>

          {/* Education Level (optional) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Education Level <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.education_level || ''}
                onValueChange={(value) => handleChange('education_level', value)}
              >
                <SelectTrigger className="pl-10 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {educationLevels.map((level) => (
                    <SelectItem
                      key={level}
                      value={level}
                      className="text-white hover:bg-gray-700"
                    >
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Quick profession highlights */}
          {formData.profession && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getProfessionEmoji(formData.profession)}</span>
                <span className="text-white font-medium">{formData.profession}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>High demand profession</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Many opportunities in GCC</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <StepTip>
          Accurate profession and visa details help match you with the right opportunities.
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

export default MaidProfessionStep;
