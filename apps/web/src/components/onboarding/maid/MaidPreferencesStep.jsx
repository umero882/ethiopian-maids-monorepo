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
import { salaryRanges, workPreferences, contractTypes, accommodationPreferences } from '@/data/maidProfileData';
import { DollarSign, Briefcase, Home, FileText, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const MaidPreferencesStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Get current selections
  const selectedWorkPrefs = formData.work_preferences || [];

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case 'expected_salary':
        if (!value) return 'Please select your expected salary range';
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

  // Toggle work preference
  const toggleWorkPref = (pref) => {
    const current = selectedWorkPrefs;
    const newPrefs = current.includes(pref)
      ? current.filter((p) => p !== pref)
      : [...current, pref];

    updateFormData({ work_preferences: newPrefs });
  };

  // Validate all
  const validateAll = () => {
    const newErrors = {};
    const salaryError = validateField('expected_salary', formData.expected_salary);
    if (salaryError) newErrors.expected_salary = salaryError;

    setErrors(newErrors);
    setTouched({ expected_salary: true });

    return Object.keys(newErrors).length === 0;
  };

  // Handle continue
  const handleContinue = () => {
    if (validateAll()) {
      awardPoints(25, 'Preferences set');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid = formData.expected_salary;

  // Get salary display
  const getSalaryDisplay = (range) => {
    if (range === '4000+') return 'AED 4,000+ per month';
    return `AED ${range} per month`;
  };

  // Get work preference icon
  const getWorkPrefIcon = (pref) => {
    const icons = {
      'Live-in': '🏠',
      'Live-out': '🚶',
      'Part-time': '⏰',
      'Full-time': '📅',
      'Flexible hours': '🔄',
      'Weekend only': '📆',
      'Weekdays only': '📋',
    };
    return icons[pref] || '📌';
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Work Preferences"
        description="What are you looking for?"
        icon={Briefcase}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Expected Salary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Expected Monthly Salary (AED) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.expected_salary || ''}
                onValueChange={(value) => handleChange('expected_salary', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.expected_salary && errors.expected_salary && 'border-red-500',
                    !formData.expected_salary && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('expected_salary')}
                >
                  <SelectValue placeholder="Select salary range" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {salaryRanges.map((range) => (
                    <SelectItem
                      key={range}
                      value={range}
                      className="text-white hover:bg-gray-700"
                    >
                      {getSalaryDisplay(range)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {touched.expected_salary && errors.expected_salary && (
              <StepError message={errors.expected_salary} />
            )}
          </motion.div>

          {/* Work Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Work Type <span className="text-gray-500">(optional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Select all that you're open to
            </p>

            <div className="grid grid-cols-2 gap-2">
              {workPreferences.map((pref, index) => {
                const isSelected = selectedWorkPrefs.includes(pref);
                return (
                  <motion.button
                    key={pref}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => toggleWorkPref(pref)}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left',
                      isSelected
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    <span className="text-lg">{getWorkPrefIcon(pref)}</span>
                    <span className="flex-1 text-sm truncate">{pref}</span>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Contract Type */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Preferred Contract <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.contract_type || ''}
                onValueChange={(value) => handleChange('contract_type', value)}
              >
                <SelectTrigger className="pl-10 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {contractTypes.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="text-white hover:bg-gray-700"
                    >
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Accommodation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Accommodation Preference <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.accommodation_preference || ''}
                onValueChange={(value) => handleChange('accommodation_preference', value)}
              >
                <SelectTrigger className="pl-10 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select accommodation preference" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {accommodationPreferences.map((pref) => (
                    <SelectItem
                      key={pref}
                      value={pref}
                      className="text-white hover:bg-gray-700"
                    >
                      {pref}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 rounded-lg p-3 border border-white/10"
          >
            <h4 className="text-white text-sm font-medium mb-2">Your Preferences</h4>
            <div className="space-y-1.5 text-sm">
              {formData.expected_salary && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">
                    {getSalaryDisplay(formData.expected_salary)}
                  </span>
                </div>
              )}
              {selectedWorkPrefs.length > 0 && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">
                    {selectedWorkPrefs.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <StepTip>
          Clear preferences help families find the right match for their needs.
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

export default MaidPreferencesStep;
