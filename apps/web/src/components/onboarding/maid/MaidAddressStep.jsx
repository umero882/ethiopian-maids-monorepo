import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { countries, gccCountries } from '@/data/maidProfileData';
import { MapPin, Home, Globe, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// City data by country
const CITIES_BY_COUNTRY = {
  // GCC Countries
  'Saudi Arabia': [
    'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran',
    'Taif', 'Tabuk', 'Buraidah', 'Khamis Mushait', 'Abha', 'Najran', 'Jizan',
    'Yanbu', 'Al Ahsa', 'Jubail', 'Hafar Al-Batin'
  ],
  'United Arab Emirates': [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah',
    'Fujairah', 'Umm Al Quwain', 'Al Ain'
  ],
  'Kuwait': [
    'Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Jahra',
    'Ahmadi', 'Mangaf', 'Sabah Al Salem', 'Fahaheel'
  ],
  'Qatar': [
    'Doha', 'Al Wakrah', 'Al Khor', 'Al Rayyan', 'Umm Salal',
    'Al Shamal', 'Dukhan', 'Mesaieed'
  ],
  'Bahrain': [
    'Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Isa Town',
    'Sitra', 'Budaiya', 'Jidhafs', 'Al Hidd'
  ],
  'Oman': [
    'Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Ibri',
    'Seeb', 'Barka', 'Rustaq', 'Bahla'
  ],
  // African Countries
  'Ethiopia': [
    'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Adama',
    'Hawassa', 'Bahir Dar', 'Dessie', 'Jimma', 'Jijiga',
    'Harar', 'Debre Markos', 'Kombolcha', 'Debre Birhan'
  ],
  'Kenya': [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
    'Thika', 'Malindi', 'Kitale', 'Garissa', 'Nyeri'
  ],
  'Uganda': [
    'Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja',
    'Mbale', 'Mukono', 'Masaka', 'Entebbe', 'Fort Portal'
  ],
  'Tanzania': [
    'Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya',
    'Morogoro', 'Tanga', 'Zanzibar City', 'Kigoma', 'Tabora'
  ],
  'Egypt': [
    'Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said',
    'Suez', 'Luxor', 'Aswan', 'Mansoura', 'Tanta', 'Ismailia'
  ],
  // Asian Countries
  'Philippines': [
    'Manila', 'Quezon City', 'Davao City', 'Cebu City', 'Makati',
    'Pasig', 'Taguig', 'Caloocan', 'Zamboanga City', 'Antipolo'
  ],
  'Indonesia': [
    'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang',
    'Makassar', 'Palembang', 'Depok', 'Tangerang', 'Bekasi'
  ],
  'Sri Lanka': [
    'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo',
    'Batticaloa', 'Trincomalee', 'Anuradhapura', 'Matara', 'Ratnapura'
  ],
  'India': [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
    'Kolkata', 'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow',
    'Kochi', 'Thiruvananthapuram', 'Coimbatore', 'Mangalore'
  ],
  'Bangladesh': [
    'Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet',
    'Rangpur', 'Comilla', 'Gazipur', 'Narayanganj', 'Mymensingh'
  ],
  'Nepal': [
    'Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Bharatpur',
    'Birgunj', 'Dharan', 'Butwal', 'Hetauda', 'Janakpur'
  ],
  'Pakistan': [
    'Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Rawalpindi',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala'
  ],
};

const MaidAddressStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case 'country':
        if (!value) return 'Country is required';
        return null;
      case 'city':
        if (!value) return 'City is required';
        if (value.length < 2) return 'City name is too short';
        return null;
      default:
        return null;
    }
  };

  // Get available cities for selected country
  const availableCities = useMemo(() => {
    if (!formData.country) return [];
    return CITIES_BY_COUNTRY[formData.country] || [];
  }, [formData.country]);

  // Handle input change
  const handleChange = (field, value) => {
    // If country changes, reset city
    if (field === 'country' && value !== formData.country) {
      updateFormData({ [field]: value, city: '' });
      setErrors((prev) => ({ ...prev, city: null }));
    } else {
      updateFormData({ [field]: value });
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
      awardPoints(20, 'Address completed');
      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid =
    formData.country &&
    formData.city &&
    !validateField('country', formData.country) &&
    !validateField('city', formData.city);

  // Get country with flag emoji
  const getCountryWithFlag = (countryName) => {
    const flags = {
      'Saudi Arabia': '🇸🇦',
      'United Arab Emirates': '🇦🇪',
      'Kuwait': '🇰🇼',
      'Qatar': '🇶🇦',
      'Bahrain': '🇧🇭',
      'Oman': '🇴🇲',
      'Ethiopia': '🇪🇹',
      'Philippines': '🇵🇭',
      'Indonesia': '🇮🇩',
      'Sri Lanka': '🇱🇰',
      'India': '🇮🇳',
      'Bangladesh': '🇧🇩',
      'Nepal': '🇳🇵',
      'Pakistan': '🇵🇰',
      'Kenya': '🇰🇪',
      'Uganda': '🇺🇬',
      'Tanzania': '🇹🇿',
      'Egypt': '🇪🇬',
    };
    return flags[countryName] || '🌍';
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="Current Location"
        description="Where are you located right now?"
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
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.country || ''}
                onValueChange={(value) => handleChange('country', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.country && errors.country && 'border-red-500',
                    !formData.country && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('country')}
                >
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  {/* GCC Countries first */}
                  <div className="px-2 py-1 text-xs text-gray-500 font-medium">GCC Countries</div>
                  {gccCountries.map((country) => (
                    <SelectItem
                      key={country}
                      value={country}
                      className="text-white hover:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        <span>{getCountryWithFlag(country)}</span>
                        {country}
                      </span>
                    </SelectItem>
                  ))}
                  <div className="border-t border-gray-700 my-1" />
                  <div className="px-2 py-1 text-xs text-gray-500 font-medium">Other Countries</div>
                  {countries
                    .filter((c) => !gccCountries.includes(c))
                    .map((country) => (
                      <SelectItem
                        key={country}
                        value={country}
                        className="text-white hover:bg-gray-700"
                      >
                        <span className="flex items-center gap-2">
                          <span>{getCountryWithFlag(country)}</span>
                          {country}
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
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
                disabled={!formData.country}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.city && errors.city && 'border-red-500',
                    !formData.city && 'text-gray-400',
                    !formData.country && 'opacity-50 cursor-not-allowed'
                  )}
                  onBlur={() => handleBlur('city')}
                >
                  <SelectValue placeholder={formData.country ? "Select your city" : "Select country first"} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  {availableCities.length > 0 ? (
                    availableCities.map((city) => (
                      <SelectItem
                        key={city}
                        value={city}
                        className="text-white hover:bg-gray-700"
                      >
                        {city}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-400 text-sm">
                      No cities available for this country
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            {!formData.country && (
              <p className="text-xs text-gray-500 mt-1">Please select a country first</p>
            )}
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
                placeholder="Street, building, area..."
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={2}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This won't be shown publicly. Only shared with verified employers.
            </p>
          </motion.div>

          {/* Location hint for GCC */}
          {formData.country && gccCountries.includes(formData.country) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
            >
              <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 text-sm font-medium">Great location!</p>
                <p className="text-gray-400 text-xs">
                  You're in a high-demand area. Families in {formData.country} are actively looking for domestic workers.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <StepTip>
          Your location helps families and agencies in your area find you more easily.
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

export default MaidAddressStep;
