import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Home, Moon, Sun, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Living arrangement options
const LIVING_ARRANGEMENTS = [
  {
    value: 'live-in',
    label: 'Live-in',
    description: 'Worker lives in your home',
    icon: '🏠',
    details: ['Private room provided', '24/7 availability', 'Food included'],
  },
  {
    value: 'live-out',
    label: 'Live-out',
    description: 'Worker lives elsewhere',
    icon: '🚶',
    details: ['Fixed working hours', 'Commute daily', 'More privacy for both'],
  },
  {
    value: 'flexible',
    label: 'Flexible',
    description: 'Open to discussion',
    icon: '🔄',
    details: ['Negotiate arrangement', 'Depends on candidate', 'Part-time possible'],
  },
];

// Room amenities
const ROOM_AMENITIES = [
  { value: 'private_room', label: 'Private Room', icon: '🚪' },
  { value: 'private_bathroom', label: 'Private Bathroom', icon: '🚿' },
  { value: 'ac', label: 'Air Conditioning', icon: '❄️' },
  { value: 'tv', label: 'TV', icon: '📺' },
  { value: 'wifi', label: 'WiFi Access', icon: '📶' },
  { value: 'window', label: 'Window/Ventilation', icon: '🪟' },
];

// Working hours
const WORKING_HOURS_OPTIONS = [
  { value: 'full-time', label: 'Full-time (48 hrs/week)', icon: '⏰' },
  { value: 'part-time', label: 'Part-time (24 hrs/week)', icon: '⌛' },
  { value: 'flexible', label: 'Flexible Hours', icon: '🕐' },
];

// Days off
const DAYS_OFF_OPTIONS = [
  { value: '1-per-week', label: '1 day per week', icon: '📅' },
  { value: '2-per-week', label: '2 days per week', icon: '📆' },
  { value: '1-per-month', label: '1 day per month', icon: '🗓️' },
  { value: 'negotiable', label: 'Negotiable', icon: '💬' },
];

const SponsorAccommodationStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Get current selections
  const selectedAmenities = formData.room_amenities || [];
  const livingArrangement = formData.living_arrangement || '';

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case 'living_arrangement':
        if (!value) return 'Please select a living arrangement';
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

  // Toggle amenity
  const toggleAmenity = (amenity) => {
    const current = selectedAmenities;
    const newList = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    updateFormData({ room_amenities: newList });
  };

  // Validate all
  const validateAll = () => {
    const fields = ['living_arrangement'];
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
      awardPoints(20, 'Accommodation set');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid = formData.living_arrangement;

  return (
    <div className="space-y-4">
      <StepCard
        title="Accommodation & Hours"
        description="What arrangement works for you?"
        icon={Home}
        showHeader={true}
      >
        <div className="space-y-5 mt-4">
          {/* Living Arrangement */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm text-gray-300 mb-2">
              Living Arrangement *
            </label>
            <div className="space-y-2">
              {LIVING_ARRANGEMENTS.map((arrangement) => {
                const isSelected = livingArrangement === arrangement.value;
                return (
                  <button
                    key={arrangement.value}
                    onClick={() => {
                      handleChange('living_arrangement', arrangement.value);
                      handleBlur('living_arrangement');
                    }}
                    className={cn(
                      'w-full p-3 rounded-lg border text-left transition-all',
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{arrangement.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-medium">{arrangement.label}</h4>
                          {isSelected && (
                            <Check className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mt-0.5">{arrangement.description}</p>
                        {isSelected && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {arrangement.details.map((detail, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full"
                              >
                                {detail}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {touched.living_arrangement && errors.living_arrangement && (
              <StepError message={errors.living_arrangement} />
            )}
          </motion.div>

          {/* Room Amenities (for live-in) */}
          {livingArrangement === 'live-in' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  Room Amenities
                  <span className="text-gray-500">(optional)</span>
                </label>
                {selectedAmenities.length > 0 && (
                  <span className="text-xs text-green-400">
                    {selectedAmenities.length} selected
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ROOM_AMENITIES.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity.value);
                  return (
                    <button
                      key={amenity.value}
                      onClick={() => toggleAmenity(amenity.value)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border transition-all text-sm',
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                      )}
                    >
                      <span>{amenity.icon}</span>
                      <span>{amenity.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Working Hours */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="text-sm text-gray-300 flex items-center gap-2 mb-2">
              <Sun className="w-4 h-4" />
              Working Hours
              <span className="text-gray-500">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {WORKING_HOURS_OPTIONS.map((option) => {
                const isSelected = formData.working_hours === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleChange('working_hours', option.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all',
                      isSelected
                        ? 'bg-orange-600/30 border-orange-500 text-white'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Days Off */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="text-sm text-gray-300 flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              Days Off
              <span className="text-gray-500">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OFF_OPTIONS.map((option) => {
                const isSelected = formData.days_off === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleChange('days_off', option.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all',
                      isSelected
                        ? 'bg-green-600/30 border-green-500 text-white'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Summary */}
          {livingArrangement && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <h4 className="text-white text-sm font-medium mb-2">Arrangement Summary</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Home className="w-4 h-4 text-purple-400" />
                  <span>
                    {LIVING_ARRANGEMENTS.find((a) => a.value === livingArrangement)?.label} arrangement
                  </span>
                </div>
                {formData.working_hours && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Sun className="w-4 h-4 text-orange-400" />
                    <span>
                      {WORKING_HOURS_OPTIONS.find((h) => h.value === formData.working_hours)?.label}
                    </span>
                  </div>
                )}
                {formData.days_off && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span>
                      {DAYS_OFF_OPTIONS.find((d) => d.value === formData.days_off)?.label}
                    </span>
                  </div>
                )}
                {selectedAmenities.length > 0 && (
                  <div className="flex items-start gap-2 text-gray-300">
                    <Moon className="w-4 h-4 text-blue-400 mt-0.5" />
                    <span className="flex flex-wrap gap-1">
                      {selectedAmenities.map((a) => {
                        const amenity = ROOM_AMENITIES.find((am) => am.value === a);
                        return (
                          <span key={a} className="text-xs">
                            {amenity?.icon}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <StepTip>
          Clear expectations help find the right match for your household.
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

export default SponsorAccommodationStep;
