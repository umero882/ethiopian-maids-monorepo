import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { skills, languages } from '@/data/maidProfileData';
import { Wrench, Languages, Check, Plus, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const MaidSkillsStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints, unlockAchievement } = useOnboarding();

  const [activeTab, setActiveTab] = useState('skills'); // 'skills' or 'languages'
  const [errors, setErrors] = useState({});

  // Get current selections
  const selectedSkills = formData.skills || [];
  const selectedLanguages = formData.languages || [];

  // Toggle skill selection
  const toggleSkill = (skill) => {
    const current = selectedSkills;
    const newSkills = current.includes(skill)
      ? current.filter((s) => s !== skill)
      : [...current, skill];

    updateFormData({ skills: newSkills });

    // Check for achievement
    if (newSkills.length >= 5 && !current.includes(skill)) {
      unlockAchievement('skill_master');
    }

    // Clear error
    if (errors.skills) {
      setErrors((prev) => ({ ...prev, skills: null }));
    }
  };

  // Toggle language selection
  const toggleLanguage = (language) => {
    const current = selectedLanguages;
    const newLanguages = current.includes(language)
      ? current.filter((l) => l !== language)
      : [...current, language];

    updateFormData({ languages: newLanguages });

    // Clear error
    if (errors.languages) {
      setErrors((prev) => ({ ...prev, languages: null }));
    }
  };

  // Validate
  const validateAll = () => {
    const newErrors = {};

    if (selectedSkills.length === 0) {
      newErrors.skills = 'Please select at least one skill';
    }
    if (selectedLanguages.length === 0) {
      newErrors.languages = 'Please select at least one language';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle continue
  const handleContinue = () => {
    if (validateAll()) {
      const basePoints = 20;
      const bonusPoints = selectedSkills.length >= 3 ? 20 : 0;
      awardPoints(basePoints + bonusPoints, `${selectedSkills.length} skills added`);
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid = selectedSkills.length > 0 && selectedLanguages.length > 0;

  // Get skill emoji
  const getSkillEmoji = (skill) => {
    const emojis = {
      'Cooking': '👨‍🍳',
      'Cleaning': '🧹',
      'Childcare': '👶',
      'Eldercare': '👵',
      'Laundry': '👕',
      'Ironing': '👔',
      'Pet Care': '🐕',
      'Gardening': '🌱',
      'Driving': '🚗',
      'First Aid': '🏥',
      'Computer Skills': '💻',
      'Language Skills': '🗣️',
      'Sewing': '🧵',
      'Tutoring': '📚',
      'Massage Therapy': '💆',
    };
    return emojis[skill] || '✨';
  };

  // Get language flag
  const getLanguageFlag = (language) => {
    const flags = {
      'English': '🇬🇧',
      'Arabic': '🇸🇦',
      'Hindi': '🇮🇳',
      'Urdu': '🇵🇰',
      'Tagalog': '🇵🇭',
      'Indonesian': '🇮🇩',
      'Sinhala': '🇱🇰',
      'Tamil': '🇮🇳',
      'Bengali': '🇧🇩',
      'Nepali': '🇳🇵',
      'Amharic': '🇪🇹',
      'Tigrinya': '🇪🇷',
      'Oromo (Afaan Oromo)': '🇪🇹',
      'French': '🇫🇷',
      'Spanish': '🇪🇸',
      'Other': '🌐',
    };
    return flags[language] || '🌐';
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Skills & Languages"
        description="What can you do?"
        icon={Wrench}
        showHeader={true}
      >
        <div className="mt-4 space-y-4">
          {/* Tab selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('skills')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all',
                activeTab === 'skills'
                  ? 'bg-purple-600/30 border-purple-500 text-white'
                  : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
              )}
            >
              <Wrench className="w-4 h-4" />
              <span className="text-sm">Skills</span>
              {selectedSkills.length > 0 && (
                <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {selectedSkills.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('languages')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all',
                activeTab === 'languages'
                  ? 'bg-purple-600/30 border-purple-500 text-white'
                  : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
              )}
            >
              <Languages className="w-4 h-4" />
              <span className="text-sm">Languages</span>
              {selectedLanguages.length > 0 && (
                <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {selectedLanguages.length}
                </span>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <p className="text-sm text-gray-400 mb-3">
                  Select all skills that apply to you
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {skills.map((skill, index) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <motion.button
                        key={skill}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left',
                          isSelected
                            ? 'bg-purple-600/30 border-purple-500 text-white'
                            : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                        )}
                      >
                        <span className="text-lg">{getSkillEmoji(skill)}</span>
                        <span className="flex-1 text-sm truncate">{skill}</span>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <Plus className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {errors.skills && <StepError message={errors.skills} />}

                {/* Skill count indicator */}
                {selectedSkills.length >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg"
                  >
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-green-400 text-sm">
                      Great! {selectedSkills.length} skills will boost your profile visibility
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Languages Tab */}
            {activeTab === 'languages' && (
              <motion.div
                key="languages"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="text-sm text-gray-400 mb-3">
                  Select all languages you can speak
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((language, index) => {
                    const isSelected = selectedLanguages.includes(language);
                    return (
                      <motion.button
                        key={language}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => toggleLanguage(language)}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left',
                          isSelected
                            ? 'bg-purple-600/30 border-purple-500 text-white'
                            : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                        )}
                      >
                        <span className="text-lg">{getLanguageFlag(language)}</span>
                        <span className="flex-1 text-sm truncate">{language}</span>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <Plus className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {errors.languages && <StepError message={errors.languages} />}

                {/* Arabic/English bonus */}
                {(selectedLanguages.includes('English') || selectedLanguages.includes('Arabic')) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                  >
                    <Languages className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm">
                      {selectedLanguages.includes('English') && selectedLanguages.includes('Arabic')
                        ? 'English + Arabic is highly valued in GCC!'
                        : selectedLanguages.includes('Arabic')
                        ? 'Arabic speakers are in high demand!'
                        : 'English proficiency is a big plus!'}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Selected:</span>
              <span className="text-white">
                {selectedSkills.length} skills, {selectedLanguages.length} languages
              </span>
            </div>
          </div>
        </div>

        <StepTip>
          Adding more skills increases your chances of being discovered by families.
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

export default MaidSkillsStep;
