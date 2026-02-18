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
import { salaryRanges } from '@/data/maidProfileData';
import { DollarSign, Calendar, CreditCard, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Payment frequency options
const PAYMENT_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly', icon: '📅' },
  { value: 'bi-weekly', label: 'Bi-Weekly', icon: '📆' },
  { value: 'weekly', label: 'Weekly', icon: '🗓️' },
];

// Contract duration options
const CONTRACT_DURATIONS = [
  { value: '1-year', label: '1 Year', description: 'Standard contract' },
  { value: '2-years', label: '2 Years', description: 'Extended contract' },
  { value: '6-months', label: '6 Months', description: 'Short-term' },
  { value: 'flexible', label: 'Flexible', description: 'To be discussed' },
];

// Benefits options
const BENEFITS_OPTIONS = [
  { value: 'food', label: 'Food Provided', icon: '🍽️' },
  { value: 'housing', label: 'Housing Provided', icon: '🏠' },
  { value: 'insurance', label: 'Health Insurance', icon: '🏥' },
  { value: 'annual_leave', label: 'Annual Leave', icon: '✈️' },
  { value: 'ticket_home', label: 'Annual Ticket Home', icon: '🎫' },
  { value: 'phone', label: 'Phone Allowance', icon: '📱' },
];

const SponsorBudgetStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Get current selections
  const selectedBenefits = formData.benefits || [];

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case 'salary_budget':
        if (!value) return 'Please select your salary budget';
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

  // Toggle benefit
  const toggleBenefit = (benefit) => {
    const current = selectedBenefits;
    const newList = current.includes(benefit)
      ? current.filter((b) => b !== benefit)
      : [...current, benefit];
    updateFormData({ benefits: newList });
  };

  // Validate all
  const validateAll = () => {
    const fields = ['salary_budget'];
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
      awardPoints(20, 'Budget set');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid = formData.salary_budget;

  // Get salary display
  const getSalaryInfo = (range) => {
    if (range?.includes('1000')) return { level: 'Entry', color: 'text-green-400' };
    if (range?.includes('1500')) return { level: 'Standard', color: 'text-blue-400' };
    if (range?.includes('2000')) return { level: 'Premium', color: 'text-purple-400' };
    if (range?.includes('2500') || range?.includes('3000')) return { level: 'Executive', color: 'text-yellow-400' };
    return { level: '', color: 'text-gray-400' };
  };

  const salaryInfo = getSalaryInfo(formData.salary_budget);

  return (
    <div className="space-y-4">
      <StepCard
        title="Salary & Budget"
        description="What's your budget for hiring?"
        icon={DollarSign}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Salary Budget */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Monthly Salary Budget *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.salary_budget || ''}
                onValueChange={(value) => handleChange('salary_budget', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.salary_budget && errors.salary_budget && 'border-red-500',
                    !formData.salary_budget && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('salary_budget')}
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
                      <span className="flex items-center gap-2">
                        <span>💰</span>
                        {range}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {touched.salary_budget && errors.salary_budget && (
              <StepError message={errors.salary_budget} />
            )}
            {formData.salary_budget && (
              <p className={cn('text-xs mt-1', salaryInfo.color)}>
                {salaryInfo.level} level salary range
              </p>
            )}
          </motion.div>

          {/* Payment Frequency */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Payment Frequency <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.payment_frequency || ''}
                onValueChange={(value) => handleChange('payment_frequency', value)}
              >
                <SelectTrigger className="pl-10 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="How often will you pay?" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {PAYMENT_FREQUENCIES.map((freq) => (
                    <SelectItem
                      key={freq.value}
                      value={freq.value}
                      className="text-white hover:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <span>{freq.icon}</span>
                        {freq.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Contract Duration */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Contract Duration <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.contract_duration || ''}
                onValueChange={(value) => handleChange('contract_duration', value)}
              >
                <SelectTrigger className="pl-10 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Expected contract length" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {CONTRACT_DURATIONS.map((dur) => (
                    <SelectItem
                      key={dur.value}
                      value={dur.value}
                      className="text-white hover:bg-gray-700"
                    >
                      <span className="flex flex-col">
                        <span>{dur.label}</span>
                        <span className="text-xs text-gray-400">{dur.description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Benefits Offered */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">
                Benefits Offered <span className="text-gray-500">(optional)</span>
              </label>
              {selectedBenefits.length > 0 && (
                <span className="text-xs text-green-400">
                  {selectedBenefits.length} selected
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {BENEFITS_OPTIONS.map((benefit) => {
                const isSelected = selectedBenefits.includes(benefit.value);
                return (
                  <button
                    key={benefit.value}
                    onClick={() => toggleBenefit(benefit.value)}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all',
                      isSelected
                        ? 'bg-green-600/20 border-green-500 text-white'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    <span className="text-lg">{benefit.icon}</span>
                    <span className="text-sm">{benefit.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Budget Summary */}
          {formData.salary_budget && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <h4 className="text-white text-sm font-medium mb-2">Budget Summary</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span>{formData.salary_budget} / month</span>
                </div>
                {formData.payment_frequency && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>Paid {formData.payment_frequency}</span>
                  </div>
                )}
                {formData.contract_duration && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span>
                      {CONTRACT_DURATIONS.find((d) => d.value === formData.contract_duration)?.label} contract
                    </span>
                  </div>
                )}
                {selectedBenefits.length > 0 && (
                  <div className="flex items-start gap-2 text-gray-300">
                    <Info className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <span>
                      + {selectedBenefits.length} benefit{selectedBenefits.length > 1 ? 's' : ''} included
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <StepTip>
          Competitive salaries and benefits attract better candidates faster.
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

export default SponsorBudgetStep;
