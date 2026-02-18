import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingProvider, useOnboarding } from '@/context/OnboardingContext';
import OnboardingLayout from '@/components/onboarding/shared/OnboardingLayout';
import DraftRecoveryModal from '@/components/onboarding/shared/DraftRecoveryModal';
import ConfettiCelebration from '@/components/onboarding/shared/ConfettiCelebration';

// Shared Steps
import WelcomeStep from '@/components/onboarding/steps/WelcomeStep';
import UserTypeStep from '@/components/onboarding/steps/UserTypeStep';
import UserIntroStep from '@/components/onboarding/steps/UserIntroStep';
import AccountStep from '@/components/onboarding/steps/AccountStep';
import PhoneVerifyStep from '@/components/onboarding/steps/PhoneVerifyStep';
import CongratulationsStep from '@/components/onboarding/steps/CongratulationsStep';
import ServiceOverviewStep from '@/components/onboarding/steps/ServiceOverviewStep';
import SocialProofStep from '@/components/onboarding/steps/SocialProofStep';
import ReviewsStep from '@/components/onboarding/steps/ReviewsStep';
import NotificationPreferencesStep from '@/components/onboarding/steps/NotificationPreferencesStep';

// Maid Steps
import MaidPersonalStep from '@/components/onboarding/maid/MaidPersonalStep';
import MaidBiometricDocStep from '@/components/onboarding/maid/MaidBiometricDocStep';
import MaidAddressStep from '@/components/onboarding/maid/MaidAddressStep';
import MaidProfessionStep from '@/components/onboarding/maid/MaidProfessionStep';
import MaidSkillsStep from '@/components/onboarding/maid/MaidSkillsStep';
import MaidExperienceStep from '@/components/onboarding/maid/MaidExperienceStep';
import MaidPreferencesStep from '@/components/onboarding/maid/MaidPreferencesStep';
import MaidAboutStep from '@/components/onboarding/maid/MaidAboutStep';
import MaidVideoCVStep from '@/components/onboarding/maid/MaidVideoCVStep';
import MaidConsentsStep from '@/components/onboarding/maid/MaidConsentsStep';

// Sponsor Steps
import SponsorPersonalStep from '@/components/onboarding/sponsor/SponsorPersonalStep';
import SponsorBiometricDocStep from '@/components/onboarding/sponsor/SponsorBiometricDocStep';
import SponsorLocationStep from '@/components/onboarding/sponsor/SponsorLocationStep';
import SponsorFamilyStep from '@/components/onboarding/sponsor/SponsorFamilyStep';
import SponsorPreferencesStep from '@/components/onboarding/sponsor/SponsorPreferencesStep';
import SponsorBudgetStep from '@/components/onboarding/sponsor/SponsorBudgetStep';
import SponsorAccommodationStep from '@/components/onboarding/sponsor/SponsorAccommodationStep';
import SponsorConsentsStep from '@/components/onboarding/sponsor/SponsorConsentsStep';
import SponsorPremiumUpsellStep from '@/components/onboarding/sponsor/SponsorPremiumUpsellStep';

// Agency Steps
import AgencyBasicStep from '@/components/onboarding/agency/AgencyBasicStep';
import AgencyBiometricDocStep from '@/components/onboarding/agency/AgencyBiometricDocStep';
import AgencyLocationStep from '@/components/onboarding/agency/AgencyLocationStep';
import AgencyContactStep from '@/components/onboarding/agency/AgencyContactStep';
import AgencyRepresentativeStep from '@/components/onboarding/agency/AgencyRepresentativeStep';
import AgencyServicesStep from '@/components/onboarding/agency/AgencyServicesStep';
import AgencyAboutStep from '@/components/onboarding/agency/AgencyAboutStep';
import AgencyConsentsStep from '@/components/onboarding/agency/AgencyConsentsStep';
import AgencyPremiumUpsellStep from '@/components/onboarding/agency/AgencyPremiumUpsellStep';

/**
 * Step configurations by user type
 */
const STEP_CONFIGS = {
  // Common steps for all user types (before profile steps)
  common_start: [
    { id: 'welcome', component: WelcomeStep, title: 'Welcome' },
    { id: 'user_type', component: UserTypeStep, title: 'Account Type' },
    { id: 'user_intro', component: UserIntroStep, title: 'Getting Started' },
    { id: 'account', component: AccountStep, title: 'Create Account' },
    { id: 'phone_verify', component: PhoneVerifyStep, title: 'Verify Phone' },
    { id: 'congratulations', component: CongratulationsStep, title: 'Congratulations' },
    { id: 'service_overview', component: ServiceOverviewStep, title: 'Services' },
    { id: 'social_proof', component: SocialProofStep, title: 'Success Stories' },
  ],

  // Maid-specific profile steps
  maid: [
    { id: 'maid_personal', component: MaidPersonalStep, title: 'Personal Info' },
    { id: 'maid_biometric', component: MaidBiometricDocStep, title: 'Identity' },
    { id: 'maid_address', component: MaidAddressStep, title: 'Address' },
    { id: 'maid_profession', component: MaidProfessionStep, title: 'Profession' },
    { id: 'maid_skills', component: MaidSkillsStep, title: 'Skills' },
    { id: 'maid_experience', component: MaidExperienceStep, title: 'Experience' },
    { id: 'maid_preferences', component: MaidPreferencesStep, title: 'Preferences' },
    { id: 'maid_about', component: MaidAboutStep, title: 'About Me' },
    { id: 'maid_video', component: MaidVideoCVStep, title: 'Video CV' },
    { id: 'maid_consents', component: MaidConsentsStep, title: 'Terms' },
  ],

  // Sponsor-specific profile steps
  sponsor: [
    { id: 'sponsor_personal', component: SponsorPersonalStep, title: 'Personal Info' },
    { id: 'sponsor_biometric', component: SponsorBiometricDocStep, title: 'Identity' },
    { id: 'sponsor_location', component: SponsorLocationStep, title: 'Location' },
    { id: 'sponsor_family', component: SponsorFamilyStep, title: 'Family' },
    { id: 'sponsor_preferences', component: SponsorPreferencesStep, title: 'Preferences' },
    { id: 'sponsor_budget', component: SponsorBudgetStep, title: 'Budget' },
    { id: 'sponsor_accommodation', component: SponsorAccommodationStep, title: 'Accommodation' },
    { id: 'sponsor_consents', component: SponsorConsentsStep, title: 'Terms' },
    { id: 'sponsor_premium', component: SponsorPremiumUpsellStep, title: 'Premium' },
  ],

  // Agency-specific profile steps
  agency: [
    { id: 'agency_basic', component: AgencyBasicStep, title: 'Agency Info' },
    { id: 'agency_biometric', component: AgencyBiometricDocStep, title: 'Documents' },
    { id: 'agency_location', component: AgencyLocationStep, title: 'Location' },
    { id: 'agency_contact', component: AgencyContactStep, title: 'Contact' },
    { id: 'agency_representative', component: AgencyRepresentativeStep, title: 'Representative' },
    { id: 'agency_services', component: AgencyServicesStep, title: 'Services' },
    { id: 'agency_about', component: AgencyAboutStep, title: 'About' },
    { id: 'agency_consents', component: AgencyConsentsStep, title: 'Terms' },
    { id: 'agency_premium', component: AgencyPremiumUpsellStep, title: 'Premium' },
  ],

  // Common ending steps (after profile steps)
  common_end: [
    { id: 'reviews', component: ReviewsStep, title: 'Reviews' },
    { id: 'notifications', component: NotificationPreferencesStep, title: 'Notifications' },
  ],
};

/**
 * OnboardingFlow - Inner component that uses the context
 */
const OnboardingFlow = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    userType,
    isComplete,
    celebrationType,
    showDraftRecovery,
    setShowDraftRecovery,
    recoverDraft,
    startFresh,
    formData,
  } = useOnboarding();

  // Build the complete step list based on user type
  const steps = useMemo(() => {
    const commonStart = STEP_CONFIGS.common_start;
    const commonEnd = STEP_CONFIGS.common_end;

    // If no user type selected yet, only show initial steps
    if (!userType) {
      return commonStart.slice(0, 2); // Welcome + UserType only
    }

    // Get user-type-specific steps
    const profileSteps = STEP_CONFIGS[userType] || [];

    return [...commonStart, ...profileSteps, ...commonEnd];
  }, [userType]);

  // Get current step config
  const currentStepConfig = steps[currentStep];

  // Redirect to dashboard on completion
  useEffect(() => {
    if (isComplete) {
      const dashboardPath = userType === 'maid'
        ? '/maid/dashboard'
        : userType === 'sponsor'
        ? '/sponsor/dashboard'
        : userType === 'agency'
        ? '/agency/dashboard'
        : '/dashboard';

      // Small delay to allow final celebration to play
      const timer = setTimeout(() => {
        navigate(dashboardPath);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isComplete, userType, navigate]);

  // Handle draft recovery
  const handleRecoverDraft = () => {
    recoverDraft();
    setShowDraftRecovery(false);
  };

  const handleStartFresh = () => {
    startFresh();
    setShowDraftRecovery(false);
  };

  // Calculate progress
  const progress = useMemo(() => {
    if (steps.length === 0) return 0;
    return Math.round((currentStep / (steps.length - 1)) * 100);
  }, [currentStep, steps.length]);

  // Get step titles for progress indicator
  const stepTitles = useMemo(() => {
    return steps.map((step) => step.title);
  }, [steps]);

  // Render current step component
  const CurrentStepComponent = currentStepConfig?.component;

  if (!CurrentStepComponent) {
    return (
      <OnboardingLayout
        currentStep={0}
        totalSteps={1}
        progress={0}
        stepTitles={['Loading']}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading...</div>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <>
      {/* Draft Recovery Modal */}
      <DraftRecoveryModal
        isOpen={showDraftRecovery}
        onRecover={handleRecoverDraft}
        onStartFresh={handleStartFresh}
        draftData={{
          userType: formData.userType,
          currentStep,
          lastUpdated: formData.lastUpdated,
        }}
      />

      {/* Confetti Celebration */}
      <ConfettiCelebration type={celebrationType} />

      {/* Main Layout with Current Step */}
      <OnboardingLayout
        currentStep={currentStep}
        totalSteps={steps.length}
        progress={progress}
        stepTitles={stepTitles}
        userType={userType}
      >
        <CurrentStepComponent />
      </OnboardingLayout>
    </>
  );
};

/**
 * UnifiedOnboarding - Main page component with provider
 */
const UnifiedOnboarding = () => {
  return (
    <OnboardingProvider>
      <OnboardingFlow />
    </OnboardingProvider>
  );
};

export default UnifiedOnboarding;
