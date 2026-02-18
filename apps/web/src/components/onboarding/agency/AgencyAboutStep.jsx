import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Sparkles, Copy, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// AI-generated description templates
const DESCRIPTION_TEMPLATES = [
  {
    id: 'professional',
    name: 'Professional',
    icon: '💼',
    template: (data) => `${data.agency_name || '[Agency Name]'} is a licensed ${data.agency_type === 'recruitment' ? 'recruitment' : 'domestic services'} agency specializing in connecting qualified domestic workers with families across the GCC region. With ${data.years_in_business === '10+' ? 'over a decade' : data.years_in_business || 'years'} of experience, we are committed to providing vetted, trained, and reliable candidates. Our rigorous screening process ensures only the best candidates join our network. Contact us today for your staffing needs.`,
  },
  {
    id: 'friendly',
    name: 'Friendly',
    icon: '😊',
    template: (data) => `Welcome to ${data.agency_name || '[Agency Name]'}! We're a team passionate about matching wonderful families with amazing domestic helpers. Based in ${data.city || '[City]'}, ${data.country || '[Country]'}, we take pride in our personalized approach to recruitment. Every candidate we recommend has been carefully interviewed and verified. Let us help you find the perfect addition to your household!`,
  },
  {
    id: 'detailed',
    name: 'Detailed',
    icon: '📋',
    template: (data) => `${data.agency_name || '[Agency Name]'} is a fully licensed and registered agency operating in ${data.country || '[Country]'}. Our comprehensive services include candidate sourcing, visa processing, medical coordination, and post-placement support. We specialize in ${data.source_countries?.length > 0 ? `workers from ${data.source_countries.length} countries` : 'international recruitment'} and maintain the highest standards of professional ethics. License No: ${data.license_number || '[License Number]'}. Available 7 days a week for consultations.`,
  },
];

const AgencyAboutStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(null);

  const description = formData.agency_description || '';
  const charCount = description.length;
  const minChars = 100;
  const maxChars = 1000;

  // Validation
  const validateDescription = (value) => {
    if (!value || value.length < minChars) {
      return `Description must be at least ${minChars} characters`;
    }
    if (value.length > maxChars) {
      return `Description cannot exceed ${maxChars} characters`;
    }
    return null;
  };

  // Handle description change
  const handleChange = (value) => {
    updateFormData({ agency_description: value });
    if (errors.description) {
      setErrors({});
    }
  };

  // Handle blur
  const handleBlur = () => {
    setTouched(true);
    const error = validateDescription(description);
    if (error) {
      setErrors({ description: error });
    }
  };

  // Use template
  const useTemplate = (template) => {
    const generatedText = template.template(formData);
    handleChange(generatedText);
    setCopiedTemplate(template.id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  // Handle continue
  const handleContinue = () => {
    const error = validateDescription(description);
    if (error) {
      setErrors({ description: error });
      setTouched(true);
      return;
    }
    awardPoints(25, 'Description added');
    nextStep();
  };

  // Check if form is valid
  const isFormValid = !validateDescription(description);

  // Progress indicator
  const progressPercent = Math.min((charCount / minChars) * 100, 100);

  return (
    <div className="space-y-4">
      <StepCard
        title="Agency Description"
        description="Tell sponsors about your agency"
        icon={FileText}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* AI Templates */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">AI-Generated Templates</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DESCRIPTION_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => useTemplate(template)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all',
                    copiedTemplate === template.id
                      ? 'bg-green-600/20 border-green-500'
                      : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-purple-500/50'
                  )}
                >
                  <span className="text-xl">{template.icon}</span>
                  <span className="text-xs text-gray-300">{template.name}</span>
                  {copiedTemplate === template.id && (
                    <Check className="w-3 h-3 text-green-400" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Description Textarea */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-gray-300">
                Agency Description *
              </label>
              <span
                className={cn(
                  'text-xs',
                  charCount < minChars
                    ? 'text-yellow-400'
                    : charCount > maxChars
                    ? 'text-red-400'
                    : 'text-green-400'
                )}
              >
                {charCount}/{maxChars}
              </span>
            </div>

            <Textarea
              placeholder="Describe your agency, services, expertise, and what makes you unique..."
              value={description}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              rows={6}
              className={cn(
                'bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none',
                touched && errors.description && 'border-red-500'
              )}
            />

            {/* Progress bar */}
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  progressPercent >= 100
                    ? 'bg-green-500'
                    : progressPercent >= 50
                    ? 'bg-yellow-500'
                    : 'bg-purple-500'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {charCount < minChars && (
              <p className="text-xs text-yellow-400 mt-1">
                {minChars - charCount} more characters needed
              </p>
            )}

            {touched && errors.description && (
              <StepError message={errors.description} />
            )}
          </motion.div>

          {/* Writing tips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 rounded-lg p-3 border border-white/10"
          >
            <h4 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              Writing Tips
            </h4>
            <ul className="space-y-1 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                Mention your license number for credibility
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                Highlight your specializations and experience
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                Describe your screening and training process
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                Include any guarantees or support you offer
              </li>
            </ul>
          </motion.div>

          {/* Preview */}
          {charCount >= minChars && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Description looks great!</span>
              </div>
              <p className="text-gray-400 text-xs">
                Your agency profile will stand out to sponsors looking for professional agencies.
              </p>
            </motion.div>
          )}
        </div>

        <StepTip>
          Detailed descriptions get 60% more inquiries from sponsors.
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

export default AgencyAboutStep;
