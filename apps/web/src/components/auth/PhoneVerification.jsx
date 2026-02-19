import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { initRecaptchaVerifier, sendPhoneOTP, cleanupRecaptcha } from '@/lib/firebaseClient';
import {
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  RefreshCw,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

const PhoneVerification = ({
  phoneNumber,
  onVerificationComplete,
  onBack,
  isSubmitting = false,
}) => {
  const [verificationCode, setVerificationCode] = useState([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const inputRefs = useRef([]);

  // Auto-send verification code when component mounts
  useEffect(() => {
    sendVerificationCode();
    return () => cleanupRecaptcha();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && isCodeSent) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, isCodeSent]);

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('971')) return `+${cleaned}`;
    if (cleaned.startsWith('0')) return `+971${cleaned.substring(1)}`;
    if (cleaned.startsWith('+')) return phone;
    return `+971${cleaned}`;
  };

  const sendVerificationCode = async () => {
    setIsSendingCode(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Initialize reCAPTCHA verifier
      const recaptchaVerifier = initRecaptchaVerifier('phone-sign-in-button');

      // Send OTP via Firebase
      const result = await sendPhoneOTP(formattedPhone, recaptchaVerifier);
      setConfirmationResult(result);

      setIsCodeSent(true);
      setTimeLeft(60);
      setCanResend(false);

      toast({
        title: 'Verification Code Sent',
        description: `A 6-digit code has been sent to ${formattedPhone}`,
      });
    } catch (error) {
      console.error('Send verification error:', error);
      cleanupRecaptcha();

      let errorMessage = 'Could not send verification code. Please try again.';

      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number. Please check and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'Verification failed. Please refresh and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Failed to Send Code',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (
      newCode.every((digit) => digit !== '') &&
      newCode.join('').length === 6
    ) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits.length === 6) {
      const newCode = digits.split('');
      setVerificationCode(newCode);
      handleVerifyCode(digits);
    }
  };

  const handleVerifyCode = async (code) => {
    if (!confirmationResult) {
      toast({
        title: 'Error',
        description: 'Please request a new verification code.',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      await confirmationResult.confirm(code);
      const formattedPhone = formatPhoneNumber(phoneNumber);

      toast({
        title: 'Phone Verified',
        description: 'Your phone number has been successfully verified!',
      });

      onVerificationComplete(formattedPhone);
    } catch (error) {
      let errorMessage = 'Invalid verification code. Please try again.';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Incorrect code. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Code expired. Please request a new one.';
      }

      toast({
        title: 'Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setVerificationCode(['', '', '', '', '', '']);
    await sendVerificationCode();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4'>
      <div className='max-w-md w-full'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className='glass-effect border-white/20'>
            <CardHeader className='text-center'>
              <div className='flex items-center justify-center mb-4'>
                <div className='bg-gradient-to-br from-green-500 to-emerald-500 rounded-full p-3'>
                  <MessageSquare className='w-8 h-8 text-white' />
                </div>
              </div>
              <CardTitle className='text-2xl text-white'>
                Verify Your Phone
              </CardTitle>
              <CardDescription className='text-gray-200'>
                Enter the 6-digit code sent to
                <br />
                <span className='font-semibold text-white'>
                  {formatPhoneNumber(phoneNumber)}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-6'>
              {/* Verification Code Input */}
              <div className='flex justify-center space-x-2'>
                {verificationCode.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type='text'
                    inputMode='numeric'
                    pattern='[0-9]*'
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className='w-12 h-12 text-center text-xl font-bold bg-white/10 border-white/20 text-white focus:border-green-500 focus:ring-green-500'
                    disabled={isVerifying || isSubmitting}
                  />
                ))}
              </div>

              {/* Status Messages */}
              {isSendingCode && (
                <div className='flex items-center justify-center text-gray-300'>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Sending verification code...
                </div>
              )}

              {isVerifying && (
                <div className='flex items-center justify-center text-green-400'>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Verifying code...
                </div>
              )}

              {/* Timer and Resend */}
              {isCodeSent && !isVerifying && (
                <div className='text-center'>
                  {!canResend ? (
                    <div className='flex items-center justify-center text-gray-300'>
                      <Clock className='w-4 h-4 mr-2' />
                      Resend code in {formatTime(timeLeft)}
                    </div>
                  ) : (
                    <Button
                      variant='ghost'
                      onClick={handleResendCode}
                      disabled={isSendingCode}
                      className='text-yellow-400 hover:text-yellow-300 hover:bg-white/10'
                    >
                      <RefreshCw className='w-4 h-4 mr-2' />
                      Resend Code
                    </Button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className='flex space-x-3'>
                <Button
                  variant='secondary'
                  onClick={onBack}
                  disabled={isVerifying || isSubmitting || isSendingCode}
                  className='flex-1'
                >
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  Back
                </Button>

                <Button
                  onClick={() => handleVerifyCode(verificationCode.join(''))}
                  disabled={
                    verificationCode.some((digit) => !digit) ||
                    isVerifying ||
                    isSubmitting ||
                    isSendingCode
                  }
                  className='flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                >
                  {isVerifying ? (
                    <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  ) : (
                    <CheckCircle className='w-4 h-4 mr-2' />
                  )}
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </Button>
              </div>

              {/* reCAPTCHA container (invisible) */}
              <div id="phone-sign-in-button" />
              <div id="recaptcha-container-phone" />

              {/* Help Text */}
              <div className='text-center text-sm text-gray-400'>
                <p>Didn't receive the code?</p>
                <p>
                  Check your messages or try resending after the timer expires.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PhoneVerification;
