/**
 * Onboarding Context for Mobile
 *
 * Manages the multi-step onboarding flow state including:
 * - User type selection (maid/sponsor/agency)
 * - Form data collection for each step
 * - Gamification (points, achievements, levels)
 * - Draft persistence with AsyncStorage
 * - File uploads to Firebase Storage
 *
 * Ported from web with React Native adaptations.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useSoundContext } from './SoundContext';

// ==================== TYPES ====================

export type UserType = 'maid' | 'sponsor' | 'agency';
export type CelebrationType = 'confetti' | 'confetti-cannon' | 'achievement' | null;

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  unlockedAt: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
}

export interface AccountData {
  email: string;
  password: string;
  phone: string;
  phoneVerified: boolean;
}

export interface GamificationData {
  points: number;
  level: number;
  achievements: Achievement[];
  badges: Badge[];
  startedAt: number | null;
}

export interface ConsentsData {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  backgroundCheckConsent: boolean;
  communicationConsent: boolean;
  profileSharingAccepted: boolean;
  notificationsEnabled: boolean;
}

export interface FormData {
  // Personal Info (all users)
  full_name: string;
  dateOfBirth: string | null;
  nationality: string;
  religion: string;
  maritalStatus: string;

  // Biometric & Documents
  facePhoto: string | null; // URI or base64
  idDocument: string | null;
  tradeLicense: string | null; // For agency
  investorId: string | null; // For agency

  // Maid-specific
  address: string;
  country: string;
  city: string;
  primaryProfession: string;
  visaStatus: string;
  educationLevel: string;
  skills: string[];
  languages: string[];
  experience_level: string;
  countries_worked_in: string[];
  expected_salary: string;
  work_preferences: string[];
  contract_type: string;
  accommodation_preference: string;
  about_me: string;
  videoCV: string | null;
  profilePhotos: Array<{ url: string; id: string }>;
  previousEmploymentCV: { data: string; name: string } | null;

  // Sponsor-specific
  familySize: string;
  childrenAges: string[];
  hasElderly: boolean;
  preferredNationality: string[];
  preferredLanguages: string[];
  preferredSkills: string[];
  salaryBudgetMin: string;
  salaryBudgetMax: string;
  accommodationType: string;
  roomType: string;

  // Agency-specific
  agencyName: string;
  tradeLicenseNumber: string;
  countriesOfOperation: string[];
  citiesOfOperation: string[];
  contactPhone: string;
  contactEmail: string;
  authorizedPersonName: string;
  authorizedPersonTitle: string;
  servicesOffered: string[];
  aboutAgency: string;
  supportHours: string;
  emergencyContact: string;
}

export interface OnboardingState {
  userType: UserType | null;
  currentStep: number;
  account: AccountData;
  formData: FormData;
  gamification: GamificationData;
  completedSteps: number[];
  stepValidationErrors: Record<number, Record<string, string>>;
  isTransitioning: boolean;
  showCelebration: boolean;
  celebrationType: CelebrationType;
  consents: ConsentsData;
}

export interface DraftInfo {
  exists: boolean;
  userType: UserType | null;
  timestamp: number | null;
  daysRemaining: number | null;
}

export interface OnboardingContextType extends OnboardingState {
  state: OnboardingState; // Provide state as a nested object for easier access
  isDraftLoaded: boolean;
  setUserType: (type: UserType) => void;
  updateFormData: (data: Partial<FormData>) => void;
  updateAccount: (data: Partial<AccountData>) => void;
  updateAccountData: (data: Partial<AccountData>) => void; // Alias for updateAccount
  updateConsents: (data: Partial<ConsentsData>) => void;
  updateConsent: (id: keyof ConsentsData, value: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  setStepErrors: (errors: Record<string, string>) => void;
  clearStepErrors: () => void;
  awardPoints: (points: number, reason?: string) => void;
  unlockAchievement: (achievementId: string, name: string, icon: string, points?: number) => void;
  addAchievement: (achievement: { id: string; name: string; description?: string; icon: string; points?: number; trigger?: string; earnedAt?: string; }) => void;
  triggerCelebration: (type?: CelebrationType) => void;
  completeOnboarding: () => Promise<void>;
  clearDraft: () => Promise<void>;
  resetOnboarding: () => void;
  hasDraft: () => Promise<boolean>;
  getDraftInfo: () => Promise<DraftInfo | null>;
  loadDraftData: () => Promise<void>;
  getProgress: () => number;
  getProgressPercentage: (totalSteps: number) => number;
  canProceed: () => boolean;
}

// ==================== CONSTANTS ====================

const STORAGE_KEY = 'ethiopian_maids_onboarding_draft';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// ==================== INITIAL STATE ====================

const initialFormData: FormData = {
  // Personal Info
  full_name: '',
  dateOfBirth: null,
  nationality: '',
  religion: '',
  maritalStatus: '',

  // Documents
  facePhoto: null,
  idDocument: null,
  tradeLicense: null,
  investorId: null,

  // Maid-specific
  address: '',
  country: '',
  city: '',
  primaryProfession: '',
  visaStatus: '',
  educationLevel: '',
  skills: [],
  languages: [],
  experience_level: '',
  countries_worked_in: [],
  expected_salary: '',
  work_preferences: [],
  contract_type: '',
  accommodation_preference: '',
  about_me: '',
  videoCV: null,
  profilePhotos: [],
  previousEmploymentCV: null,

  // Sponsor-specific
  familySize: '',
  childrenAges: [],
  hasElderly: false,
  preferredNationality: [],
  preferredLanguages: [],
  preferredSkills: [],
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
};

const initialState: OnboardingState = {
  userType: null,
  currentStep: 0,
  account: {
    email: '',
    password: '',
    phone: '',
    phoneVerified: false,
  },
  formData: initialFormData,
  gamification: {
    points: 0,
    level: 1,
    achievements: [],
    badges: [],
    startedAt: null,
  },
  completedSteps: [],
  stepValidationErrors: {},
  isTransitioning: false,
  showCelebration: false,
  celebrationType: null,
  consents: {
    termsAccepted: false,
    privacyAccepted: false,
    backgroundCheckConsent: false,
    communicationConsent: false,
    profileSharingAccepted: false,
    notificationsEnabled: false,
  },
};

// ==================== CONTEXT ====================

const OnboardingContext = createContext<OnboardingContextType | null>(null);

// ==================== PROVIDER ====================

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { showSuccess, showError } = useToast();
  const { user, updateRegistrationStatus, updateProfile } = useAuth();
  const [state, setState] = useState<OnboardingState>(initialState);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storage = getStorage();

  // Sound effects - may not be available if SoundProvider is not mounted
  let soundContext: { playPoints: () => Promise<void>; playLevelUp: () => Promise<void>; playSuccess: () => Promise<void> } | null = null;
  try {
    soundContext = useSoundContext();
  } catch {
    // SoundContext not available yet
  }

  // ==================== DRAFT PERSISTENCE ====================

  // Load draft from AsyncStorage on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const savedDraft = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          // Only restore if draft is less than 7 days old
          const sevenDaysAgo = Date.now() - SEVEN_DAYS_MS;
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
        console.error('[Onboarding] Error loading draft:', error);
      }
      setIsDraftLoaded(true);
    };

    loadDraft();
  }, []);

  // Save draft immediately (no debounce) - use for critical saves like points
  const saveImmediately = useCallback(async (stateToSave?: OnboardingState) => {
    const dataToSave = stateToSave || state;
    try {
      const toSave = {
        userType: dataToSave.userType,
        currentStep: dataToSave.currentStep,
        account: dataToSave.account,
        formData: dataToSave.formData,
        gamification: dataToSave.gamification,
        completedSteps: dataToSave.completedSteps,
        consents: dataToSave.consents,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      console.log('[Onboarding] Draft saved immediately');
    } catch (error) {
      console.error('[Onboarding] Error saving draft immediately:', error);
    }
  }, [state]);

  // Save draft (debounced) - for regular form field updates
  const saveDraft = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
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
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        console.log('[Onboarding] Draft saved');
      } catch (error) {
        console.error('[Onboarding] Error saving draft:', error);
      }
    }, 2000); // 2 second debounce
  }, [state]);

  // Auto-save on state changes
  useEffect(() => {
    if (isDraftLoaded && state.userType) {
      saveDraft();
    }
  }, [state, isDraftLoaded, saveDraft]);

  // Save on app state change (going to background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        saveDraft();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [saveDraft]);

  // Clear draft
  const clearDraft = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }, []);

  // Reset onboarding (alias for starting fresh)
  const resetOnboarding = useCallback(() => {
    setState(initialState);
  }, []);

  // Check if draft exists
  const hasDraft = useCallback(async () => {
    try {
      const savedDraft = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        return parsed.userType && parsed.currentStep > 0;
      }
    } catch (error) {
      console.error('[Onboarding] Error checking draft:', error);
    }
    return false;
  }, []);

  // Get draft info without loading full state
  const getDraftInfo = useCallback(async (): Promise<DraftInfo | null> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return {
          exists: false,
          userType: null,
          timestamp: null,
          daysRemaining: null,
        };
      }

      const draft = JSON.parse(stored);
      const now = Date.now();
      const sevenDaysAgo = now - SEVEN_DAYS_MS;

      // Check if draft has expired
      if (draft.gamification?.startedAt && draft.gamification.startedAt < sevenDaysAgo) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        return {
          exists: false,
          userType: null,
          timestamp: null,
          daysRemaining: null,
        };
      }

      const expiresAt = (draft.gamification?.startedAt || now) + SEVEN_DAYS_MS;
      const daysRemaining = Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000));

      return {
        exists: true,
        userType: draft.userType || null,
        timestamp: draft.gamification?.startedAt || null,
        daysRemaining,
      };
    } catch (error) {
      console.error('[Onboarding] Error getting draft info:', error);
      return null;
    }
  }, []);

  // Load draft data into state
  const loadDraftData = useCallback(async () => {
    try {
      const savedDraft = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        const sevenDaysAgo = Date.now() - SEVEN_DAYS_MS;

        // Only restore if draft is less than 7 days old
        if (parsed.gamification?.startedAt && parsed.gamification.startedAt > sevenDaysAgo) {
          setState(prev => ({
            ...prev,
            ...parsed,
            // Reset UI states
            isTransitioning: false,
            showCelebration: false,
          }));
          console.log('[Onboarding] Draft data loaded');
        }
      }
    } catch (error) {
      console.error('[Onboarding] Error loading draft data:', error);
    }
  }, []);

  // ==================== USER TYPE ====================

  const setUserType = useCallback((type: UserType) => {
    setState(prev => {
      const newState = {
        ...prev,
        userType: type,
        gamification: {
          ...prev.gamification,
          startedAt: prev.gamification.startedAt || Date.now(),
          points: prev.gamification.points + 10, // Award points for selecting user type
        },
      };

      // Save immediately after setting user type to preserve points
      setTimeout(() => {
        saveImmediately(newState);
      }, 50);

      return newState;
    });
  }, [saveImmediately]);

  // ==================== FORM DATA ====================

  const updateFormData = useCallback((data: Partial<FormData>) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        ...data,
      },
    }));
  }, []);

  const updateAccount = useCallback((data: Partial<AccountData>) => {
    setState(prev => ({
      ...prev,
      account: {
        ...prev.account,
        ...data,
      },
    }));
  }, []);

  const updateConsents = useCallback((data: Partial<ConsentsData>) => {
    setState(prev => ({
      ...prev,
      consents: {
        ...prev.consents,
        ...data,
      },
    }));
  }, []);

  const updateConsent = useCallback((id: keyof ConsentsData, value: boolean) => {
    setState(prev => ({
      ...prev,
      consents: {
        ...prev.consents,
        [id]: value,
      },
    }));
  }, []);

  // ==================== NAVIGATION ====================

  const nextStep = useCallback(() => {
    setState(prev => {
      const newCompletedSteps = prev.completedSteps.includes(prev.currentStep)
        ? prev.completedSteps
        : [...prev.completedSteps, prev.currentStep];

      const newState = {
        ...prev,
        currentStep: prev.currentStep + 1,
        completedSteps: newCompletedSteps,
        isTransitioning: true,
      };

      // Save immediately on step navigation to preserve all changes including points
      setTimeout(() => {
        saveImmediately(newState);
      }, 50);

      return newState;
    });

    // Reset transition state
    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, [saveImmediately]);

  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
      isTransitioning: true,
    }));

    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
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

    setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);
  }, []);

  // ==================== VALIDATION ====================

  const setStepErrors = useCallback((errors: Record<string, string>) => {
    setState(prev => ({
      ...prev,
      stepValidationErrors: {
        ...prev.stepValidationErrors,
        [prev.currentStep]: errors,
      },
    }));
  }, []);

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

  const canProceed = useCallback(() => {
    const errors = state.stepValidationErrors[state.currentStep];
    return !errors || Object.keys(errors).length === 0;
  }, [state.stepValidationErrors, state.currentStep]);

  // ==================== GAMIFICATION ====================

  const awardPoints = useCallback((points: number, _reason?: string) => {
    // Play points sound
    if (soundContext?.playPoints) {
      soundContext.playPoints();
    }

    setState(prev => {
      const newPoints = prev.gamification.points + points;
      const newLevel = Math.floor(newPoints / 200) + 1; // Level up every 200 points
      const previousLevel = prev.gamification.level;
      const leveledUp = newLevel > previousLevel;

      // Play level up sound if leveled up
      if (leveledUp && soundContext?.playLevelUp) {
        setTimeout(() => {
          soundContext?.playLevelUp();
        }, 500); // Delay to let points sound finish
      }

      const newState = {
        ...prev,
        gamification: {
          ...prev.gamification,
          points: newPoints,
          level: newLevel,
        },
      };

      // Save immediately after awarding points to prevent loss on navigation
      // Use setTimeout to allow state to update first
      setTimeout(() => {
        saveImmediately(newState);
      }, 50);

      return newState;
    });
  }, [saveImmediately, soundContext]);

  const unlockAchievement = useCallback((achievementId: string, name: string, icon: string, points = 0) => {
    setState(prev => {
      // Check if already unlocked
      if (prev.gamification.achievements.some(a => a.id === achievementId)) {
        return prev;
      }

      const newState = {
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
        celebrationType: 'achievement' as CelebrationType,
      };

      // Save immediately to preserve achievement and points
      setTimeout(() => {
        saveImmediately(newState);
      }, 50);

      return newState;
    });

    // Hide celebration after delay
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        showCelebration: false,
        celebrationType: null,
      }));
    }, 3000);
  }, [saveImmediately]);

  // Add achievement with object-based API (for compatibility with screens)
  const addAchievement = useCallback((achievement: {
    id: string;
    name: string;
    description?: string;
    icon: string;
    points?: number;
    trigger?: string;
    earnedAt?: string;
  }) => {
    unlockAchievement(achievement.id, achievement.name, achievement.icon, achievement.points || 0);
  }, [unlockAchievement]);

  const triggerCelebration = useCallback((type: CelebrationType = 'confetti') => {
    setState(prev => ({
      ...prev,
      showCelebration: true,
      celebrationType: type,
    }));

    const duration = type === 'confetti-cannon' ? 5000 : 3000;
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        showCelebration: false,
        celebrationType: null,
      }));
    }, duration);
  }, []);

  // ==================== HELPERS ====================

  const getProgressPercentage = useCallback((totalSteps: number) => {
    if (!totalSteps) return 0;
    return Math.round((state.currentStep / totalSteps) * 100);
  }, [state.currentStep]);

  // Get progress as percentage (0-100) based on user type's total steps
  const getProgress = useCallback(() => {
    // Total profile steps for each user type (matching the UI "Step X of N")
    // Maid: "Step X of 10" (10 screens: personal → consents)
    // Sponsor: "Step X of 9" (UI shows 9, screens are 1-8)
    // Agency: "Step X of 9" (UI shows 9, screens are 1-8)
    const totalSteps = state.userType === 'maid' ? 10 :
                       state.userType === 'sponsor' ? 9 :
                       state.userType === 'agency' ? 9 : 10;
    // Return as percentage (0-100) for ProgressBar component
    const progressPercent = Math.min((state.currentStep / totalSteps) * 100, 100);
    return Math.round(progressPercent);
  }, [state.currentStep, state.userType]);

  // Upload file to Firebase Storage
  const uploadFileToStorage = useCallback(async (fileUri: string, folder: string): Promise<string | null> => {
    if (!fileUri || !user?.uid) return null;

    try {
      // Fetch the file as blob
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const fileName = `${Date.now()}_upload`;
      const storageRef = ref(storage, `${folder}/${user.uid}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      console.log(`[Onboarding] File uploaded to ${folder}:`, downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error(`[Onboarding] Error uploading file to ${folder}:`, error);
      return null;
    }
  }, [storage, user?.uid]);

  // Parse salary string to number
  const parseSalaryToNumber = useCallback((salaryString: string): number | null => {
    if (!salaryString) return null;
    const match = salaryString.toString().match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }, []);

  // Parse experience level to years
  const parseExperienceToYears = useCallback((experienceLevel: string): number => {
    if (!experienceLevel) return 0;
    const experienceMap: Record<string, number> = {
      'No Experience': 0,
      '1-2 years': 1,
      '3-5 years': 3,
      '6-10 years': 6,
      '10+ years': 10,
    };
    return experienceMap[experienceLevel] ?? 0;
  }, []);

  // Calculate profile completion percentage
  const calculateProfileCompletion = useCallback((formData: FormData): number => {
    const requiredFields = [
      'full_name',
      'dateOfBirth',
      'nationality',
      'country',
      'primaryProfession',
      'skills',
      'languages',
      'experience_level',
      'expected_salary',
      'about_me',
      'facePhoto',
    ];

    const completed = requiredFields.filter(field => {
      const value = formData[field as keyof FormData];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((completed.length / requiredFields.length) * 100);
  }, []);

  // ==================== COMPLETE ONBOARDING ====================

  const completeOnboarding = useCallback(async () => {
    console.log('[Onboarding] Starting completion...', {
      userType: state.userType,
      userId: user?.uid,
    });

    if (!user?.uid) {
      console.error('[Onboarding] Cannot complete: user.uid is undefined');
      showError('Session Error', 'Please try again. Your data is saved locally.');
      return;
    }

    try {
      if (state.userType === 'maid') {
        // ==================== MAID PROFILE ====================
        console.log('[Onboarding] Processing maid profile...');

        // Upload files
        let profilePhotoUrl = null;
        let videoUrl = null;

        if (state.formData.facePhoto) {
          profilePhotoUrl = await uploadFileToStorage(state.formData.facePhoto, 'profile-photos');
        }

        if (state.formData.videoCV) {
          videoUrl = await uploadFileToStorage(state.formData.videoCV, 'video-cvs');
        }

        // Prepare maid profile data
        const maidProfileData = {
          full_name: state.formData.full_name || '',
          phone: state.account.phone || '',
          country: state.formData.country || '',
          avatar_url: profilePhotoUrl,
          user_type: 'maid' as const,
          // Extended maid fields would go to maid_profiles table
        };

        if (updateProfile) {
          await updateProfile(maidProfileData);
          console.log('[Onboarding] Maid profile saved');
        }

      } else if (state.userType === 'sponsor') {
        // ==================== SPONSOR PROFILE ====================
        console.log('[Onboarding] Processing sponsor profile...');

        let sponsorPhotoUrl = null;
        if (state.formData.facePhoto) {
          sponsorPhotoUrl = await uploadFileToStorage(state.formData.facePhoto, 'profile-photos');
        }

        const sponsorProfileData = {
          full_name: state.formData.full_name,
          phone: state.account.phone,
          country: state.formData.country,
          avatar_url: sponsorPhotoUrl,
          user_type: 'sponsor' as const,
        };

        if (updateProfile) {
          await updateProfile(sponsorProfileData);
          console.log('[Onboarding] Sponsor profile saved');
        }

      } else if (state.userType === 'agency') {
        // ==================== AGENCY PROFILE ====================
        console.log('[Onboarding] Processing agency profile...');

        let agencyPhotoUrl = null;
        if (state.formData.facePhoto) {
          agencyPhotoUrl = await uploadFileToStorage(state.formData.facePhoto, 'profile-photos');
        }

        const agencyProfileData = {
          full_name: state.formData.authorizedPersonName || state.formData.full_name,
          phone: state.account.phone,
          country: state.formData.countriesOfOperation?.[0] || '',
          avatar_url: agencyPhotoUrl,
          user_type: 'agency' as const,
        };

        if (updateProfile) {
          await updateProfile(agencyProfileData);
          console.log('[Onboarding] Agency profile saved');
        }
      }

      // Update registration_complete flag
      if (updateRegistrationStatus) {
        await updateRegistrationStatus(true);
        console.log('[Onboarding] Registration status set to complete');
      }

      console.log('[Onboarding] Completed successfully!');
      showSuccess('Welcome aboard!', 'Your profile has been created successfully.');

      // Clear draft and celebrate
      await clearDraft();
      triggerCelebration('confetti-cannon');

      // Navigate to dashboard
      const dashboardPath = state.userType === 'maid'
        ? '/(tabs)/profile'
        : state.userType === 'sponsor'
        ? '/(tabs)/profile'
        : '/(tabs)/profile';

      setTimeout(() => {
        router.replace(dashboardPath as any);
      }, 3000);

    } catch (error) {
      console.error('[Onboarding] Error during completion:', error);
      showError('Failed to Save Profile', 'Please try again. Your data is saved locally.');
    }
  }, [
    state.formData,
    state.account,
    state.userType,
    user,
    clearDraft,
    triggerCelebration,
    updateProfile,
    updateRegistrationStatus,
    uploadFileToStorage,
    showSuccess,
    showError,
  ]);

  // ==================== CONTEXT VALUE ====================

  const value: OnboardingContextType = {
    ...state,
    state, // Provide state as a nested object for easier access
    isDraftLoaded,
    setUserType,
    updateFormData,
    updateAccount,
    updateAccountData: updateAccount, // Alias for compatibility
    updateConsents,
    updateConsent,
    nextStep,
    previousStep,
    goToStep,
    setStepErrors,
    clearStepErrors,
    awardPoints,
    unlockAchievement,
    addAchievement,
    triggerCelebration,
    completeOnboarding,
    clearDraft,
    resetOnboarding,
    hasDraft,
    getDraftInfo,
    loadDraftData,
    getProgress,
    getProgressPercentage,
    canProceed,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

// ==================== HOOK ====================

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export default OnboardingContext;
