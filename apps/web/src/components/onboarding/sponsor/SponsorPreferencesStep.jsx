import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { nationalities, languages, religions } from '@/data/maidProfileData';
import { Settings, Globe, Languages, Heart, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Popular nationalities for quick selection
const POPULAR_NATIONALITIES = ['Ethiopian', 'Filipino', 'Indonesian', 'Sri Lankan', 'Indian', 'Bangladeshi'];

// Popular languages
const POPULAR_LANGUAGES = ['English', 'Arabic', 'Hindi', 'Tagalog', 'Indonesian'];

const SponsorPreferencesStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [showAllNationalities, setShowAllNationalities] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  // Get current selections
  const preferredNationalities = formData.preferred_nationalities || [];
  const preferredLanguages = formData.preferred_languages || [];
  const preferredReligion = formData.preferred_religion || '';

  // Toggle nationality
  const toggleNationality = (nat) => {
    const current = preferredNationalities;
    const newList = current.includes(nat)
      ? current.filter((n) => n !== nat)
      : [...current, nat];
    updateFormData({ preferred_nationalities: newList });
  };

  // Toggle language
  const toggleLanguage = (lang) => {
    const current = preferredLanguages;
    const newList = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    updateFormData({ preferred_languages: newList });
  };

  // Handle continue
  const handleContinue = () => {
    awardPoints(20, 'Preferences set');
    nextStep();
  };

  // Display nationalities
  const displayNationalities = showAllNationalities ? nationalities : POPULAR_NATIONALITIES;
  const displayLanguages = showAllLanguages ? languages : POPULAR_LANGUAGES;

  // Get nationality flag
  const getNationalityFlag = (nat) => {
    const flags = {
      'Ethiopian': '🇪🇹',
      'Filipino': '🇵🇭',
      'Indonesian': '🇮🇩',
      'Sri Lankan': '🇱🇰',
      'Indian': '🇮🇳',
      'Bangladeshi': '🇧🇩',
      'Nepalese': '🇳🇵',
      'Pakistani': '🇵🇰',
      'Kenyan': '🇰🇪',
      'Ugandan': '🇺🇬',
    };
    return flags[nat] || '🌍';
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Hiring Preferences"
        description="What are you looking for?"
        icon={Settings}
        showHeader={true}
      >
        <div className="space-y-5 mt-4">
          {/* Preferred Nationalities */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Preferred Nationalities
                <span className="text-gray-500">(optional)</span>
              </label>
              {preferredNationalities.length > 0 && (
                <span className="text-xs text-purple-400">
                  {preferredNationalities.length} selected
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {displayNationalities.map((nat) => {
                const isSelected = preferredNationalities.includes(nat);
                return (
                  <button
                    key={nat}
                    onClick={() => toggleNationality(nat)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all',
                      isSelected
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    <span>{getNationalityFlag(nat)}</span>
                    {nat}
                    {isSelected && <Check className="w-3 h-3 text-green-400" />}
                  </button>
                );
              })}
            </div>

            {!showAllNationalities && (
              <button
                onClick={() => setShowAllNationalities(true)}
                className="mt-2 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Show all nationalities
              </button>
            )}
          </motion.div>

          {/* Preferred Languages */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <Languages className="w-4 h-4" />
                Preferred Languages
                <span className="text-gray-500">(optional)</span>
              </label>
              {preferredLanguages.length > 0 && (
                <span className="text-xs text-purple-400">
                  {preferredLanguages.length} selected
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {displayLanguages.map((lang) => {
                const isSelected = preferredLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all',
                      isSelected
                        ? 'bg-blue-600/30 border-blue-500 text-white'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    {lang}
                    {isSelected && <Check className="w-3 h-3 text-green-400" />}
                  </button>
                );
              })}
            </div>

            {!showAllLanguages && (
              <button
                onClick={() => setShowAllLanguages(true)}
                className="mt-2 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Show all languages
              </button>
            )}
          </motion.div>

          {/* Religion Preference */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="text-sm text-gray-300 flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4" />
              Religion Preference
              <span className="text-gray-500">(optional)</span>
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFormData({ preferred_religion: '' })}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-all',
                  !preferredReligion
                    ? 'bg-green-600/30 border-green-500 text-white'
                    : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                )}
              >
                No Preference
              </button>
              {religions.filter(r => r !== 'Prefer not to say').map((rel) => (
                <button
                  key={rel}
                  onClick={() => updateFormData({ preferred_religion: rel })}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm border transition-all',
                    preferredReligion === rel
                      ? 'bg-purple-600/30 border-purple-500 text-white'
                      : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                  )}
                >
                  {rel}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Summary */}
          {(preferredNationalities.length > 0 || preferredLanguages.length > 0 || preferredReligion) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <h4 className="text-white text-sm font-medium mb-2">Your Preferences</h4>
              <div className="space-y-1.5 text-sm">
                {preferredNationalities.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-purple-400 mt-0.5" />
                    <span className="text-gray-300">
                      {preferredNationalities.join(', ')}
                    </span>
                  </div>
                )}
                {preferredLanguages.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Languages className="w-4 h-4 text-blue-400 mt-0.5" />
                    <span className="text-gray-300">
                      {preferredLanguages.join(', ')}
                    </span>
                  </div>
                )}
                {preferredReligion && (
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-400" />
                    <span className="text-gray-300">{preferredReligion}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <StepTip>
          No preferences? We'll show you all available domestic workers.
        </StepTip>
      </StepCard>

      <StepNavigation
        onNext={handleContinue}
        onPrevious={previousStep}
        nextLabel="Continue"
      />
    </div>
  );
};

export default SponsorPreferencesStep;
