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
import { MapPin, Building2, Home } from 'lucide-react';
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

const SponsorLocationStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const selectedCountry = formData.country;
  const availableCities = selectedCountry ? GCC_CITIES[selectedCountry] || [] : [];

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

  return (
    <div className="space-y-4">
      <StepCard
        title="Your Location"
        description="Where are you based?"
        icon={MapPin}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Country */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Country *</label>
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
                <SelectValue placeholder="Select your country" />
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
                  <SelectValue placeholder={selectedCountry ? 'Select your city' : 'Select country first'} />
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

          {/* Address (optional) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Address <span className="text-gray-500">(optional)</span>
            </label>
            <div className="relative">
              <Home className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <Textarea
                placeholder="Apartment, building, area..."
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={2}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your address is only visible to verified domestic workers.
            </p>
          </motion.div>

          {/* Location confirmation */}
          {formData.country && formData.city && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-3"
            >
              <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 text-sm font-medium">
                  {formData.city}, {formData.country}
                </p>
                <p className="text-gray-400 text-xs">
                  We'll show you domestic workers available in this area.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <StepTip>
          Location helps us match you with available domestic workers in your area.
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

export default SponsorLocationStep;
