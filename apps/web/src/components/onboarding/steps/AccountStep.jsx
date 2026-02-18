import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Mail, User, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const AccountStep = () => {
  const { account, updateAccount, formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validate email
  const validateEmail = useCallback((email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email';
    return null;
  }, []);

  // Validate password
  const validatePassword = useCallback((password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
    if (!/\d/.test(password)) return 'Password must contain a number';
    return null;
  }, []);

  // Validate confirm password
  const validateConfirmPassword = useCallback((confirmPassword, password) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return null;
  }, []);

  // Validate full name
  const validateName = useCallback((name) => {
    if (!name) return 'Full name is required';
    if (name.length < 2) return 'Name is too short';
    return null;
  }, []);

  // Handle input change
  const handleChange = (field, value) => {
    if (field === 'full_name') {
      updateFormData({ [field]: value });
    } else {
      updateAccount({ [field]: value });
    }

    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle blur
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    let error = null;
    switch (field) {
      case 'email':
        error = validateEmail(account.email);
        break;
      case 'password':
        error = validatePassword(account.password);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(account.confirmPassword, account.password);
        break;
      case 'full_name':
        error = validateName(formData.full_name);
        break;
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Validate all fields
  const validateAll = () => {
    const newErrors = {};
    const nameError = validateName(formData.full_name);
    const emailError = validateEmail(account.email);
    const passwordError = validatePassword(account.password);
    const confirmError = validateConfirmPassword(account.confirmPassword, account.password);

    if (nameError) newErrors.full_name = nameError;
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmError) newErrors.confirmPassword = confirmError;

    setErrors(newErrors);
    setTouched({ full_name: true, email: true, password: true, confirmPassword: true });

    return Object.keys(newErrors).length === 0;
  };

  // Handle continue
  const handleContinue = () => {
    if (validateAll()) {
      awardPoints(25, 'Account details completed');
      nextStep();
    }
  };

  // Password strength indicators
  const passwordChecks = [
    { label: '8+ characters', check: (account.password?.length || 0) >= 8 },
    { label: 'Lowercase', check: /[a-z]/.test(account.password || '') },
    { label: 'Uppercase', check: /[A-Z]/.test(account.password || '') },
    { label: 'Number', check: /\d/.test(account.password || '') },
  ];

  const isFormValid =
    formData.full_name &&
    account.email &&
    account.password &&
    account.confirmPassword &&
    !validateName(formData.full_name) &&
    !validateEmail(account.email) &&
    !validatePassword(account.password) &&
    !validateConfirmPassword(account.confirmPassword, account.password);

  return (
    <div className="space-y-4">
      <StepCard
        title="Create Your Account"
        description="Set up your login credentials"
        icon={Mail}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Full Name */}
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Full Name"
                value={formData.full_name || ''}
                onChange={(e) => handleChange('full_name', e.target.value)}
                onBlur={() => handleBlur('full_name')}
                className={cn(
                  'pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300',
                  touched.full_name && errors.full_name && 'border-red-500'
                )}
              />
            </div>
            {touched.full_name && errors.full_name && (
              <StepError message={errors.full_name} />
            )}
          </div>

          {/* Email */}
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                placeholder="Email Address"
                value={account.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={cn(
                  'pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300',
                  touched.email && errors.email && 'border-red-500'
                )}
              />
            </div>
            {touched.email && errors.email && (
              <StepError message={errors.email} />
            )}
          </div>

          {/* Password */}
          <div>
            <PasswordInput
              name="password"
              placeholder="Password"
              value={account.password || ''}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              showValidation={false}
              className={cn(
                'bg-white/10 border-white/20 text-white placeholder:text-gray-300',
                touched.password && errors.password && 'border-red-500'
              )}
            />

            {/* Password strength indicators */}
            {account.password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 flex flex-wrap gap-2"
              >
                {passwordChecks.map((item) => (
                  <span
                    key={item.label}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full flex items-center gap-1',
                      item.check
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    )}
                  >
                    {item.check ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    {item.label}
                  </span>
                ))}
              </motion.div>
            )}

            {touched.password && errors.password && (
              <StepError message={errors.password} />
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <PasswordInput
              name="confirmPassword"
              placeholder="Confirm Password"
              value={account.confirmPassword || ''}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              showValidation={false}
              className={cn(
                'bg-white/10 border-white/20 text-white placeholder:text-gray-300',
                touched.confirmPassword && errors.confirmPassword && 'border-red-500'
              )}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <StepError message={errors.confirmPassword} />
            )}

            {/* Match indicator */}
            {account.confirmPassword && account.password && !errors.confirmPassword && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 mt-1 text-green-400 text-xs"
              >
                <Check className="w-3 h-3" />
                Passwords match
              </motion.div>
            )}
          </div>
        </div>

        <StepTip>
          Use a strong password that you don't use elsewhere for maximum security.
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

export default AccountStep;
