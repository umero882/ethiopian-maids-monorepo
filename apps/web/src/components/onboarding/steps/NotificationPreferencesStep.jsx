import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Switch } from '@/components/ui/switch';
import {
  Bell,
  Mail,
  MessageSquare,
  Briefcase,
  DollarSign,
  Shield,
  Megaphone,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NotificationPreferencesStep = () => {
  const { userType, previousStep, awardPoints, updateFormData, formData, completeOnboarding } = useOnboarding();

  // Get user-type-specific notification options
  const getNotificationOptions = () => {
    const common = [
      {
        id: 'messages',
        icon: MessageSquare,
        title: 'Messages',
        description: 'When someone sends you a message',
        defaultEnabled: true,
        required: false,
      },
      {
        id: 'security',
        icon: Shield,
        title: 'Security Alerts',
        description: 'Important account security updates',
        defaultEnabled: true,
        required: true,
      },
      {
        id: 'marketing',
        icon: Megaphone,
        title: 'Tips & Updates',
        description: 'Platform tips and new features',
        defaultEnabled: false,
        required: false,
      },
    ];

    switch (userType) {
      case 'maid':
        return [
          {
            id: 'job_matches',
            icon: Briefcase,
            title: 'Job Matches',
            description: 'When a family shows interest in you',
            defaultEnabled: true,
            required: false,
          },
          {
            id: 'profile_views',
            icon: Bell,
            title: 'Profile Views',
            description: 'When employers view your profile',
            defaultEnabled: true,
            required: false,
          },
          ...common,
        ];

      case 'sponsor':
        return [
          {
            id: 'new_maids',
            icon: Bell,
            title: 'New Maids',
            description: 'When new workers match your criteria',
            defaultEnabled: true,
            required: false,
          },
          {
            id: 'applications',
            icon: Briefcase,
            title: 'Applications',
            description: 'When workers apply to your listing',
            defaultEnabled: true,
            required: false,
          },
          {
            id: 'payments',
            icon: DollarSign,
            title: 'Payment Updates',
            description: 'Transaction confirmations and receipts',
            defaultEnabled: true,
            required: false,
          },
          ...common,
        ];

      case 'agency':
        return [
          {
            id: 'leads',
            icon: Bell,
            title: 'New Leads',
            description: 'When families inquire about your maids',
            defaultEnabled: true,
            required: false,
          },
          {
            id: 'placements',
            icon: Briefcase,
            title: 'Placement Updates',
            description: 'Status changes for your placements',
            defaultEnabled: true,
            required: false,
          },
          {
            id: 'payments',
            icon: DollarSign,
            title: 'Payment Updates',
            description: 'Transaction confirmations and reports',
            defaultEnabled: true,
            required: false,
          },
          {
            id: 'reminders',
            icon: Clock,
            title: 'Reminders',
            description: 'Contract renewals and deadlines',
            defaultEnabled: true,
            required: false,
          },
          ...common,
        ];

      default:
        return common;
    }
  };

  const notificationOptions = getNotificationOptions();

  // Initialize preferences state
  const [preferences, setPreferences] = useState(() => {
    const initial = {};
    notificationOptions.forEach((option) => {
      initial[option.id] = formData.notificationPreferences?.[option.id] ?? option.defaultEnabled;
    });
    return initial;
  });

  // Handle toggle
  const handleToggle = (id, required) => {
    if (required) return; // Don't allow toggling required options

    setPreferences((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handle enable all
  const handleEnableAll = () => {
    const allEnabled = {};
    notificationOptions.forEach((option) => {
      allEnabled[option.id] = true;
    });
    setPreferences(allEnabled);
  };

  // Handle continue - this is the final step, complete onboarding
  const handleContinue = async () => {
    updateFormData({ notificationPreferences: preferences });
    awardPoints(15, 'Set notification preferences');
    // This is the last step - complete onboarding and redirect to dashboard
    await completeOnboarding();
  };

  // Count enabled notifications
  const enabledCount = Object.values(preferences).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <StepCard
        title="Stay Updated"
        description="Choose what notifications you'd like to receive"
        icon={Bell}
        showHeader={true}
      >
        <div className="mt-4 space-y-4">
          {/* Quick actions */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              {enabledCount} of {notificationOptions.length} enabled
            </span>
            <button
              onClick={handleEnableAll}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Enable all
            </button>
          </div>

          {/* Notification options */}
          <div className="space-y-3">
            {notificationOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-colors',
                  preferences[option.id]
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/5 border-white/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      preferences[option.id]
                        ? 'bg-purple-500/30 text-purple-400'
                        : 'bg-gray-500/30 text-gray-400'
                    )}
                  >
                    <option.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          preferences[option.id] ? 'text-white' : 'text-gray-400'
                        )}
                      >
                        {option.title}
                      </span>
                      {option.required && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-600 rounded text-gray-300">
                          Required
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{option.description}</span>
                  </div>
                </div>

                <Switch
                  checked={preferences[option.id]}
                  onCheckedChange={() => handleToggle(option.id, option.required)}
                  disabled={option.required}
                  className="data-[state=checked]:bg-purple-600"
                />
              </motion.div>
            ))}
          </div>

          {/* Email preference */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 rounded-lg p-3 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-300">
                  We'll also send important updates to your email
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <StepTip>
          You can change these preferences anytime from your account settings.
        </StepTip>
      </StepCard>

      <StepNavigation
        onNext={handleContinue}
        onPrevious={previousStep}
        nextLabel="Complete Registration"
      />
    </div>
  );
};

export default NotificationPreferencesStep;
