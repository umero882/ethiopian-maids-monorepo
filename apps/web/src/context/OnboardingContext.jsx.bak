import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { setUserTypeClaim } from '@/lib/firebaseClient';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/components/ui/use-toast';
import { useGameSounds } from '@/hooks/useGameSounds';

// Storage key for draft persistence
const STORAGE_KEY = 'ethiopian_maids_onboarding_draft';

// Initial state structure
const initialState = {
  // User Type & Flow
  userType: null, // 'maid' | 'sponsor' | 'agency'
  currentStep: 0,

  // Account Data
  account: {
    email: '',
    password: '',
    phone: '',
    phoneVerified: false,
  },

  // Form Data (varies by userType)
  formData: {
    // Personal Info (all users)
    full_name: '',
    dateOfBirth: null,
    nationality: '',
    religion: '',
    maritalStatus: '',

    // Biometric & Documents
    facePhoto: null,
    idDocument: null, // For maid/sponsor: passport/ID
    tradeLicense: null, // For agency
    investorId: null, // For agency

    // Maid-specific
    address: '',
    country: '',
    city: '',
    primaryProfession: '',
    visaStatus: '',
    skills: [],
    languages: [],
    experienceYears: '',
    previousCountries: [],
    salaryExpectation: '',
    workPreferences: [],
    aboutMe: '',
    videoCV: null,

    // Sponsor-specific
    familySize: '',
    childrenAges: [],
    hasElderly: false,
    preferredNationality: [],
    preferredLanguages: [],
    salaryBudgetMin: '',
    salaryBudgetMax: '',
    accommodationType: '',
    roomType: '',

    // Agency-specific
    agencyName: '',
    tradeLicenseNumber: '',
    countriesOfOperation: [],
    citiesOfOperation: [],
    contactPhone: '',
    contactEmail: '',
    authorizedPersonName: '',
    authorizedPersonTitle: '',
    servicesOffered: [],
    aboutAgency: '',
    supportHours: '',
    emergencyContact: '',
  },

  // Gamification
  gamification: {
    points: 0,
    level: 1,
    achievements: [],
    badges: [],
    startedAt: null,
  },

  // Progress & Validation
  completedSteps: [],
  stepValidationErrors: {},

  // UI State
  isTransitioning: false,
  showCelebration: false,
  celebrationType: null,

  // Consents
  consents: {
    termsAccepted: false,
    privacyAccepted: false,
    backgroundCheckConsent: false,
    communicationConsent: false,
    profileSharingAccepted: false,
    notificationsEnabled: false,
  },
};

// Create context
const OnboardingContext = createContext(null);

// Provider component
export const OnboardingProvider = ({ children }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateRegistrationStatus, updateProfile, createOrUpdateMaidProfile, user } = useAuth();
  const [state, setState] = useState(initialState);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const saveTimeoutRef = useRef(null);
  const { play: playSound } = useGameSounds();
  const storage = getStorage();

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        // Only restore if draft is less than 7 days old
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (parsed.gamification?.startedAt && parsed.gamification.startedAt > sevenDaysAgo) {
          setState(prev => ({
            ...prev,
            ...parsed,
            // Reset UI states
            isTransitioning: false,
            showCelebration: false,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading onboarding draft:', error);
    }
    setIsDraftLoaded(true);
  }, []);

  // Auto-save to localStorage (debounced)
  const saveDraft = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const toSave = {
          userType: state.userType,
          currentStep: state.currentStep,
          account: state.account,
          formData: state.formData,
          gamification: state.gamification,
          completedSteps: state.completedSteps,
          consents: state.consents,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error('Error saving onboarding draft:', error);
      }
    }, 2000); // 2 second debounce
  }, [state]);

  // Save on state changes
  useEffect(() => {
    if (isDraftLoaded && state.userType) {
      saveDraft();
    }
  }, [state, isDraftLoaded, saveDraft]);

  // Save on visibility change (user leaving page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveDraft();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveDraft]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }, []);

  // Check if draft exists
  const hasDraft = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        return parsed.userType && parsed.currentStep > 0;
      }
    } catch (error) {
      console.error('Error checking draft:', error);
    }
    return false;
  }, []);

  // Set user type
  const setUserType = useCallback((type) => {
    setState(prev => ({
      ...prev,
      userType: type,
      gamification: {
        ...prev.gamification,
        startedAt: prev.gamification.startedAt || Date.now(),
        points: prev.gamification.points + 10, // Award points for selecting user type
      },
    }));
  }, []);

  // Update form data
  const updateFormData = useCallback((data) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        ...data,
      },
    }));
  }, []);

  // Update account data
  const updateAccount = useCallback((data) => {
    setState(prev => ({
      ...prev,
      account: {
        ...prev.account,
        ...data,
      },
    }));
  }, []);

  // Update consents (batch update)
  const updateConsents = useCallback((data) => {
    setState(prev => ({
      ...prev,
      consents: {
        ...prev.consents,
        ...data,
      },
    }));
  }, []);

  // Update single consent by id
  const updateConsent = useCallback((id, value) => {
    setState(prev => ({
      ...prev,
      consents: {
        ...prev.consents,
        [id]: value,
      },
    }));
  }, []);

  // Navigate to next step
  const nextStep = useCallback(() => {
    playSound('stepComplete');
    setState(prev => {
      const newCompletedSteps = prev.completedSteps.includes(prev.currentStep)
        ? prev.completedSteps
        : [...prev.completedSteps, prev.currentStep];

      return {
        ...prev,
        currentStep: prev.currentStep + 1,
        completedSteps: newCompletedSteps,
        isTransitioning: true,
      };
    });

    // Reset transition state
    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, []);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
      isTransitioning: true,
    }));

    // Reset transition state
    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, []);

  // Go to specific step (only if accessible)
  const goToStep = useCallback((stepIndex) => {
    setState(prev => {
      // Can only go back or to a completed step
      if (stepIndex <= prev.currentStep || prev.completedSteps.includes(stepIndex)) {
        return {
          ...prev,
          currentStep: stepIndex,
          isTransitioning: true,
        };
      }
      return prev;
    });

    // Reset transition state
    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, []);

  // Set validation errors for current step
  const setStepErrors = useCallback((errors) => {
    setState(prev => ({
      ...prev,
      stepValidationErrors: {
        ...prev.stepValidationErrors,
        [prev.currentStep]: errors,
      },
    }));
  }, []);

  // Clear validation errors for current step
  const clearStepErrors = useCallback(() => {
    setState(prev => {
      const newErrors = { ...prev.stepValidationErrors };
      delete newErrors[prev.currentStep];
      return {
        ...prev,
        stepValidationErrors: newErrors,
      };
    });
  }, []);

  // Award points
  const awardPoints = useCallback((points, reason) => {
    setState(prev => {
      const newPoints = prev.gamification.points + points;
      const newLevel = Math.floor(newPoints / 200) + 1;
      const prevLevel = prev.gamification.level || 1;

      // Play sounds
      playSound('points');
      if (newLevel > prevLevel) {
        setTimeout(() => playSound('levelUp'), 300);
      }

      return {
        ...prev,
        gamification: {
          ...prev.gamification,
          points: newPoints,
          level: newLevel,
        },
      };
    });
  }, [playSound]);

  // Unlock achievement
  const unlockAchievement = useCallback((achievementId, name, icon, points = 0) => {
    setState(prev => {
      // Check if already unlocked
      if (prev.gamification.achievements.some(a => a.id === achievementId)) {
        return prev;
      }
      playSound('achievement');

      return {
        ...prev,
        gamification: {
          ...prev.gamification,
          achievements: [
            ...prev.gamification.achievements,
            { id: achievementId, name, icon, unlockedAt: Date.now() },
          ],
          points: prev.gamification.points + points,
        },
        showCelebration: true,
        celebrationType: 'achievement',
      };
    });

    // Hide celebration after delay
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        showCelebration: false,
        celebrationType: null,
      }));
    }, 3000);
  }, []);

  // Trigger celebration
  const triggerCelebration = useCallback((type = 'confetti') => {
    playSound(type); // Play matching celebration sound
    setState(prev => ({
      ...prev,
      showCelebration: true,
      celebrationType: type,
    }));

    // Hide celebration after delay
    const duration = type === 'confetti-cannon' ? 5000 : 3000;
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        showCelebration: false,
        celebrationType: null,
      }));
    }, duration);
  }, []);

  // Helper: Upload file to Firebase Storage
  const uploadFileToStorage = useCallback(async (file, folder) => {
    if (!file || !user?.id) return null;

    try {
      const fileName = `${Date.now()}_${file.name || 'upload'}`;
      const storageRef = ref(storage, `${folder}/${user.id}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log(`✅ File uploaded to ${folder}:`, downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error(`❌ Error uploading file to ${folder}:`, error);
      return null;
    }
  }, [storage, user?.id]);

  // Helper: Calculate profile completion percentage
  // Uses actual field names from onboarding step components
  const calculateProfileCompletion = useCallback((formData) => {
    const requiredFields = [
      // Personal Info (MaidPersonalStep)
      'full_name',
      'dateOfBirth',
      'nationality',
      // Location (MaidAddressStep)
      'country',
      // Professional (MaidProfessionStep)
      'primaryProfession',
      // Skills (MaidSkillsStep)
      'skills',
      'languages',
      // Experience (MaidExperienceStep)
      'experience_level',
      // Preferences (MaidPreferencesStep)
      'expected_salary',
      // About (MaidAboutStep)
      'about_me',
      // Photo (MaidBiometricDocStep)
      'facePhoto',
    ];

    const completed = requiredFields.filter(field => {
      const value = formData[field];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        // For file objects like facePhoto
        return true;
      }
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((completed.length / requiredFields.length) * 100);
  }, []);

  // Helper: Parse salary string to number
  const parseSalaryToNumber = useCallback((salaryString) => {
    if (!salaryString) return null;
    // Extract first number from salary range strings like "1500-2000 AED" or "1500"
    const match = salaryString.toString().match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }, []);

  // Helper: Parse experience level to years (number)
  const parseExperienceToYears = useCallback((experienceLevel) => {
    if (!experienceLevel) return 0;
    // Map experience level strings to numeric years
    const experienceMap = {
      'No Experience': 0,
      '1-2 years': 1,
      '3-5 years': 3,
      '6-10 years': 6,
      '10+ years': 10,
    };
    return experienceMap[experienceLevel] ?? 0;
  }, []);

  // Complete onboarding - saves ALL collected data to appropriate profile tables
  const completeOnboarding = useCallback(async () => {
    console.log('🎉 Starting onboarding completion...', {
      userType: state.userType,
      userId: user?.id,
      hasCreateOrUpdateMaidProfile: !!createOrUpdateMaidProfile,
      hasUpdateProfile: !!updateProfile,
      hasUpdateRegistrationStatus: !!updateRegistrationStatus,
    });

    // FIX: Validate user.id BEFORE attempting any save operations
    if (!user?.id) {
      console.error('❌ Cannot complete onboarding: user.id is undefined');
      toast({
        title: 'Session Error',
        description: 'Please refresh the page and try again. Your data is saved locally.',
        variant: 'destructive',
      });
      return; // STOP - don't proceed without valid user ID
    }

    try {
      // STEP 0: Set Firebase JWT claims FIRST (before any GraphQL mutations)
      // This ensures the JWT token has the correct Hasura role for database writes
      try {
        console.log('🔑 Setting Firebase JWT claims for role:', state.userType);
        await setUserTypeClaim(state.userType);
        // Wait a moment for token to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✅ JWT claims set, token refreshed');
      } catch (claimError) {
        console.warn('⚠️ Could not set JWT claims:', claimError.message);
        // Continue anyway — anonymous permissions are set as fallback
      }

      // Handle based on user type
      if (state.userType === 'maid') {
        // ==================== MAID PROFILE ====================
        console.log('📝 Processing maid profile data...');

        // 1. Upload files to Firebase Storage first
        let profilePhotoUrl = null;
        let videoUrl = null;
        let idDocumentUrl = null;

        if (state.formData.facePhoto) {
          console.log('📸 Uploading profile photo...');
          profilePhotoUrl = await uploadFileToStorage(state.formData.facePhoto, 'profile-photos');
        }

        if (state.formData.videoCV) {
          console.log('🎬 Uploading video CV...');
          videoUrl = await uploadFileToStorage(state.formData.videoCV, 'video-cvs');
        }

        if (state.formData.idDocument) {
          console.log('📄 Uploading ID document...');
          idDocumentUrl = await uploadFileToStorage(state.formData.idDocument, 'id-documents');
        }

        // 2. Upload additional files (CV, gallery photos)
        let cvDocumentUrl = null;
        let galleryPhotoUrls = [];

        // Upload previous employment CV if exists
        if (state.formData.previousEmploymentCV?.data) {
          console.log('📄 Uploading previous employment CV...');
          // Convert data URL to blob
          const cvBlob = await fetch(state.formData.previousEmploymentCV.data).then(r => r.blob());
          cvDocumentUrl = await uploadFileToStorage(cvBlob, 'employment-cvs');
        }

        // Upload gallery photos if exist
        if (state.formData.profilePhotos && state.formData.profilePhotos.length > 0) {
          console.log('🖼️ Uploading gallery photos...');
          for (let i = 0; i < state.formData.profilePhotos.length; i++) {
            const photo = state.formData.profilePhotos[i];
            if (photo?.url) {
              try {
                // Convert data URL to blob
                const photoBlob = await fetch(photo.url).then(r => r.blob());
                const photoUrl = await uploadFileToStorage(photoBlob, 'gallery-photos');
                if (photoUrl) {
                  galleryPhotoUrls.push(photoUrl);
                }
              } catch (err) {
                console.error(`Failed to upload gallery photo ${i}:`, err);
              }
            }
          }
          console.log(`✅ Uploaded ${galleryPhotoUrls.length} gallery photos`);
        }

        // 3. Prepare complete maid profile data with proper field mapping
        // NOTE: createOrUpdateMaidProfile expects camelCase field names
        // It internally converts them to snake_case for the database
        const maidProfileData = {
          // Personal Info (from MaidPersonalStep)
          full_name: state.formData.full_name || '',
          dateOfBirth: state.formData.dateOfBirth || null,
          nationality: state.formData.nationality || '',
          religion: state.formData.religion || '',
          maritalStatus: state.formData.maritalStatus || '',

          // Address (from MaidAddressStep)
          // NOTE: maid_profiles uses current_location, not country
          current_location: [state.formData.city, state.formData.country].filter(Boolean).join(', '),
          stateProvince: state.formData.city || '',
          streetAddress: state.formData.address || '',

          // Professional (from MaidProfessionStep)
          primaryProfession: state.formData.primaryProfession || '',
          currentVisaStatus: state.formData.visaStatus || '',
          educationLevel: state.formData.educationLevel || '',

          // Skills & Languages (from MaidSkillsStep)
          skills: state.formData.skills || [],
          languagesSpoken: state.formData.languages || [],

          // Experience (from MaidExperienceStep)
          totalExperienceYears: parseExperienceToYears(state.formData.experience_level),
          previousCountries: state.formData.countries_worked_in || [],

          // Preferences (from MaidPreferencesStep)
          salaryExpectations: parseSalaryToNumber(state.formData.expected_salary),
          workPreferences: state.formData.work_preferences || [],
          contractDuration: state.formData.contract_type || null,
          livingArrangement: state.formData.accommodation_preference === 'Live-in' ||
                             state.formData.accommodation_preference === 'Employer-provided accommodation'
                             ? 'live-in' : 'live-out',

          // Content (from MaidAboutStep & MaidVideoCVStep)
          aboutMe: state.formData.about_me || '',
          profilePictureUrl: profilePhotoUrl,
          introduction_video_url: videoUrl,

          // Phone number
          phone_number: state.account.phone || '',

          // Status & Metadata
          profile_completion_percentage: calculateProfileCompletion(state.formData),
          availability: 'available',
        };

        // 4. Store gallery photos and documents in maid_documents table (separate from profile)
        // This will be handled by the document service if needed
        console.log('📸 Gallery photos to be stored:', galleryPhotoUrls.length);
        console.log('📄 ID Document URL:', idDocumentUrl);
        console.log('📄 CV Document URL:', cvDocumentUrl);

        console.log('📝 Complete maid profile data:', maidProfileData);

        // 3. Save to maid_profiles via AuthContext
        if (createOrUpdateMaidProfile) {
          await createOrUpdateMaidProfile(user.id, maidProfileData);
          console.log('✅ Maid profile saved via createOrUpdateMaidProfile');

          // FIX: ALSO update the basic profiles table to ensure login works correctly
          // The profiles table is queried on login - it must have the core data
          if (updateProfile) {
            await updateProfile({
              full_name: state.formData.full_name || '',
              phone: state.account.phone || '',
              country: state.formData.country || '',
              avatar_url: profilePhotoUrl,
              user_type: 'maid', // Ensure user type is correctly set
            });
            console.log('✅ Basic profile also updated for login compatibility');
          }
        } else {
          console.warn('⚠️ createOrUpdateMaidProfile not available, falling back to updateProfile');
          // Fallback: at least update the basic profile
          if (updateProfile) {
            await updateProfile({
              full_name: state.formData.full_name,
              phone: state.account.phone,
              country: state.formData.country,
              avatar_url: profilePhotoUrl,
              user_type: 'maid',
            });
          }
        }

      } else if (state.userType === 'sponsor') {
        // ==================== SPONSOR PROFILE ====================
        console.log('📝 Processing sponsor profile data...');

        // Upload sponsor files
        let sponsorPhotoUrl = null;
        let sponsorIdDocUrl = null;

        if (state.formData.facePhoto) {
          sponsorPhotoUrl = await uploadFileToStorage(state.formData.facePhoto, 'profile-photos');
        }

        if (state.formData.idDocument) {
          sponsorIdDocUrl = await uploadFileToStorage(state.formData.idDocument, 'id-documents');
        }

        const sponsorProfileData = {
          full_name: state.formData.full_name,
          phone: state.account.phone,
          country: state.formData.country,
          avatar_url: sponsorPhotoUrl,
          // Sponsor-specific fields
          family_size: parseInt(state.formData.familySize) || null,
          children_ages: state.formData.childrenAges || [],
          has_elderly: state.formData.hasElderly || false,
          preferred_nationality: state.formData.preferredNationality || [],
          preferred_languages: state.formData.preferredLanguages || [],
          salary_budget_min: parseSalaryToNumber(state.formData.salaryBudgetMin),
          salary_budget_max: parseSalaryToNumber(state.formData.salaryBudgetMax),
          accommodation_type: state.formData.accommodationType || '',
          room_type: state.formData.roomType || '',
        };

        if (updateProfile) {
          await updateProfile(sponsorProfileData);
          console.log('✅ Sponsor profile saved via updateProfile');
        }

      } else if (state.userType === 'agency') {
        // ==================== AGENCY PROFILE ====================
        console.log('📝 Processing agency profile data...');

        // Upload agency files
        let agencyRepPhotoUrl = null;
        let tradeLicenseUrl = null;
        let investorIdUrl = null;

        if (state.formData.facePhoto) {
          agencyRepPhotoUrl = await uploadFileToStorage(state.formData.facePhoto, 'profile-photos');
        }

        if (state.formData.tradeLicense) {
          tradeLicenseUrl = await uploadFileToStorage(state.formData.tradeLicense, 'trade-licenses');
        }

        if (state.formData.investorId) {
          investorIdUrl = await uploadFileToStorage(state.formData.investorId, 'investor-ids');
        }

        const agencyProfileData = {
          full_name: state.formData.authorizedPersonName || state.formData.full_name,
          phone: state.account.phone,
          country: state.formData.countriesOfOperation?.[0] || '',
          avatar_url: agencyRepPhotoUrl,
          // Agency-specific fields
          agency_name: state.formData.agencyName || '',
          trade_license_number: state.formData.tradeLicenseNumber || '',
          trade_license_url: tradeLicenseUrl,
          investor_id_url: investorIdUrl,
          countries_of_operation: state.formData.countriesOfOperation || [],
          cities_of_operation: state.formData.citiesOfOperation || [],
          contact_phone: state.formData.contactPhone || state.account.phone,
          contact_email: state.formData.contactEmail || '',
          authorized_person_name: state.formData.authorizedPersonName || '',
          authorized_person_title: state.formData.authorizedPersonTitle || '',
          services_offered: state.formData.servicesOffered || [],
          about_agency: state.formData.aboutAgency || '',
          support_hours: state.formData.supportHours || '',
          emergency_contact: state.formData.emergencyContact || '',
        };

        if (updateProfile) {
          await updateProfile(agencyProfileData);
          console.log('✅ Agency profile saved via updateProfile');
        }
      }

      // 4. Update registration_complete flag for all user types
      if (updateRegistrationStatus) {
        await updateRegistrationStatus(true);
        console.log('✅ Registration status set to complete');
      }

      console.log('✅ Onboarding completed successfully!');

      // Show success toast
      toast({
        title: 'Welcome aboard! 🎉',
        description: 'Your profile has been created successfully.',
      });

    } catch (error) {
      console.error('❌ Error during onboarding completion:', error);

      // FIX: Show clear error message and DO NOT mark as complete on failure
      toast({
        title: 'Failed to Save Profile',
        description: 'Please try again. Your data is saved locally and will not be lost.',
        variant: 'destructive',
      });

      // FIX: DO NOT mark registration as complete on failure
      // DO NOT clear draft - keep the data for retry
      // DO NOT navigate away - let user retry
      console.log('⚠️ Onboarding failed - data preserved in localStorage for retry');
      return; // STOP - don't proceed to dashboard
    }

    // Only clear draft and celebrate AFTER successful save
    clearDraft();
    triggerCelebration('confetti-cannon');

    // Determine the user-specific dashboard path
    const dashboardPath = state.userType === 'maid'
      ? '/dashboard/maid'
      : state.userType === 'sponsor'
      ? '/dashboard/sponsor'
      : state.userType === 'agency'
      ? '/dashboard/agency'
      : '/dashboard';

    console.log('🚀 Navigating to dashboard:', dashboardPath);

    // Navigate to user-specific dashboard after celebration
    setTimeout(() => {
      navigate(dashboardPath);
    }, 3000);
  }, [
    state.formData,
    state.account,
    state.userType,
    user,
    clearDraft,
    triggerCelebration,
    navigate,
    updateProfile,
    updateRegistrationStatus,
    createOrUpdateMaidProfile,
    uploadFileToStorage,
    calculateProfileCompletion,
    parseSalaryToNumber,
    parseExperienceToYears,
    toast,
  ]);

  // Calculate progress percentage
  const getProgressPercentage = useCallback((totalSteps) => {
    if (!totalSteps) return 0;
    return Math.round((state.currentStep / totalSteps) * 100);
  }, [state.currentStep]);

  // Check if can proceed to next step
  const canProceed = useCallback(() => {
    const errors = state.stepValidationErrors[state.currentStep];
    return !errors || Object.keys(errors).length === 0;
  }, [state.stepValidationErrors, state.currentStep]);

  // Context value
  const value = {
    // State
    ...state,
    isDraftLoaded,

    // Actions
    setUserType,
    updateFormData,
    updateAccount,
    updateConsents,
    updateConsent,
    nextStep,
    previousStep,
    goToStep,
    setStepErrors,
    clearStepErrors,
    awardPoints,
    unlockAchievement,
    triggerCelebration,
    completeOnboarding,
    clearDraft,
    hasDraft,

    // Computed
    getProgressPercentage,
    canProceed,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Hook to use onboarding context
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default OnboardingContext;
