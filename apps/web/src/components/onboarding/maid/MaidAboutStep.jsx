import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PenLine, Sparkles, Loader2, Check, Copy, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MIN_CHARS = 50;
const MAX_CHARS = 500;

// Sample AI-generated bio templates
const BIO_TEMPLATES = [
  {
    label: 'Professional',
    template: (data) =>
      `Dedicated and experienced ${data.profession || 'domestic worker'} with ${data.experience_level || 'professional experience'}. I specialize in ${data.skills?.slice(0, 3).join(', ') || 'household tasks'} and speak ${data.languages?.slice(0, 2).join(' and ') || 'multiple languages'}. Currently based in ${data.country || 'the GCC region'}, looking for a ${data.work_preferences?.[0] || 'full-time'} position.`,
  },
  {
    label: 'Friendly',
    template: (data) =>
      `Hello! I'm a ${data.nationality || ''} ${data.profession || 'domestic helper'} who loves taking care of families. With ${data.experience_level || 'years of experience'}, I'm skilled in ${data.skills?.slice(0, 2).join(' and ') || 'household management'}. I'm ${data.marital_status?.toLowerCase() || ''}, reliable, and looking for a caring family in ${data.country || 'the GCC'}.`,
  },
  {
    label: 'Detailed',
    template: (data) =>
      `Experienced ${data.profession || 'household professional'} from ${data.nationality?.replace('n', '') || 'abroad'} with ${data.experience_level || 'extensive experience'}. Key skills include ${data.skills?.join(', ') || 'various household duties'}. Fluent in ${data.languages?.join(', ') || 'multiple languages'}. ${data.countries_worked_in?.length > 0 ? `Previously worked in ${data.countries_worked_in.join(', ')}.` : ''} Seeking ${data.expected_salary ? `AED ${data.expected_salary}` : 'competitive'} salary with ${data.work_preferences?.[0] || 'flexible'} arrangement.`,
  },
];

const MaidAboutStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [isGenerating, setIsGenerating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);

  const aboutMe = formData.about_me || '';
  const charCount = aboutMe.length;

  // Validate
  const validateAbout = (value) => {
    if (!value || value.length < MIN_CHARS) {
      return `Please write at least ${MIN_CHARS} characters (${MIN_CHARS - (value?.length || 0)} more needed)`;
    }
    if (value.length > MAX_CHARS) {
      return `Maximum ${MAX_CHARS} characters allowed`;
    }
    return null;
  };

  // Handle change
  const handleChange = (value) => {
    if (value.length <= MAX_CHARS) {
      updateFormData({ about_me: value });
      if (errors.about_me) {
        setErrors({});
      }
    }
  };

  // Generate bio from template
  const generateBio = useCallback((templateIndex) => {
    setIsGenerating(true);

    // Simulate AI generation delay
    setTimeout(() => {
      const template = BIO_TEMPLATES[templateIndex];
      const generatedBio = template.template(formData);
      updateFormData({ about_me: generatedBio });
      setIsGenerating(false);
      setShowTemplates(false);
    }, 800);
  }, [formData, updateFormData]);

  // Copy to clipboard
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(aboutMe);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Validate all
  const validateAll = () => {
    const error = validateAbout(aboutMe);
    if (error) {
      setErrors({ about_me: error });
      return false;
    }
    return true;
  };

  // Handle continue
  const handleContinue = () => {
    if (validateAll()) {
      awardPoints(25, 'About me written');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid = aboutMe.length >= MIN_CHARS && aboutMe.length <= MAX_CHARS;

  // Get character count color
  const getCharCountColor = () => {
    if (charCount < MIN_CHARS) return 'text-yellow-400';
    if (charCount > MAX_CHARS * 0.9) return 'text-orange-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="About Me"
        description="Write a brief introduction"
        icon={PenLine}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* AI Generation button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTemplates(!showTemplates)}
              disabled={isGenerating}
              className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>

            {/* Template options */}
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 space-y-2"
              >
                {BIO_TEMPLATES.map((template, index) => (
                  <button
                    key={template.label}
                    onClick={() => generateBio(index)}
                    className="w-full text-left p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-white text-sm font-medium">
                        {template.label} Style
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs line-clamp-2">
                      {template.template(formData).slice(0, 100)}...
                    </p>
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Textarea */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative"
          >
            <Textarea
              placeholder="Write about yourself, your experience, and what makes you a great fit for families looking for a domestic worker..."
              value={aboutMe}
              onChange={(e) => handleChange(e.target.value)}
              rows={6}
              className={cn(
                'bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none',
                errors.about_me && 'border-red-500'
              )}
            />

            {/* Copy button */}
            {aboutMe.length > 0 && (
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            )}
          </motion.div>

          {/* Character counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {charCount < MIN_CHARS && (
                <AlertCircle className="w-4 h-4 text-yellow-400" />
              )}
              <span className={cn('text-sm', getCharCountColor())}>
                {charCount} / {MAX_CHARS} characters
              </span>
            </div>
            {charCount >= MIN_CHARS && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <Check className="w-4 h-4" />
                Minimum reached
              </div>
            )}
          </div>

          {errors.about_me && <StepError message={errors.about_me} />}

          {/* Writing tips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 rounded-lg p-3 border border-white/10"
          >
            <h4 className="text-white text-sm font-medium mb-2">Writing Tips</h4>
            <ul className="space-y-1 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                Mention your key skills and experience
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                Include your nationality and languages
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                Be honest and friendly in your tone
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                Mention what type of family you're looking for
              </li>
            </ul>
          </motion.div>
        </div>

        <StepTip>
          A well-written bio helps families connect with you personally.
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

export default MaidAboutStep;
