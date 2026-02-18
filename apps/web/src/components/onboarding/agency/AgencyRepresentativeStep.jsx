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
import { User, Briefcase, Mail, Phone, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

// Representative positions
const POSITIONS = [
  { value: 'owner', label: 'Owner / Founder', icon: '👑' },
  { value: 'ceo', label: 'CEO / Managing Director', icon: '🏢' },
  { value: 'manager', label: 'General Manager', icon: '📊' },
  { value: 'operations', label: 'Operations Manager', icon: '⚙️' },
  { value: 'hr', label: 'HR Manager', icon: '👥' },
  { value: 'recruitment', label: 'Recruitment Manager', icon: '📋' },
  { value: 'authorized', label: 'Authorized Representative', icon: '✍️' },
  { value: 'other', label: 'Other', icon: '📎' },
];

const AgencyRepresentativeStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case 'rep_name':
        if (!value) return 'Representative name is required';
        if (value.length < 2) return 'Name is too short';
        return null;
      case 'rep_position':
        if (!value) return 'Please select a position';
        return null;
      case 'rep_phone':
        if (!value) return 'Phone number is required';
        if (value.length < 8) return 'Phone number is too short';
        return null;
      case 'rep_email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
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
    const fields = ['rep_name', 'rep_position', 'rep_phone', 'rep_email'];
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
      awardPoints(30, 'Representative added');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid =
    formData.rep_name &&
    formData.rep_position &&
    formData.rep_phone &&
    formData.rep_email &&
    !validateField('rep_name', formData.rep_name) &&
    !validateField('rep_phone', formData.rep_phone) &&
    !validateField('rep_email', formData.rep_email);

  return (
    <div className="space-y-4">
      <StepCard
        title="Authorized Representative"
        description="Who will manage this account?"
        icon={Shield}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Info banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3"
          >
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">
              The authorized representative will be the primary contact and account manager for this agency.
            </p>
          </motion.div>

          {/* Representative Name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Enter representative's full name"
                value={formData.rep_name || ''}
                onChange={(e) => handleChange('rep_name', e.target.value)}
                onBlur={() => handleBlur('rep_name')}
                className={cn(
                  'pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400',
                  touched.rep_name && errors.rep_name && 'border-red-500'
                )}
              />
            </div>
            {touched.rep_name && errors.rep_name && (
              <StepError message={errors.rep_name} />
            )}
          </motion.div>

          {/* Position */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Position / Title *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.rep_position || ''}
                onValueChange={(value) => handleChange('rep_position', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.rep_position && errors.rep_position && 'border-red-500',
                    !formData.rep_position && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('rep_position')}
                >
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {POSITIONS.map((pos) => (
                    <SelectItem
                      key={pos.value}
                      value={pos.value}
                      className="text-white hover:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <span>{pos.icon}</span>
                        {pos.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {touched.rep_position && errors.rep_position && (
              <StepError message={errors.rep_position} />
            )}
          </motion.div>

          {/* Phone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Direct Phone *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="tel"
                placeholder="+971 50 XXX XXXX"
                value={formData.rep_phone || ''}
                onChange={(e) => handleChange('rep_phone', e.target.value)}
                onBlur={() => handleBlur('rep_phone')}
                className={cn(
                  'pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400',
                  touched.rep_phone && errors.rep_phone && 'border-red-500'
                )}
              />
            </div>
            {touched.rep_phone && errors.rep_phone && (
              <StepError message={errors.rep_phone} />
            )}
          </motion.div>

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                placeholder="representative@agency.com"
                value={formData.rep_email || ''}
                onChange={(e) => handleChange('rep_email', e.target.value)}
                onBlur={() => handleBlur('rep_email')}
                className={cn(
                  'pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400',
                  touched.rep_email && errors.rep_email && 'border-red-500'
                )}
              />
            </div>
            {touched.rep_email && errors.rep_email && (
              <StepError message={errors.rep_email} />
            )}
          </motion.div>

          {/* Representative Summary */}
          {formData.rep_name && formData.rep_position && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <h4 className="text-white text-sm font-medium mb-2">Representative Profile</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>{formData.rep_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-lg">
                    {POSITIONS.find((p) => p.value === formData.rep_position)?.icon}
                  </span>
                  <span>
                    {POSITIONS.find((p) => p.value === formData.rep_position)?.label}
                  </span>
                </div>
                {formData.rep_phone && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Phone className="w-4 h-4 text-green-400" />
                    <span>{formData.rep_phone}</span>
                  </div>
                )}
                {formData.rep_email && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span>{formData.rep_email}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <StepTip>
          This person will receive all notifications and correspondence.
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

export default AgencyRepresentativeStep;
