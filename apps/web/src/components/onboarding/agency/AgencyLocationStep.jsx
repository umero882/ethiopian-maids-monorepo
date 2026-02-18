import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { gccCountries } from '@/data/maidProfileData';
import { MapPin, Building2, Globe, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// GCC cities
const GCC_CITIES = {
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Fujairah', 'Ras Al Khaimah', 'Other'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Khobar', 'Dhahran', 'Other'],
  'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya', 'Jahra', 'Farwaniya', 'Other'],
  'Qatar': ['Doha', 'Al Wakrah', 'Al Khor', 'Lusail', 'Other'],
  'Bahrain': ['Manama', 'Muharraq', 'Riffa', 'Other'],
  'Oman': ['Muscat', 'Salalah', 'Sohar', 'Other'],
};

// Source countries (where agencies recruit from)
const SOURCE_COUNTRIES = [
  { value: 'ethiopia', label: 'Ethiopia', flag: '🇪🇹' },
  { value: 'philippines', label: 'Philippines', flag: '🇵🇭' },
  { value: 'indonesia', label: 'Indonesia', flag: '🇮🇩' },
  { value: 'sri_lanka', label: 'Sri Lanka', flag: '🇱🇰' },
  { value: 'india', label: 'India', flag: '🇮🇳' },
  { value: 'bangladesh', label: 'Bangladesh', flag: '🇧🇩' },
  { value: 'nepal', label: 'Nepal', flag: '🇳🇵' },
  { value: 'pakistan', label: 'Pakistan', flag: '🇵🇰' },
  { value: 'kenya', label: 'Kenya', flag: '🇰🇪' },
  { value: 'uganda', label: 'Uganda', flag: '🇺🇬' },
];

const AgencyLocationStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showAllSourceCountries, setShowAllSourceCountries] = useState(false);

  const selectedCountry = formData.country;
  const availableCities = selectedCountry ? GCC_CITIES[selectedCountry] || [] : [];
  const sourceCountries = formData.source_countries || [];

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case 'country':
        if (!value) return 'Country is required';
        return null;
      case 'city':
        if (!value) return 'City is required';
        return null;
      default:
        return null;
    }
  };

  // Handle input change
  const handleChange = (field, value) => {
    updateFormData({ [field]: value });

    // Reset city if country changes
    if (field === 'country' && value !== formData.country) {
      updateFormData({ city: '' });
    }

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

  // Toggle source country
  const toggleSourceCountry = (countryValue) => {
    const current = sourceCountries;
    const newList = current.includes(countryValue)
      ? current.filter((c) => c !== countryValue)
      : [...current, countryValue];
    updateFormData({ source_countries: newList });
  };

  // Validate all
  const validateAll = () => {
    const fields = ['country', 'city'];
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
      awardPoints(20, 'Location set');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid = formData.country && formData.city;

  // Get country flag
  const getCountryFlag = (country) => {
    const flags = {
      'Saudi Arabia': '🇸🇦',
      'United Arab Emirates': '🇦🇪',
      'Kuwait': '🇰🇼',
      'Qatar': '🇶🇦',
      'Bahrain': '🇧🇭',
      'Oman': '🇴🇲',
    };
    return flags[country] || '🌍';
  };

  // Display source countries
  const displaySourceCountries = showAllSourceCountries
    ? SOURCE_COUNTRIES
    : SOURCE_COUNTRIES.slice(0, 6);

  return (
    <div className="space-y-4">
      <StepCard
        title="Office Location"
        description="Where is your agency based?"
        icon={MapPin}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Country */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Office Country *
            </label>
            <Select
              value={formData.country || ''}
              onValueChange={(value) => handleChange('country', value)}
            >
              <SelectTrigger
                className={cn(
                  'bg-white/10 border-white/20 text-white',
                  touched.country && errors.country && 'border-red-500',
                  !formData.country && 'text-gray-400'
                )}
                onBlur={() => handleBlur('country')}
              >
                <SelectValue placeholder="Select office country" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {gccCountries.map((country) => (
                  <SelectItem
                    key={country}
                    value={country}
                    className="text-white hover:bg-gray-700"
                  >
                    <span className="flex items-center gap-2">
                      <span>{getCountryFlag(country)}</span>
                      {country}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched.country && errors.country && (
              <StepError message={errors.country} />
            )}
          </motion.div>

          {/* City */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">City *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.city || ''}
                onValueChange={(value) => handleChange('city', value)}
                disabled={!selectedCountry}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.city && errors.city && 'border-red-500',
                    !formData.city && 'text-gray-400',
                    !selectedCountry && 'opacity-50'
                  )}
                  onBlur={() => handleBlur('city')}
                >
                  <SelectValue placeholder={selectedCountry ? 'Select city' : 'Select country first'} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {availableCities.map((city) => (
                    <SelectItem
                      key={city}
                      value={city}
                      className="text-white hover:bg-gray-700"
                    >
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {touched.city && errors.city && (
              <StepError message={errors.city} />
            )}
          </motion.div>

          {/* Office Address */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Office Address <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <Textarea
                placeholder="Building, street, area..."
                value={formData.office_address || ''}
                onChange={(e) => handleChange('office_address', e.target.value)}
                rows={2}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
              />
            </div>
          </motion.div>

          {/* Source Countries */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Countries You Recruit From
                <span className="text-gray-500">(optional)</span>
              </label>
              {sourceCountries.length > 0 && (
                <span className="text-xs text-purple-400">
                  {sourceCountries.length} selected
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {displaySourceCountries.map((country) => {
                const isSelected = sourceCountries.includes(country.value);
                return (
                  <button
                    key={country.value}
                    onClick={() => toggleSourceCountry(country.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all',
                      isSelected
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    <span>{country.flag}</span>
                    {country.label}
                    {isSelected && <Check className="w-3 h-3 text-green-400" />}
                  </button>
                );
              })}
            </div>

            {!showAllSourceCountries && (
              <button
                onClick={() => setShowAllSourceCountries(true)}
                className="mt-2 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Show all countries
              </button>
            )}
          </motion.div>

          {/* Location Summary */}
          {formData.country && formData.city && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-3"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-400 text-sm font-medium">
                    {getCountryFlag(formData.country)} {formData.city}, {formData.country}
                  </p>
                  {sourceCountries.length > 0 && (
                    <p className="text-gray-400 text-xs mt-1">
                      Recruiting from {sourceCountries.length} countr{sourceCountries.length > 1 ? 'ies' : 'y'}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <StepTip>
          Agencies with multiple source countries attract more diverse candidates.
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

export default AgencyLocationStep;
