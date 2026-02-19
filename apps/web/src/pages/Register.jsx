import { usePageTitle } from '@/hooks/usePageTitle';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { countryService } from '@/services/countryService';
import CountrySelect from '@/components/ui/CountrySelect';
import { auth, setUserTypeClaim } from '@/lib/firebaseClient';
import { useFirebasePhoneAuth, PHONE_VERIFICATION_STATES } from '@/hooks/useFirebasePhoneAuth';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Building,
  Heart,
  Loader2,
  Shield,
  Check,
  ArrowLeft,
  UserPlus,
} from 'lucide-react';

// Country code to dial code mapping
const COUNTRY_DIAL_CODES = {
  'AE': '+971',
  'SA': '+966',
  'KW': '+965',
  'QA': '+974',
  'BH': '+973',
  'OM': '+968',
  'ET': '+251',
  'PH': '+63',
  'ID': '+62',
  'LK': '+94',
  'IN': '+91',
  'US': '+1',
  'GB': '+44',
};

const Register = () => {
  usePageTitle('None');
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get pre-selected userType from URL params (from onboarding flow)
  const preselectedUserType = searchParams.get('userType');
  const validUserTypes = ['maid', 'sponsor', 'agency'];
  const initialUserType = validUserTypes.includes(preselectedUserType) ? preselectedUserType : '';

  const [userType, setUserType] = useState(initialUserType);
  const userTypeRef = useRef(initialUserType); // Ref to track current userType for callbacks
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: '',
    userType: initialUserType,
  });

  // Firebase Phone Auth hook
  const {
    state: phoneAuthState,
    isSending: isSendingCode,
    isCodeSent,
    isVerifying: isVerifyingPhone,
    isVerified: phoneVerified,
    hasError: phoneAuthError,
    error: phoneAuthErrorMessage,
    sendVerificationCode: sendFirebaseOTP,
    verifyCode: verifyFirebaseOTP,
    resendCode: resendFirebaseOTP,
    reset: resetPhoneAuth,
    changePhoneNumber: changePhone,
  } = useFirebasePhoneAuth({
    buttonId: 'phone-verify-button',
    onVerificationComplete: async (verifiedPhone) => {
      // ============================================================
      // CRITICAL: Set userType in Firebase Custom Claims (PERSISTENT)
      // ============================================================
      // This is called IMMEDIATELY after phone verification succeeds.
      // The user is now authenticated via Firebase Auth.
      // We MUST set userType in Custom Claims NOW so it survives:
      // - Page refresh
      // - Browser close
      // - Logout/login
      // - Device changes
      // ============================================================
      // IMPORTANT: Use userTypeRef.current to get the LATEST value
      // The callback is created once when hook initializes, so using
      // the userType variable directly would capture a stale value
      const currentUserType = userTypeRef.current;
      console.log('🔐 [Register] onVerificationComplete - userTypeRef.current:', currentUserType);

      if (currentUserType) {
        try {
          console.log('🔐 [Register] Setting userType in Firebase Custom Claims:', currentUserType);
          await setUserTypeClaim(currentUserType);
          console.log('✅ [Register] userType successfully set in Custom Claims');
        } catch (claimError) {
          console.error('❌ [Register] Failed to set userType in claims:', claimError);
          // Don't block registration - claims can be synced later
          // But log this for debugging
        }
      } else {
        console.warn('⚠️ [Register] userType is empty in onVerificationComplete callback!');
      }

      toast({
        title: 'Phone Verified',
        description: 'Your phone number has been successfully verified!',
      });
    },
    onError: (error) => {
      console.error('Phone verification error:', error);
    },
  });

  // Map hook state to component state for compatibility
  const phoneVerificationStep = phoneVerified ? 'verified' : (isCodeSent ? 'verify' : 'input');

  // Keep userTypeRef in sync with userType state
  // This ensures the onVerificationComplete callback always has the latest value
  useEffect(() => {
    userTypeRef.current = userType;
    console.log('📝 [Register] userTypeRef updated to:', userType);
  }, [userType]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoadingCountries(true);
        const countriesData = await countryService.getActiveCountries();
        setCountries(countriesData);
      } catch (error) {
        console.error('Error fetching countries:', error);
        toast({
          title: 'Error Loading Countries',
          description: 'Could not load country list. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const userTypes = [
    {
      type: 'sponsor',
      title: 'Family/Sponsor',
      description: 'Looking to hire domestic workers',
      icon: '/images/Registration icon/sponsor-new.png',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      type: 'maid',
      title: 'Domestic Worker',
      description: 'Seeking employment opportunities',
      icon: '/images/Registration icon/maid-new.png',
      color: 'from-purple-500 to-pink-500',
    },
    {
      type: 'agency',
      title: 'Recruitment Agency',
      description: 'Connecting workers with families',
      icon: '/images/Registration icon/agency-new.png',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    userTypeRef.current = type; // Also update ref immediately for callbacks
    setFormData(prev => ({
      ...prev, // Keep existing data
      userType: type, // Only update userType
    }));
    console.log('📝 [Register] handleUserTypeSelect - set userType to:', type);
  };

  // Format phone number to E.164 format
  const formatPhoneToE164 = useCallback((phone, countryCode) => {
    if (!phone) return null;

    let cleaned = phone.trim();

    // If already in E.164 format, return as is
    if (cleaned.startsWith('+') && cleaned.length > 10) {
      return cleaned;
    }

    // Remove any non-digit characters except +
    cleaned = cleaned.replace(/[^\d+]/g, '');

    // If starts with +, validate it
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // Get dial code from country
    const dialCode = COUNTRY_DIAL_CODES[countryCode] || COUNTRY_DIAL_CODES['AE'];

    // Remove leading 0 if present (common in local formats)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    return `${dialCode}${cleaned}`;
  }, []);

  // Validate phone number format
  const isValidE164 = useCallback((phone) => {
    if (!phone) return false;
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }, []);

  // Mask phone number for display
  const maskPhoneNumber = useCallback((phone) => {
    if (!phone || phone.length < 8) return phone;
    const lastFour = phone.slice(-4);
    const countryCode = phone.slice(0, phone.length - 7);
    return `${countryCode}***${lastFour}`;
  }, []);

  const handleSendVerificationCode = async () => {
    if (!formData.phone) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter your phone number first.',
        variant: 'destructive',
      });
      return;
    }

    // Format phone number to E.164 format
    const countryCode = formData.country || 'AE';
    const formattedPhone = formatPhoneToE164(formData.phone, countryCode);

    if (!isValidE164(formattedPhone)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number (e.g., 501234567 for UAE)',
        variant: 'destructive',
      });
      return;
    }

    // NOTE: userType is now set via Firebase Custom Claims in onVerificationComplete callback
    // No longer using localStorage - claims persist server-side and survive page refresh

    // Update form data with formatted phone number (use functional update to avoid stale closure)
    setFormData(prev => ({ ...prev, phone: formattedPhone }));

    // Send OTP using Firebase Phone Auth
    const success = await sendFirebaseOTP(formattedPhone);

    if (success) {
      toast({
        title: 'Verification Code Sent',
        description: `Please check your phone at ${maskPhoneNumber(formattedPhone)} for the verification code.`,
      });
    } else if (phoneAuthErrorMessage) {
      toast({
        title: 'Failed to Send Code',
        description: phoneAuthErrorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    // Verify OTP using Firebase Phone Auth
    const success = await verifyFirebaseOTP(verificationCode);

    if (!success && phoneAuthErrorMessage) {
      toast({
        title: 'Verification Failed',
        description: phoneAuthErrorMessage,
        variant: 'destructive',
      });
    }
    // Success toast is handled by the hook's onVerificationComplete callback
  };

  const handleResendCode = async () => {
    // Clear the input field
    setVerificationCode('');

    // Resend OTP using Firebase Phone Auth
    const success = await resendFirebaseOTP();

    if (success) {
      toast({
        title: 'Code Resent',
        description: `A new verification code has been sent to ${maskPhoneNumber(formData.phone)}`,
      });
    } else if (phoneAuthErrorMessage) {
      toast({
        title: 'Failed to Resend Code',
        description: phoneAuthErrorMessage,
        variant: 'destructive',
      });
    }
  };

  // Handle going back from verification step
  const handleBackFromVerification = () => {
    resetPhoneAuth();
    setVerificationCode('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!userType) {
      toast({
        title: 'User Type Required',
        description: 'Please select your user type to continue.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    // Enhanced password validation - minimum 8 characters
    if (formData.password.length < 8) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    // Check for password complexity (at least one uppercase, one lowercase, one number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast({
        title: 'Weak Password',
        description: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (!phoneVerified) {
      toast({
        title: 'Phone Verification Required',
        description:
          'Please verify your phone number before creating your account.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Register user with verified phone
      // IMPORTANT: Ensure userType is ALWAYS set in registration data
      // Use userType state as fallback in case formData.userType is stale
      const registrationData = {
        ...formData,
        userType: formData.userType || userType, // Fallback to state if formData is stale
        phoneVerified: true,
      };

      console.log('📝 [Register] Registration data userType:', registrationData.userType);

      const result = await register(registrationData);

      // Check if email verification is required
      if (result && result.needsVerification) {
        toast({
          title: 'Email Verification Required',
          description: 'Please check your email to verify your account.',
        });
        navigate('/verify-email');
        return;
      }

      toast({
        title: 'Registration Successful',
        description: 'Welcome! Your account has been created successfully.',
      });
      // AuthContext's useEffect and ProtectedRouteInner will handle navigation
    } catch (error) {
      console.error('Registration error:', error);

      // Provide contextual error recovery guidance
      let errorTitle = 'We couldn\'t create your account';
      let errorDescription = error.message || 'Please try again.';
      let action = null;

      if (error.message.includes('email') && error.message.includes('already')) {
        errorTitle = 'Email already registered';
        errorDescription = 'This email is already associated with an account. Try signing in instead.';
        action = {
          altText: 'Sign in instead',
          action: () => navigate('/login')
        };
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorTitle = 'Check your internet connection';
        errorDescription = 'Unable to connect to the server. Please check your network connection and try again.';
      } else if (error.message.includes('password')) {
        errorTitle = 'Password issue';
        errorDescription = 'Please check that your password meets our requirements and try again.';
      } else if (error.message.includes('phone')) {
        errorTitle = 'Phone number issue';
        errorDescription = 'There\'s an issue with your phone number. Please verify and try again.';
      } else if (error.message.includes('validation')) {
        errorTitle = 'Please complete all fields';
        errorDescription = 'Please check that all required fields are filled correctly.';
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
        action
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4'>
      <div className='max-w-md w-full'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className='text-center mb-8'
        >
          {/* Ethiopian Maids Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='flex justify-center mb-6'
          >
            <img
              src='/images/logo/ethiopian-maids-logo.png'
              alt='Ethiopian Maids'
              className='h-20 w-auto drop-shadow-2xl'
            />
          </motion.div>

          <h1 className='text-4xl font-bold text-white mb-4'>
            Welcome to{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400'>
              Ethiopian Maids
            </span>
          </h1>
          <p className='text-xl text-gray-200'>
            Create your account to get started
          </p>
        </motion.div>

        {!userType ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className='glass-effect border-white/20'>
              <CardHeader className='text-center'>
                <CardTitle className='text-2xl text-white'>
                  Choose Your Account Type
                </CardTitle>
                <CardDescription className='text-gray-200'>
                  Select the option that best describes you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-3'>
                  {userTypes.map((type, index) => {
                    return (
                      <motion.div
                        key={type.type}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        onClick={() => handleUserTypeSelect(type.type)}
                        className='cursor-pointer group'
                      >
                        <Card className='h-full card-hover border-white/20 bg-white/5 group-hover:bg-white/10 transition-all duration-300'>
                          <CardContent className='p-4 flex items-center'>
                            <div
                              className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0"
                            >
                              <img
                                src={type.icon}
                                alt={`${type.title} icon`}
                                className='w-full h-full object-cover'
                              />
                            </div>
                            <div className='ml-4 text-left'>
                              <h3 className='text-lg font-bold text-white mb-1'>
                                {type.title}
                              </h3>
                              <p className='text-gray-300 text-sm'>
                                {type.description}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className='glass-effect border-white/20'>
              <CardHeader className='text-center'>
                <CardTitle className='text-2xl text-white'>
                  Create Your{' '}
                  {userTypes.find((t) => t.type === userType)?.title} Account
                </CardTitle>
                <CardDescription className='text-gray-200'>
                  Fill in your details to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div className='relative'>
                    <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                    <Input
                      type='text'
                      name='name'
                      placeholder='Full Name'
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className='pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300'
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                    <Input
                      type='email'
                      name='email'
                      placeholder='Email Address'
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className='pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300'
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <PasswordInput
                      name='password'
                      placeholder='Password (min. 8 characters)'
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      showValidation={true}
                      className='bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-white/40'
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <PasswordInput
                      name='confirmPassword'
                      placeholder='Confirm Password'
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      showValidation={false}
                      className='bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-white/40'
                      disabled={isSubmitting}
                    />
                    {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className='mt-1 text-xs text-red-300'>
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <div className='relative'>
                      <Phone className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                      <Input
                        type='tel'
                        name='phone'
                        placeholder='Phone Number (e.g., 501234567)'
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className='pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300'
                        disabled={
                          isSubmitting || phoneVerified || isCodeSent
                        }
                      />
                      {phoneVerified && (
                        <Check className='absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5' />
                      )}
                    </div>

                    {phoneVerificationStep === 'input' && (
                      <Button
                        id='phone-verify-button'
                        type='button'
                        variant='secondary'
                        size='sm'
                        onClick={handleSendVerificationCode}
                        disabled={isSendingCode || !formData.phone}
                        className='w-full bg-[#596acd] text-white hover:bg-[#596acd]/90'
                      >
                        {isSendingCode ? (
                          <>
                            <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Shield className='mr-2 h-3 w-3' />
                            Verify Phone
                          </>
                        )}
                      </Button>
                    )}

                    {phoneVerificationStep === 'verify' && (
                      <div className='space-y-1.5'>
                        <Input
                          type='text'
                          placeholder='6-digit code'
                          value={verificationCode}
                          onChange={(e) =>
                            setVerificationCode(
                              e.target.value.replace(/\D/g, '').slice(0, 6)
                            )
                          }
                          maxLength={6}
                          className='bg-white/10 border-white/20 text-white placeholder:text-gray-300 text-center tracking-widest'
                          disabled={isVerifyingPhone}
                        />
                        <div className='flex gap-1.5'>
                          <Button
                            type='button'
                            variant='secondary'
                            size='sm'
                            onClick={handleBackFromVerification}
                            disabled={isVerifyingPhone}
                            className='flex-1 bg-[#596acd] text-white hover:bg-[#596acd]/90'
                          >
                            <ArrowLeft className='mr-1 w-3 h-3' />
                            Change
                          </Button>
                          <Button
                            type='button'
                            size='sm'
                            onClick={handleVerifyCode}
                            disabled={
                              isVerifyingPhone ||
                              verificationCode.length !== 6
                            }
                            className='flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                          >
                            {isVerifyingPhone ? (
                              <>
                                <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Check className='mr-1 w-3 h-3' />
                                Verify
                              </>
                            )}
                          </Button>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={handleResendCode}
                          disabled={isSendingCode || isVerifyingPhone}
                          className='w-full text-gray-300 hover:text-white hover:bg-white/10'
                        >
                          {isSendingCode ? (
                            <>
                              <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                              Resending...
                            </>
                          ) : (
                            'Resend Code'
                          )}
                        </Button>
                      </div>
                    )}

                    {phoneVerified && (
                      <div className='flex items-center gap-1.5 text-green-400 text-xs'>
                        <Check className='w-3 h-3' />
                        Verified
                      </div>
                    )}
                  </div>

                  <CountrySelect
                    countries={countries}
                    value={formData.country}
                    onChange={(countryName) =>
                      setFormData(prev => ({ ...prev, country: countryName }))
                    }
                    placeholder={
                      isLoadingCountries
                        ? 'Loading countries...'
                        : 'Select your country'
                    }
                    disabled={isSubmitting || isLoadingCountries}
                    isLoading={isLoadingCountries}
                    showFlags={true}
                    highlightGCC={true}
                    searchable={true}
                    className="w-full"
                  />

                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      variant='secondary'
                      size='default'
                      onClick={() => setUserType('')}
                      className='flex-1 bg-[#596acd] text-white hover:bg-[#596acd]/90'
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className='mr-2 w-4 h-4' />
                      Back
                    </Button>
                    <Button
                      type='submit'
                      size='default'
                      className='flex-1 shadow-lg hover:shadow-xl'
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className='mr-2 w-4 h-4' />
                          Create Account
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <div className='mt-4 text-center'>
                  <p className='text-gray-300'>
                    Already have an account?{' '}
                    <Link
                      to='/login'
                      className={`text-purple-300 hover:text-white font-semibold transition-colors duration-200 hover:underline ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Register;
