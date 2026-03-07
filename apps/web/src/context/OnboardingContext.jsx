import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { auth, setUserTypeClaim, saveOnboardingProfileViaFunction, FIREBASE_TOKEN_KEY } from '@/lib/firebaseClient';
import { createUserWithEmailAndPassword, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/components/ui/use-toast';
import { useGameSounds } from '@/hooks/useGameSounds';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

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

    // Backward-compatibility aliases (snake_case) for draft recovery
    date_of_birth: null,
    marital_status: '',
    family_size: '',
    salary_budget: '',
    agency_name: '',
    license_number: '',
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
  const { updateRegistrationStatus, updateProfile, createOrUpdateMaidProfile, createOrUpdateSponsorProfile, createOrUpdateAgencyProfile, refreshUserProfile, user } = useAuth();
  const [state, setState] = useState(initialState);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const saveTimeoutRef = useRef(null);
  const isCompletingRef = useRef(false);
  const [completionError, setCompletionError] = useState(null);
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
        // Strip File objects and large data URLs to avoid exceeding localStorage quota
        const sanitizeForStorage = (data) => {
          if (data === null || data === undefined) return data;
          if (data instanceof File || data instanceof Blob) return null;
          if (typeof data === 'string' && data.startsWith('data:') && data.length > 1000) return null;
          if (Array.isArray(data)) return data.map(sanitizeForStorage).filter(v => v !== null);
          if (typeof data === 'object') {
            const clean = {};
            for (const [key, value] of Object.entries(data)) {
              const sanitized = sanitizeForStorage(value);
              if (sanitized !== null) clean[key] = sanitized;
            }
            return clean;
          }
          return data;
        };

        const toSave = {
          userType: state.userType,
          currentStep: state.currentStep,
          account: state.account,
          formData: sanitizeForStorage(state.formData),
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
  const uploadFileToStorage = useCallback(async (file, folder, overrideUserId) => {
    const uid = overrideUserId || user?.id || auth?.currentUser?.uid;
    if (!file || !uid) return null;

    try {
      const fileName = `${Date.now()}_${file.name || 'upload'}`;
      const storageRef = ref(storage, `${folder}/${uid}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
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

  // Helper: Convert children age labels to integer array
  // DB column children_ages is integer[] so we must convert string labels to representative ages
  const convertChildrenAgesToIntegers = useCallback((childrenAgesRaw) => {
    if (!childrenAgesRaw) return [];
    const items = Array.isArray(childrenAgesRaw) ? childrenAgesRaw : [childrenAgesRaw];
    // Map string labels to representative integer ages
    const labelToAges = {
      'none': [],
      'infants': [1],
      'toddlers': [3],
      'children': [8],
      'teenagers': [14],
      'mixed': [3, 8, 14],
    };
    const ages = [];
    for (const item of items) {
      if (typeof item === 'number') {
        ages.push(item);
      } else if (typeof item === 'string') {
        const key = item.toLowerCase().trim();
        if (labelToAges[key]) {
          ages.push(...labelToAges[key]);
        } else {
          const parsed = parseInt(key);
          if (!isNaN(parsed)) ages.push(parsed);
        }
      }
    }
    return ages;
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
    // Guard against double execution (e.g., double-click or re-render)
    if (isCompletingRef.current) {
      return;
    }
    isCompletingRef.current = true;
    setCompletionError(null);

    // ================================================================
    // CRITICAL FIX: Create Firebase Auth account if not authenticated
    // The AccountStep only collects email/password — it never actually
    // creates the Firebase user. We do it here before saving profile.
    // ================================================================
    let currentUserId = user?.id || auth?.currentUser?.uid;

    if (!currentUserId) {
      if (!state.account.email || !state.account.password) {
        console.error('❌ Cannot create account: missing email or password');
        isCompletingRef.current = false;
        toast({
          title: 'Missing Account Info',
          description: 'Email and password are required. Please go back to the account step.',
          variant: 'destructive',
        });
        return;
      }

      try {
        // Create the Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          state.account.email,
          state.account.password
        );

        const firebaseUser = userCredential.user;
        currentUserId = firebaseUser.uid;

        // Set display name
        if (state.formData.full_name) {
          await firebaseUpdateProfile(firebaseUser, {
            displayName: state.formData.full_name,
          });
        }

        // Get and store the token for Hasura/Apollo
        const idToken = await firebaseUser.getIdToken();
        localStorage.setItem(FIREBASE_TOKEN_KEY, idToken);

        // Wait for AuthContext to pick up the new user via onAuthStateChanged
        // Use a polling approach instead of a fixed timeout to ensure auth state propagates
        const waitForAuth = async (maxWaitMs = 5000) => {
          const start = Date.now();
          while (Date.now() - start < maxWaitMs) {
            if (auth.currentUser && auth.currentUser.uid) {
              return true;
            }
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          return !!auth.currentUser?.uid;
        };
        await waitForAuth();

      } catch (accountError) {
        console.error('❌ Failed to create Firebase account:', accountError);
        isCompletingRef.current = false;

        // Provide user-friendly error
        let errorMsg = 'Failed to create your account. Please try again.';
        if (accountError.code === 'auth/email-already-in-use') {
          errorMsg = 'An account with this email already exists. Please use a different email or log in.';
        } else if (accountError.code === 'auth/weak-password') {
          errorMsg = 'Password is too weak. Please go back and choose a stronger password.';
        } else if (accountError.code === 'auth/invalid-email') {
          errorMsg = 'Invalid email address. Please go back and correct it.';
        }

        toast({
          title: 'Account Creation Failed',
          description: errorMsg,
          variant: 'destructive',
        });
        return;
      }
    }

    // At this point we must have a valid user ID
    if (!currentUserId) {
      console.error('❌ Still no user ID after account creation attempt');
      isCompletingRef.current = false;
      toast({
        title: 'Session Error',
        description: 'Please refresh the page and try again. Your data is saved locally.',
        variant: 'destructive',
      });
      return;
    }

    // Use currentUserId throughout (instead of user?.id which may not be set yet)
    const userId = currentUserId;

    try {
      // STEP 0: Set Firebase JWT claims FIRST (before any GraphQL mutations)
      // This ensures the JWT token has the correct Hasura role for database writes
      try {
        await setUserTypeClaim(state.userType);
        // Force refresh the token to pick up new claims, then store it
        if (auth.currentUser) {
          const freshToken = await auth.currentUser.getIdToken(true);
          localStorage.setItem(FIREBASE_TOKEN_KEY, freshToken);
        } else {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (claimError) {
        // Could not set JWT claims via Cloud Function - try fallback
        // FALLBACK: Force refresh the token to pick up any claims set by authOnUserCreated
        // The authOnUserCreated trigger sets default 'user' claims which still allows writes
        try {
          if (auth.currentUser) {
            const refreshedToken = await auth.currentUser.getIdToken(true);
            localStorage.setItem(FIREBASE_TOKEN_KEY, refreshedToken);
          }
        } catch (tokenRefreshError) {
          // Could not refresh token
        }
      }

      // ================================================================
      // STEP 1: Upload files to Firebase Storage (all user types)
      // ================================================================
      let profilePhotoUrl = null;
      let videoUrl = null;
      let idDocumentUrl = null;

      // Helper: Convert data URL to Blob without fetch (avoids CSP issues with data: URIs)
      const dataUrlToBlob = (dataUrl) => {
        const [header, base64Data] = dataUrl.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const byteString = atob(base64Data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mime });
      };

      if (state.formData.facePhoto) {
        profilePhotoUrl = await uploadFileToStorage(state.formData.facePhoto, 'profile-photos', userId);
      }

      if (state.formData.videoCV) {
        videoUrl = await uploadFileToStorage(state.formData.videoCV, 'video-cvs', userId);
      }

      if (state.formData.idDocument) {
        idDocumentUrl = await uploadFileToStorage(state.formData.idDocument, 'id-documents', userId);
      }

      // Upload trade license / investor ID for agency
      let tradeLicenseUrl = null;
      let investorIdUrl = null;
      if (state.userType === 'agency') {
        if (state.formData.tradeLicense) {
          tradeLicenseUrl = await uploadFileToStorage(state.formData.tradeLicense, 'trade-licenses', userId);
        }
        if (state.formData.investorId) {
          investorIdUrl = await uploadFileToStorage(state.formData.investorId, 'investor-ids', userId);
        }
      }

      // Upload gallery photos for maid
      let galleryPhotoUrls = [];
      let cvDocumentUrl = null;
      if (state.userType === 'maid') {
        if (state.formData.previousEmploymentCV?.data) {
          const cvBlob = dataUrlToBlob(state.formData.previousEmploymentCV.data);
          cvDocumentUrl = await uploadFileToStorage(cvBlob, 'employment-cvs', userId);
        }
        if (state.formData.profilePhotos && state.formData.profilePhotos.length > 0) {
          for (let i = 0; i < state.formData.profilePhotos.length; i++) {
            const photo = state.formData.profilePhotos[i];
            if (photo?.url) {
              try {
                const photoBlob = dataUrlToBlob(photo.url);
                const photoUrl = await uploadFileToStorage(photoBlob, 'gallery-photos', userId);
                if (photoUrl) galleryPhotoUrls.push(photoUrl);
              } catch (err) {
                console.error(`Failed to upload gallery photo ${i}:`, err);
              }
            }
          }
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
          country: state.formData.country || '',
          city: state.formData.city || '',
          stateProvince: state.formData.city || '',
          streetAddress: state.formData.address || '',

          // Professional (from MaidProfessionStep)
          // Keys: steps use profession, visa_status, education_level
          primaryProfession: state.formData.profession || state.formData.primaryProfession || '',
          currentVisaStatus: state.formData.visa_status || state.formData.visaStatus || '',
          educationLevel: state.formData.education_level || state.formData.educationLevel || '',

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
          livingArrangement: (state.formData.work_preferences || []).includes('Live-in')
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
          consents_accepted: true,
          profile_completed: true,
          profile_completed_at: new Date().toISOString(),
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString(),
        };

        // 4. Store gallery photos and documents in maid_documents table (separate from profile)
        // This will be handled by the document service if needed
        // 3. Save to maid_profiles via AuthContext
        if (createOrUpdateMaidProfile) {
          await createOrUpdateMaidProfile(userId, maidProfileData);

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
          }
        } else {
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
        // Upload sponsor files
        let sponsorPhotoUrl = null;
        let sponsorIdDocUrl = null;

        if (state.formData.facePhoto) {
          sponsorPhotoUrl = await uploadFileToStorage(state.formData.facePhoto, 'profile-photos');
        }

        if (state.formData.idDocument) {
          sponsorIdDocUrl = await uploadFileToStorage(state.formData.idDocument, 'id-documents');
        }

        // FIX: Only include columns that exist in the profiles table
        // sponsor-specific fields go via Cloud Function / fallback save below
        const sponsorProfileData = {
          full_name: state.formData.full_name,
          phone: state.account.phone,
          country: state.formData.country,
          avatar_url: sponsorPhotoUrl,
          registration_complete: true,
        };

        if (updateProfile) {
          await updateProfile(sponsorProfileData);
        }

      } else if (state.userType === 'agency') {
        // ==================== AGENCY PROFILE ====================
        // Upload agency files
        let agencyRepPhotoUrl = null;
        let tradeLicenseUrl = null;
        let investorIdUrl = null;

        if (state.formData.facePhoto) {
          agencyRepPhotoUrl = await uploadFileToStorage(state.formData.facePhoto, 'profile-photos');
        }

        // idDocument from biometric step is the authorized person's ID document
        if (state.formData.idDocument) {
          investorIdUrl = await uploadFileToStorage(state.formData.idDocument, 'investor-ids');
        } else if (state.formData.investorId) {
          investorIdUrl = await uploadFileToStorage(state.formData.investorId, 'investor-ids');
        }

        // tradeLicense may be uploaded separately or not collected during onboarding
        if (state.formData.tradeLicense) {
          tradeLicenseUrl = await uploadFileToStorage(state.formData.tradeLicense, 'trade-licenses');
        }

        const agencyProfileData = {
          full_name: state.formData.agencyName || state.formData.full_name,
          phone: state.formData.contact_phone || state.account.phone,
          country: state.formData.country || '',
          avatar_url: agencyRepPhotoUrl,
          // Agency-specific fields
          agency_name: state.formData.agencyName || '',
          trade_license_number: state.formData.tradeLicenseNumber || '',
          trade_license_url: tradeLicenseUrl,
          investor_id_url: investorIdUrl,
          countries_of_operation: state.formData.source_countries || [],
          cities_of_operation: state.formData.city ? [state.formData.city] : [],
          contact_phone: state.formData.contact_phone || state.account.phone,
          contact_email: state.formData.contact_email || '',
          authorized_person_name: state.formData.rep_name || '',
          authorized_person_position: state.formData.rep_position || '',
          services_offered: state.formData.specializations || state.formData.services || [],
          about_agency: state.formData.agency_description || '',
          support_hours: state.formData.supportHours || '',
          emergency_contact: state.formData.emergencyContact || '',
          consents_accepted: true,
          profile_completed: true,
          profile_completed_at: new Date().toISOString(),
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString(),
        };

        if (updateProfile) {
          await updateProfile(agencyProfileData);
        }
      }

      // ================================================================
      // STEP 2: Build profile data for Cloud Function
      // ================================================================
      let profileData = {};
      let basicProfileData = {};

      if (state.userType === 'maid') {
        profileData = {
          full_name: state.formData.full_name || '',
          date_of_birth: state.formData.dateOfBirth || null,
          nationality: state.formData.nationality || '',
          religion: state.formData.religion || '',
          marital_status: state.formData.maritalStatus || '',
          current_location: [state.formData.city, state.formData.country].filter(Boolean).join(', '),
          country: state.formData.country || '',
          state_province: state.formData.city || '',
          street_address: state.formData.address || '',
          primary_profession: state.formData.profession || state.formData.primaryProfession || '',
          current_visa_status: state.formData.visa_status || state.formData.visaStatus || '',
          education_level: state.formData.education_level || state.formData.educationLevel || '',
          skills: state.formData.skills || [],
          languages: state.formData.languages || [],
          experience_years: parseExperienceToYears(state.formData.experience_level),
          previous_countries: state.formData.countries_worked_in || [],
          preferred_salary_min: parseSalaryToNumber(state.formData.expected_salary),
          work_preferences: state.formData.work_preferences || [],
          contract_duration_preference: state.formData.contract_type || null,
          live_in_preference: (state.formData.work_preferences || []).includes('Live-in'),
          about_me: state.formData.about_me || '',
          profile_photo_url: profilePhotoUrl,
          introduction_video_url: videoUrl,
          phone_number: state.account.phone || '',
          profile_completion_percentage: calculateProfileCompletion(state.formData),
          availability_status: 'available',
        };
        basicProfileData = {
          full_name: state.formData.full_name || '',
          phone: state.account.phone || '',
          country: state.formData.country || '',
          avatar_url: profilePhotoUrl,
        };
      } else if (state.userType === 'sponsor') {
        // FIX: Map form keys (from step components) to correct DB column names
        // Form keys: familySize, childrenAges (string), elderly (string), propertyType,
        //   preferred_nationalities (array), preferred_languages (array), benefits (array),
        //   living_arrangement (string), working_hours (string), days_off (string)
        const childrenAgesInt = convertChildrenAgesToIntegers(state.formData.childrenAges);
        const elderlyVal = state.formData.elderly || state.formData.hasElderly;
        const elderlyNeeded = elderlyVal === 'none' || elderlyVal === false || !elderlyVal ? false : true;
        const workingHoursRaw = state.formData.working_hours || state.formData.workingHoursPerDay;
        const workingHours = workingHoursRaw === 'full-time' ? 8
          : workingHoursRaw === 'part-time' ? 4
          : parseInt(workingHoursRaw) || 8;
        const daysOffRaw = state.formData.days_off || state.formData.daysOffPerWeek;
        const daysOff = typeof daysOffRaw === 'string'
          ? parseInt(daysOffRaw.replace(/[^\d]/g, '')) || 1
          : parseInt(daysOffRaw) || 1;
        const livingArrangement = state.formData.living_arrangement || state.formData.roomType || '';
        const liveInRequired = livingArrangement === 'live-in' || livingArrangement === 'Live-in'
          || state.formData.liveInRequired === true;

        profileData = {
          full_name: state.formData.full_name || '',
          household_size: parseInt(state.formData.familySize) || 1,
          number_of_children: childrenAgesInt.length || (state.formData.childrenAges && state.formData.childrenAges !== 'none' ? 1 : 0),
          children_ages: childrenAgesInt,
          elderly_care_needed: elderlyNeeded,
          pets: state.formData.hasPets || false,
          pet_types: state.formData.petTypes || [],
          city: state.formData.city || '',
          country: state.formData.country || '',
          address: state.formData.address || '',
          accommodation_type: state.formData.propertyType || state.formData.accommodationType || '',
          preferred_nationality: state.formData.preferred_nationalities || state.formData.preferredNationality || [],
          preferred_experience_years: parseExperienceToYears(state.formData.preferredExperience) || 0,
          required_skills: state.formData.requiredSkills || [],
          preferred_languages: state.formData.preferred_languages || state.formData.preferredLanguages || [],
          salary_budget_min: parseSalaryToNumber(state.formData.salaryBudgetMin),
          salary_budget_max: parseSalaryToNumber(state.formData.salaryBudgetMax),
          currency: state.formData.currency || 'AED',
          live_in_required: liveInRequired,
          working_hours_per_day: workingHours,
          days_off_per_week: daysOff,
          overtime_available: state.formData.overtimeAvailable || false,
          additional_benefits: state.formData.benefits || state.formData.additionalBenefits || [],
          occupation: state.formData.occupation || null,
          company: state.formData.company || null,
          payment_frequency: state.formData.payment_frequency || null,
          contract_duration: state.formData.contract_duration || null,
          room_amenities: state.formData.room_amenities || [],
          religion: state.formData.preferred_religion || state.formData.religion || null,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          profile_completed: true,
          profile_completed_at: new Date().toISOString(),
        };
        basicProfileData = {
          full_name: state.formData.full_name || '',
          phone: state.account.phone || '',
          country: state.formData.country || '',
          avatar_url: profilePhotoUrl,
        };
      } else if (state.userType === 'agency') {
        profileData = {
          agencyName: state.formData.agencyName || '',
          full_name: state.formData.agencyName || state.formData.full_name || '',
          tradeLicenseNumber: state.formData.tradeLicenseNumber || '',
          countryOfRegistration: state.formData.country || '',
          country: state.formData.country || '',
          city: state.formData.city || '',
          contactPhone: state.formData.contact_phone || state.account.phone || '',
          officialEmail: state.formData.contact_email || '',
          headOfficeAddress: state.formData.office_address || '',
          operatingCities: state.formData.city ? [state.formData.city] : [],
          operatingRegions: state.formData.source_countries || [],
          servicesOffered: state.formData.specializations || state.formData.services || [],
          aboutAgency: state.formData.agency_description || '',
          supportHoursStart: state.formData.supportHoursStart || '09:00',
          supportHoursEnd: state.formData.supportHoursEnd || '17:00',
          emergencyContactPhone: state.formData.emergencyContact || '',
          authorizedPersonName: state.formData.rep_name || '',
          authorizedPersonPosition: state.formData.rep_position || '',
          authorizedPersonPhone: state.formData.rep_phone || '',
          authorizedPersonEmail: state.formData.rep_email || '',
          logo: profilePhotoUrl,
          tradeLicenseDocumentUrl: tradeLicenseUrl,
          authorizedPersonIdDocumentUrl: investorIdUrl,
        };
        basicProfileData = {
          full_name: state.formData.agencyName || state.formData.full_name || '',
          phone: state.formData.contact_phone || state.account.phone || '',
          country: state.formData.country || '',
          avatar_url: profilePhotoUrl,
        };
      }

      // ================================================================
      // STEP 3: Save via Cloud Function (PRIMARY) or fallback to direct GraphQL
      // ================================================================
      let savedViaCloudFunction = false;

      try {
        const cfResult = await saveOnboardingProfileViaFunction({
          userType: state.userType,
          profileData,
          basicProfileData,
        });
        savedViaCloudFunction = true;
      } catch (cfError) {
        // Cloud Function save failed, fall back to direct GraphQL
      }

      // FALLBACK: If Cloud Function failed, try the direct GraphQL mutations
      if (!savedViaCloudFunction) {
        if (state.userType === 'maid') {
          if (createOrUpdateMaidProfile) {
            // Re-build maid data with camelCase names for AuthContext function
            const maidProfileData = {
              full_name: state.formData.full_name || '',
              dateOfBirth: state.formData.dateOfBirth || null,
              nationality: state.formData.nationality || '',
              religion: state.formData.religion || '',
              maritalStatus: state.formData.maritalStatus || '',
              current_location: [state.formData.city, state.formData.country].filter(Boolean).join(', '),
              country: state.formData.country || '',
              stateProvince: state.formData.city || '',
              streetAddress: state.formData.address || '',
              primaryProfession: state.formData.profession || state.formData.primaryProfession || '',
              currentVisaStatus: state.formData.visa_status || state.formData.visaStatus || '',
              educationLevel: state.formData.education_level || state.formData.educationLevel || '',
              skills: state.formData.skills || [],
              languagesSpoken: state.formData.languages || [],
              totalExperienceYears: parseExperienceToYears(state.formData.experience_level),
              previousCountries: state.formData.countries_worked_in || [],
              salaryExpectations: parseSalaryToNumber(state.formData.expected_salary),
              workPreferences: state.formData.work_preferences || [],
              contractDuration: state.formData.contract_type || null,
              livingArrangement: (state.formData.work_preferences || []).includes('Live-in')
                ? 'live-in' : 'live-out',
              aboutMe: state.formData.about_me || '',
              profilePictureUrl: profilePhotoUrl,
              introduction_video_url: videoUrl,
              phone_number: state.account.phone || '',
              profile_completion_percentage: calculateProfileCompletion(state.formData),
              availability: 'available',
              consents_accepted: true,
              profile_completed: true,
              profile_completed_at: new Date().toISOString(),
              onboarding_completed: true,
              onboarding_completed_at: new Date().toISOString(),
            };
            await createOrUpdateMaidProfile(userId, maidProfileData);
          }
        } else if (state.userType === 'sponsor') {
          if (createOrUpdateSponsorProfile) {
            // FIX: Map form keys to correct DB column names (same logic as Cloud Function path)
            const childrenAgesInt = convertChildrenAgesToIntegers(state.formData.childrenAges);
            const elderlyVal = state.formData.elderly || state.formData.hasElderly;
            const elderlyNeeded = elderlyVal === 'none' || elderlyVal === false || !elderlyVal ? false : true;
            const workHoursRaw = state.formData.working_hours || state.formData.workingHoursPerDay;
            const workHours = workHoursRaw === 'full-time' ? 8
              : workHoursRaw === 'part-time' ? 4
              : parseInt(workHoursRaw) || 8;
            const daysOffRaw = state.formData.days_off || state.formData.daysOffPerWeek;
            const daysOff = typeof daysOffRaw === 'string'
              ? parseInt(daysOffRaw.replace(/[^\d]/g, '')) || 1
              : parseInt(daysOffRaw) || 1;
            const livingArr = state.formData.living_arrangement || state.formData.roomType || '';
            const liveIn = livingArr === 'live-in' || livingArr === 'Live-in'
              || state.formData.liveInRequired === true;

            const sponsorProfileData = {
              full_name: state.formData.full_name || '',
              household_size: parseInt(state.formData.familySize) || 1,
              number_of_children: childrenAgesInt.length || (state.formData.childrenAges && state.formData.childrenAges !== 'none' ? 1 : 0),
              children_ages: childrenAgesInt,
              elderly_care_needed: elderlyNeeded,
              pets: state.formData.hasPets || false,
              pet_types: state.formData.petTypes || [],
              city: state.formData.city || '',
              country: state.formData.country || '',
              address: state.formData.address || '',
              accommodation_type: state.formData.propertyType || state.formData.accommodationType || '',
              preferred_nationality: state.formData.preferred_nationalities || state.formData.preferredNationality || [],
              preferred_experience_years: parseExperienceToYears(state.formData.preferredExperience) || 0,
              required_skills: state.formData.requiredSkills || [],
              preferred_languages: state.formData.preferred_languages || state.formData.preferredLanguages || [],
              salary_budget_min: parseSalaryToNumber(state.formData.salaryBudgetMin),
              salary_budget_max: parseSalaryToNumber(state.formData.salaryBudgetMax),
              currency: state.formData.currency || 'AED',
              live_in_required: liveIn,
              working_hours_per_day: workHours,
              days_off_per_week: daysOff,
              overtime_available: state.formData.overtimeAvailable || false,
              additional_benefits: state.formData.benefits || state.formData.additionalBenefits || [],
              occupation: state.formData.occupation || null,
              company: state.formData.company || null,
              payment_frequency: state.formData.payment_frequency || null,
              contract_duration: state.formData.contract_duration || null,
              room_amenities: state.formData.room_amenities || [],
              religion: state.formData.preferred_religion || state.formData.religion || null,
              onboarding_completed: true,
              onboarding_completed_at: new Date().toISOString(),
              profile_completed: true,
              profile_completed_at: new Date().toISOString(),
            };

            const mutationResult = await createOrUpdateSponsorProfile(userId, sponsorProfileData);

            if (!mutationResult || !mutationResult.id) {
              console.error('❌ Sponsor profile mutation returned null — data may not have saved!');
              console.error('This usually means the JWT token lacks proper Hasura claims.');
              // Throw to trigger the error toast so user knows to retry
              throw new Error('Profile save returned null. Please try logging out and back in, then retry.');
            }
          }
        } else if (state.userType === 'agency') {
          if (createOrUpdateAgencyProfile) {
            await createOrUpdateAgencyProfile(userId, profileData);
          }
        }

        // Update profiles table separately for fallback path
        try {
          const UPDATE_PROFILES_ONLY = gql`
            mutation UpdateProfilesTableOnly($id: String!, $data: profiles_set_input!) {
              update_profiles_by_pk(pk_columns: {id: $id}, _set: $data) {
                id
                full_name
                user_type
                registration_complete
              }
            }
          `;
          await apolloClient.mutate({
            mutation: UPDATE_PROFILES_ONLY,
            variables: {
              id: userId,
              data: {
                ...basicProfileData,
                user_type: state.userType,
                registration_complete: true,
                updated_at: new Date().toISOString(),
              },
            },
          });
        } catch (profilesTableError) {
          // Could not update profiles table in fallback path
        }
      }

      // ================================================================
      // STEP 4: Set registration_complete flag (if not already done by CF)
      // ================================================================
      if (!savedViaCloudFunction) {
        try {
          // Use direct Apollo mutation instead of AuthContext function
          // (AuthContext.user may not be populated yet during onboarding)
          const SET_REG_COMPLETE = gql`
            mutation SetRegistrationComplete($id: String!, $now: timestamptz!) {
              update_profiles_by_pk(pk_columns: {id: $id}, _set: {registration_complete: true, updated_at: $now}) {
                id
                registration_complete
              }
            }
          `;
          await apolloClient.mutate({
            mutation: SET_REG_COMPLETE,
            variables: { id: userId, now: new Date().toISOString() },
          });
        } catch (regError) {
          // Could not set registration status
        }
      }

      // 5. Refresh AuthContext user state so dashboard has fresh data
      if (refreshUserProfile) {
        try {
          await refreshUserProfile();
        } catch (refreshError) {
          // Could not refresh user profile
        }
      }

      // Show success toast
      toast({
        title: 'Welcome aboard! 🎉',
        description: 'Your profile has been created successfully.',
      });

    } catch (error) {
      console.error('❌ Error during onboarding completion:', error);
      isCompletingRef.current = false; // Reset guard so user can retry
      setCompletionError(error.message || 'An unexpected error occurred. Please try again.');

      // FIX: Show clear error message and DO NOT mark as complete on failure
      toast({
        title: 'Failed to Save Profile',
        description: 'Please try again. Your data is saved locally and will not be lost.',
        variant: 'destructive',
      });

      // FIX: DO NOT mark registration as complete on failure
      // DO NOT clear draft - keep the data for retry
      // DO NOT navigate away - let user retry
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
    createOrUpdateSponsorProfile,
    createOrUpdateAgencyProfile,
    refreshUserProfile,
    uploadFileToStorage,
    calculateProfileCompletion,
    parseSalaryToNumber,
    parseExperienceToYears,
    convertChildrenAgesToIntegers,
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
    completionError,
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
