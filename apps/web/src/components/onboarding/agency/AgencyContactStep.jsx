import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Input } from '@/components/ui/input';
import { Phone, Mail, MessageSquare, Facebook, Instagram, Linkedin, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

// Social media options
const SOCIAL_PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, placeholder: '+971 50 XXX XXXX' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'facebook.com/youragency' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@youragency' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/company/youragency' },
];

const AgencyContactStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case 'contact_phone':
        if (!value) return 'Contact phone is required';
        if (value.length < 8) return 'Phone number is too short';
        return null;
      case 'contact_email':
        if (!value) return 'Contact email is required';
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

  // Handle social media change
  const handleSocialChange = (platform, value) => {
    const socialMedia = formData.social_media || {};
    updateFormData({
      social_media: {
        ...socialMedia,
        [platform]: value,
      },
    });
  };

  // Validate all
  const validateAll = () => {
    const fields = ['contact_phone', 'contact_email'];
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
      awardPoints(25, 'Contact info added');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid =
    formData.contact_phone &&
    formData.contact_email &&
    !validateField('contact_phone', formData.contact_phone) &&
    !validateField('contact_email', formData.contact_email);

  // Count filled social media
  const socialMediaCount = SOCIAL_PLATFORMS.filter(
    (p) => formData.social_media?.[p.id]
  ).length;

  return (
    <div className="space-y-4">
      <StepCard
        title="Contact Information"
        description="How can people reach you?"
        icon={Phone}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Contact Phone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Office Phone *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="tel"
                placeholder="+971 4 XXX XXXX"
                value={formData.contact_phone || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                onBlur={() => handleBlur('contact_phone')}
                className={cn(
                  'pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400',
                  touched.contact_phone && errors.contact_phone && 'border-red-500'
                )}
              />
            </div>
            {touched.contact_phone && errors.contact_phone && (
              <StepError message={errors.contact_phone} />
            )}
          </motion.div>

          {/* Contact Email */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Business Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                placeholder="info@youragency.com"
                value={formData.contact_email || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                onBlur={() => handleBlur('contact_email')}
                className={cn(
                  'pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400',
                  touched.contact_email && errors.contact_email && 'border-red-500'
                )}
              />
            </div>
            {touched.contact_email && errors.contact_email && (
              <StepError message={errors.contact_email} />
            )}
          </motion.div>

          {/* Alternative Phone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Alternative Phone <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="tel"
                placeholder="+971 50 XXX XXXX"
                value={formData.alt_phone || ''}
                onChange={(e) => handleChange('alt_phone', e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </motion.div>

          {/* Social Media */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Social Media
                <span className="text-gray-500">(optional)</span>
              </label>
              {socialMediaCount > 0 && (
                <span className="text-xs text-green-400">
                  {socialMediaCount} added
                </span>
              )}
            </div>

            <div className="space-y-2">
              {SOCIAL_PLATFORMS.map((platform, idx) => {
                const Icon = platform.icon;
                const value = formData.social_media?.[platform.id] || '';

                return (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
                    className="relative"
                  >
                    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder={platform.placeholder}
                      value={value}
                      onChange={(e) => handleSocialChange(platform.id, e.target.value)}
                      className={cn(
                        'pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-sm',
                        value && 'border-green-500/50'
                      )}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                      {platform.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Contact Summary */}
          {(formData.contact_phone || formData.contact_email) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <h4 className="text-white text-sm font-medium mb-2">Contact Summary</h4>
              <div className="space-y-1.5 text-sm">
                {formData.contact_phone && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Phone className="w-4 h-4 text-green-400" />
                    <span>{formData.contact_phone}</span>
                  </div>
                )}
                {formData.contact_email && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span>{formData.contact_email}</span>
                  </div>
                )}
                {formData.alt_phone && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Phone className="w-4 h-4 text-purple-400" />
                    <span>{formData.alt_phone} (alt)</span>
                  </div>
                )}
                {socialMediaCount > 0 && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Globe className="w-4 h-4 text-pink-400" />
                    <span>{socialMediaCount} social profile{socialMediaCount > 1 ? 's' : ''} added</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <StepTip>
          Complete contact info helps sponsors and candidates reach you quickly.
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

export default AgencyContactStep;
