import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard, { StepError, StepTip } from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFirebasePhoneAuth, PHONE_VERIFICATION_STATES } from '@/hooks/useFirebasePhoneAuth';
import { Phone, Shield, CheckCircle, RefreshCw, Edit2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Country codes for GCC and East Africa
const COUNTRY_CODES = [
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
];

const PhoneVerifyStep = () => {
  const { account, updateAccount, nextStep, previousStep, awardPoints, unlockAchievement, triggerCelebration } = useOnboarding();

  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [localPhone, setLocalPhone] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const {
    state,
    isSending,
    isCodeSent,
    isVerifying,
    isVerified,
    hasError,
    error,
    phoneNumber,
    sendVerificationCode,
    verifyCode,
    resendCode,
    changePhoneNumber,
  } = useFirebasePhoneAuth({
    buttonId: 'phone-verify-button',
    onVerificationComplete: (phone) => {
      updateAccount({ phone, phoneVerified: true });
      awardPoints(50, 'Phone verified');
      unlockAchievement('verified');
      triggerCelebration('confetti-sides');
    },
    onError: (err) => {
      console.error('Phone verification error:', err);
    },
  });

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Format phone number for display
  const fullPhoneNumber = `${selectedCountry.code}${localPhone}`;

  // Handle send code
  const handleSendCode = async () => {
    if (!localPhone || localPhone.length < 6) {
      return;
    }

    const success = await sendVerificationCode(fullPhoneNumber);
    if (success) {
      setResendTimer(60);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when complete
    if (index === 5 && value) {
      const fullCode = [...newOtp.slice(0, 5), value.slice(-1)].join('');
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtpCode(newOtp);
      verifyCode(pastedData);
    }
  };

  // Handle backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Handle resend
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtpCode(['', '', '', '', '', '']);
    const success = await resendCode();
    if (success) {
      setResendTimer(60);
    }
  };

  // Handle change number
  const handleChangeNumber = () => {
    changePhoneNumber('');
    setOtpCode(['', '', '', '', '', '']);
    setResendTimer(0);
  };

  // Handle continue
  const handleContinue = () => {
    if (isVerified) {
      nextStep();
    }
  };

  // Render phone input
  const renderPhoneInput = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <button
          type="button"
          onClick={() => setShowCountryPicker(!showCountryPicker)}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors min-w-[100px]"
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-sm">{selectedCountry.code}</span>
        </button>

        {/* Phone Number Input */}
        <div className="flex-1 relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="tel"
            placeholder="Phone Number"
            value={localPhone}
            onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ''))}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
            disabled={isCodeSent || isVerified}
          />
        </div>
      </div>

      {/* Country Picker Dropdown */}
      <AnimatePresence>
        {showCountryPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-800 border border-white/20 rounded-lg max-h-48 overflow-y-auto"
          >
            {COUNTRY_CODES.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  setSelectedCountry(country);
                  setShowCountryPicker(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-white/10 transition-colors',
                  selectedCountry.code === country.code && 'bg-white/20'
                )}
              >
                <span className="text-lg">{country.flag}</span>
                <span className="text-white text-sm">{country.country}</span>
                <span className="text-gray-400 text-sm ml-auto">{country.code}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Code Button */}
      <Button
        id="phone-verify-button"
        onClick={handleSendCode}
        disabled={!localPhone || localPhone.length < 6 || isSending}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isSending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending Code...
          </>
        ) : (
          <>
            <Shield className="w-4 h-4 mr-2" />
            Send Verification Code
          </>
        )}
      </Button>
    </div>
  );

  // Render OTP input
  const renderOtpInput = () => (
    <div className="space-y-4">
      {/* Phone number display */}
      <div className="flex items-center justify-center gap-2 text-gray-300">
        <span>Code sent to {phoneNumber}</span>
        <button
          type="button"
          onClick={handleChangeNumber}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center gap-2">
        {otpCode.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            onPaste={index === 0 ? handleOtpPaste : undefined}
            disabled={isVerifying || isVerified}
            className={cn(
              'w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all',
              'bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500',
              digit ? 'border-purple-500' : 'border-white/20',
              isVerified && 'border-green-500 bg-green-500/20'
            )}
          />
        ))}
      </div>

      {/* Verifying indicator */}
      {isVerifying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 text-purple-400"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Verifying...</span>
        </motion.div>
      )}

      {/* Resend button */}
      {!isVerified && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0 || isVerifying}
            className={cn(
              'flex items-center gap-2 text-sm transition-colors',
              resendTimer > 0 || isVerifying
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-purple-400 hover:text-purple-300'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
          </button>
        </div>
      )}
    </div>
  );

  // Render success state
  const renderSuccess = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4"
      >
        <CheckCircle className="w-10 h-10 text-green-400" />
      </motion.div>
      <h3 className="text-xl font-bold text-white mb-2">Phone Verified!</h3>
      <p className="text-gray-300">{phoneNumber}</p>
      <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full text-green-400 text-sm">
        <Shield className="w-4 h-4" />
        Your account is now more secure
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      <StepCard
        title="Verify Your Phone"
        description="We'll send you a verification code"
        icon={Phone}
        showHeader={true}
      >
        <div className="mt-4">
          {isVerified ? (
            renderSuccess()
          ) : isCodeSent ? (
            renderOtpInput()
          ) : (
            renderPhoneInput()
          )}

          {/* Error display */}
          {hasError && error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <StepError message={error} />
            </motion.div>
          )}
        </div>

        <StepTip>
          We'll use this number to keep your account secure and for important notifications.
        </StepTip>
      </StepCard>

      <StepNavigation
        onNext={handleContinue}
        onPrevious={previousStep}
        isDisabled={!isVerified}
        nextLabel={isVerified ? 'Continue' : 'Verify to Continue'}
      />
    </div>
  );
};

export default PhoneVerifyStep;
