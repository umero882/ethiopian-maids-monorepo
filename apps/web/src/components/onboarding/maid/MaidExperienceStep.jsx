import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { experienceLevels, gccCountries } from '@/data/maidProfileData';
import {
  Clock,
  MapPin,
  Award,
  Check,
  Plus,
  Upload,
  FileText,
  User,
  Phone,
  Trash2,
  Loader2,
  BadgeCheck,
  AlertCircle,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MaidExperienceStep = () => {
  const { formData, updateFormData, nextStep, previousStep, awardPoints, triggerCelebration } = useOnboarding();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [cvError, setCvError] = useState(null);

  const cvInputRef = useRef(null);

  // Get countries worked in
  const countriesWorkedIn = formData.countries_worked_in || [];

  // Get CV and reference data
  const previousEmploymentCV = formData.previousEmploymentCV || null;
  const reference = formData.employmentReference || { name: '', phone: '' };

  // Check if user has experience (not "No Experience")
  const hasExperience = formData.experience_level && formData.experience_level !== 'No Experience';

  // Check if experience is verified (has CV or reference)
  const isExperienceVerified = previousEmploymentCV || (reference.name && reference.phone);

  // Validation
  const validateField = (field, value) => {
    switch (field) {
      case 'experience_level':
        if (!value) return 'Please select your experience level';
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

  // Toggle country
  const toggleCountry = (country) => {
    const current = countriesWorkedIn;
    const newCountries = current.includes(country)
      ? current.filter((c) => c !== country)
      : [...current, country];

    updateFormData({ countries_worked_in: newCountries });
  };

  // Handle CV upload
  const handleCVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCvError(null);
    setIsUploadingCV(true);

    // Validate file type (PDF, DOC, DOCX, images)
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (!validTypes.includes(file.type)) {
      setCvError('Please upload a PDF, Word document, or image file');
      setIsUploadingCV(false);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setCvError('File must be less than 10MB');
      setIsUploadingCV(false);
      return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = () => {
      updateFormData({
        previousEmploymentCV: {
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result,
        },
      });
      setIsUploadingCV(false);
    };
    reader.onerror = () => {
      setCvError('Failed to read file. Please try again.');
      setIsUploadingCV(false);
    };
    reader.readAsDataURL(file);

    // Clear input
    if (cvInputRef.current) {
      cvInputRef.current.value = '';
    }
  };

  // Delete CV
  const deleteCV = () => {
    updateFormData({ previousEmploymentCV: null });
  };

  // Handle reference update
  const handleReferenceChange = (field, value) => {
    updateFormData({
      employmentReference: {
        ...reference,
        [field]: value,
      },
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Validate all
  const validateAll = () => {
    const newErrors = {};
    const expError = validateField('experience_level', formData.experience_level);
    if (expError) newErrors.experience_level = expError;

    setErrors(newErrors);
    setTouched({ experience_level: true });

    return Object.keys(newErrors).length === 0;
  };

  // Handle continue
  const handleContinue = () => {
    if (validateAll()) {
      awardPoints(35, 'Experience completed');

      // Bonus points for verified experience
      if (isExperienceVerified) {
        awardPoints(50, 'Experience verified');
        triggerCelebration('confetti-burst');
      }

      nextStep();
    }
  };

  // Check if form is valid
  const isFormValid = formData.experience_level && !validateField('experience_level', formData.experience_level);

  // Get experience info
  const getExperienceInfo = (level) => {
    const info = {
      'No Experience': { color: 'blue', description: 'Perfect for families who want to train' },
      '1-2 years': { color: 'green', description: 'Basic experience, knows fundamentals' },
      '3-5 years': { color: 'yellow', description: 'Skilled worker, minimal supervision' },
      '6-10 years': { color: 'orange', description: 'Highly experienced, very reliable' },
      '10+ years': { color: 'purple', description: 'Expert level, can manage households' },
    };
    return info[level] || { color: 'gray', description: '' };
  };

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
        title="Work Experience"
        description="Tell us about your experience"
        icon={Clock}
        showHeader={true}
      >
        <div className="space-y-4 mt-4">
          {/* Experience Level */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">Years of Experience *</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Select
                value={formData.experience_level || ''}
                onValueChange={(value) => handleChange('experience_level', value)}
              >
                <SelectTrigger
                  className={cn(
                    'pl-10 bg-white/10 border-white/20 text-white',
                    touched.experience_level && errors.experience_level && 'border-red-500',
                    !formData.experience_level && 'text-gray-400'
                  )}
                  onBlur={() => handleBlur('experience_level')}
                >
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {experienceLevels.map((level) => (
                    <SelectItem
                      key={level}
                      value={level}
                      className="text-white hover:bg-gray-700"
                    >
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {touched.experience_level && errors.experience_level && (
              <StepError message={errors.experience_level} />
            )}

            {/* Experience insight */}
            {formData.experience_level && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-start gap-2 p-2 bg-white/5 rounded-lg"
              >
                <Award className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-white text-sm">{formData.experience_level}</span>
                  <p className="text-gray-400 text-xs">
                    {getExperienceInfo(formData.experience_level).description}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Countries Worked In */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label className="block text-sm text-gray-300 mb-1.5">
              Countries Worked In <span className="text-gray-500">(optional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Select any GCC countries where you have work experience
            </p>

            <div className="grid grid-cols-2 gap-2">
              {gccCountries.map((country, index) => {
                const isSelected = countriesWorkedIn.includes(country);
                return (
                  <motion.button
                    key={country}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => toggleCountry(country)}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left',
                      isSelected
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    <span className="text-lg">{getCountryFlag(country)}</span>
                    <span className="flex-1 text-sm truncate">{country}</span>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* GCC experience bonus */}
            {countriesWorkedIn.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg"
              >
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">
                  GCC experience is highly valued by employers!
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* CV/Visa Upload and Reference - Only show if has experience */}
          <AnimatePresence>
            {hasExperience && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Verified Badge Preview */}
                {isExperienceVerified && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center">
                      <BadgeCheck className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-green-400 font-medium text-sm">Experience Verified Badge</p>
                      <p className="text-gray-400 text-xs">Your profile will display the verified badge</p>
                    </div>
                    <Star className="w-5 h-5 text-yellow-400" />
                  </motion.div>
                )}

                {/* Section Header */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Verify Your Experience</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* CV/Visa Upload */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-gray-300">
                      Previous Employment CV/Visa
                    </label>
                    <span className="text-xs text-yellow-400 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Upload your CV or previous work visa to verify your experience
                  </p>

                  {previousEmploymentCV ? (
                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{previousEmploymentCV.name}</p>
                        <p className="text-gray-400 text-xs">{formatFileSize(previousEmploymentCV.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={deleteCV}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => cvInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/20 rounded-lg bg-white/5 cursor-pointer hover:border-purple-500/50 hover:bg-white/10 transition-all"
                    >
                      <input
                        ref={cvInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleCVUpload}
                        className="hidden"
                      />
                      {isUploadingCV ? (
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-gray-300 text-sm">Upload CV or Visa</p>
                          <p className="text-gray-500 text-xs">PDF, Word, or Image (max 10MB)</p>
                        </>
                      )}
                    </div>
                  )}

                  {cvError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                      <AlertCircle className="w-4 h-4" />
                      {cvError}
                    </div>
                  )}
                </motion.div>

                {/* Reference Fields */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-gray-300">
                      Previous Employer Reference
                    </label>
                    <span className="text-xs text-yellow-400 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Provide a reference from your previous employer for verification
                  </p>

                  <div className="space-y-3">
                    {/* Reference Name */}
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Reference name (e.g. Mrs. Sarah Ahmed)"
                        value={reference.name}
                        onChange={(e) => handleReferenceChange('name', e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      />
                    </div>

                    {/* Reference Phone */}
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Reference phone number"
                        type="tel"
                        value={reference.phone}
                        onChange={(e) => handleReferenceChange('phone', e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Reference completion indicator */}
                  {reference.name && reference.phone && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center gap-2 text-green-400 text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Reference added
                    </motion.div>
                  )}
                </motion.div>

                {/* Verification info */}
                {!isExperienceVerified && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 text-sm font-medium">Earn a Verified Badge</p>
                      <p className="text-gray-400 text-xs">
                        Upload your CV/Visa or add a reference to get the "Experience Verified" badge on your profile.
                        Verified profiles get 2x more views!
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Experience summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 rounded-lg p-3 border border-white/10"
          >
            <h4 className="text-white text-sm font-medium mb-2">Your Experience</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Experience Level</span>
                <span className="text-white">
                  {formData.experience_level || 'Not selected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">GCC Countries</span>
                <span className="text-white">
                  {countriesWorkedIn.length > 0
                    ? countriesWorkedIn.length === 1
                      ? '1 country'
                      : `${countriesWorkedIn.length} countries`
                    : 'None'}
                </span>
              </div>
              {hasExperience && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">CV/Visa Uploaded</span>
                    <span className={previousEmploymentCV ? 'text-green-400' : 'text-gray-500'}>
                      {previousEmploymentCV ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Reference Added</span>
                    <span className={reference.name && reference.phone ? 'text-green-400' : 'text-gray-500'}>
                      {reference.name && reference.phone ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <span className="text-gray-400">Verified Badge</span>
                    {isExperienceVerified ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <BadgeCheck className="w-4 h-4" />
                        Earned
                      </span>
                    ) : (
                      <span className="text-gray-500">Not yet</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        <StepTip>
          Previous GCC work experience significantly increases your profile visibility.
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

export default MaidExperienceStep;
