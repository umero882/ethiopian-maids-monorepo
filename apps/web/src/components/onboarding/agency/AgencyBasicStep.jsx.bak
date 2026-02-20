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
import { Building2, FileText, Calendar, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

// Agency types
const AGENCY_TYPES = [
  { value: 'recruitment', label: 'Recruitment Agency', icon: '🏢' },
  { value: 'placement', label: 'Placement Agency', icon: '📋' },
  { value: 'manpower', label: 'Manpower Services', icon: '👥' },
  { value: 'hr_consulting', label: 'HR Consulting', icon: '💼' },
  { value: 'domestic_services', label: 'Domestic Services Agency', icon: '🏠' },
  { value: 'other', label: 'Other', icon: '📎' },
];

// Years in business
const YEARS_IN_BUSINESS = [
  { value: 'new', label: 'Less than 1 year', icon: '🌱' },
  { value: '1-3', label: '1-3 years', icon: '📈' },
  { value: '3-5', label: '3-5 years', icon: '⭐' },
  { value: '5-10', label: '5-10 years', icon: '🏆' },
  { value: '10+', label: 'More than 10 years', icon: '👑' },
];

// Generate years for dropdown
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1980; year--) {
    years.push(year.toString());
  }
  return years;
};

const AgencyBasicStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case 'agency_name':
        if (!value) return 'Agency name is required';
        if (value.length < 2) return 'Name is too short';
        return null;
      case 'license_number':
        if (!value) return 'License number is required';
        if (value.length < 3) return 'License number is too short';
        return null;
      case 'agency_type':
        if (!value) return 'Please select agency type';
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
    const fields = ['agency_name', 'license_number', 'agency_type'];
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
      awardPoints(30, 'Agency info completed');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid =
    formData.agency_name &&
    formData.license_number &&
    formData.agency_type &&
    !validateField('agency_name', formData.agency_name) &&
    !validateField('license_number', formData.license_number);

  return (
    <div className="space-y-4">
      <StepCard
        title="Agency Information"
        description="Tell us about your agency"
        icon={Building2}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Agency Name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Agency Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Enter your agency name"
                value={formData.agency_name || ''}
                onChange={(e) => handleChange('agency_name', e.target.value)}
                onBlur={() => handleBlur('agency_name')}
                className={cn(
                  'pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400',
                  touched.agency_name && errors.agency_name && 'border-red-500'
                )}
              />
            </div>
            {touched.agency_name && errors.agency_name && (
              <StepError message={errors.agency_name} />
            )}
          </motion.div>

          {/* License Number */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Trade License Number *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Enter trade license number"
                value={formData.license_number || ''}
                onChange={(e) => handleChange('license_number', e.target.value)}
                onBlur={() => handleBlur('license_number')}
                className={cn(
                  'pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400',
                  touched.license_number && errors.license_number && 'border-red-500'
                )}
              />
            </div>
            {touched.license_number && errors.license_number && (
              <StepError message={errors.license_number} />
            )}
            <p className="text-xs text-gray-500 mt-1">
              This will be verified during approval.
            </p>
          </motion.div>

          {/* Agency Type */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Agency Type *
            </label>
            <Select
              value={formData.agency_type || ''}
              onValueChange={(value) => handleChange('agency_type', value)}
            >
              <SelectTrigger
                className={cn(
                  'bg-white/10 border-white/20 text-white',
                  touched.agency_type && errors.agency_type && 'border-red-500',
                  !formData.agency_type && 'text-gray-400'
                )}
                onBlur={() => handleBlur('agency_type')}
              >
                <SelectValue placeholder="Select agency type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {AGENCY_TYPES.map((type) => (
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
            {touched.agency_type && errors.agency_type && (
              <StepError message={errors.agency_type} />
            )}
          </motion.div>

          {/* Years in Business */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Years in Business <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.years_in_business || ''}
                onValueChange={(value) => handleChange('years_in_business', value)}
              >
                <SelectTrigger className="pl-10 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="How long have you been operating?" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {YEARS_IN_BUSINESS.map((option) => (
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

          {/* Website (optional) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Website <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="url"
                placeholder="https://www.youragency.com"
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </motion.div>

          {/* Agency Summary */}
          {formData.agency_name && formData.agency_type && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <h4 className="text-white text-sm font-medium mb-2">Agency Profile</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span>{formData.agency_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>License: {formData.license_number}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-lg">
                    {AGENCY_TYPES.find((t) => t.value === formData.agency_type)?.icon}
                  </span>
                  <span>
                    {AGENCY_TYPES.find((t) => t.value === formData.agency_type)?.label}
                  </span>
                </div>
                {formData.years_in_business && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-green-400" />
                    <span>
                      {YEARS_IN_BUSINESS.find((y) => y.value === formData.years_in_business)?.label}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <StepTip>
          Agencies with complete profiles attract 40% more candidates.
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

export default AgencyBasicStep;
