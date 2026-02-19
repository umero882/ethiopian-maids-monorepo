import React, { useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Mail, Lock, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import NetworkStatusChecker from '@/components/NetworkStatusChecker';
import { getUserFriendlyError, isNetworkError } from '@/lib/errorMessages';
import { usePageTitle } from '@/hooks/usePageTitle';

const Login = () => {
  usePageTitle('Login');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  React.useEffect(() => {
    /* console.log(
      '🔍 Login useEffect - user state changed:',
      user
        ? {
            id: user.id,
            email: user.email,
            userType: user.userType,
          }
        : null
    ); */

    if (user) {
      /* console.log(
        '✅ User detected in Login component, navigating to dashboard'
      ); */
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginFailed(false); // Reset login failed state

    if (!formData.email || !formData.password) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields.',
        variant: 'warning',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const loginResult = await login({
        email: formData.email,
        password: formData.password,
      });


      toast({
        title: 'Login Successful',
        description: 'Welcome back! Redirecting to your dashboard...',
        variant: 'success',
      });

      // Navigate immediately - the useEffect will handle the redirect when user state updates
      navigate('/dashboard');

      // Also set a fallback timeout in case the useEffect doesn't trigger
      setTimeout(() => {
        if (window.location.pathname === '/login') {
          navigate('/dashboard', { replace: true });
        }
      }, 1000);
    } catch (error) {
      // Log technical error for debugging (never exposed to users)
      console.error('[Login] Authentication failed:', error.message);

      // Get user-friendly error message
      const friendlyError = getUserFriendlyError(error);

      // For network errors: show inline NetworkStatusChecker (no toast to avoid duplication)
      // For auth errors: show toast only
      if (isNetworkError(error)) {
        setLoginFailed(true);
        // Don't show toast for network errors - NetworkStatusChecker handles it
      } else {
        // Build toast action if the error has a suggested action
        let toastAction = null;
        if (friendlyError.action?.path) {
          toastAction = {
            altText: friendlyError.action.label,
            action: () => navigate(friendlyError.action.path)
          };
        }

        toast({
          title: friendlyError.title,
          description: friendlyError.message,
          variant: 'destructive',
          action: toastAction
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryConnection = () => {
    setLoginFailed(false);
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
            Welcome Back to{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400'>
              Ethiopian Maids
            </span>
          </h1>
          <p className='text-xl text-gray-200'>Sign in to your account</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className='glass-effect border-white/20'>
            <CardHeader className='text-center'>
              <CardTitle className='text-2xl text-white'>Sign In</CardTitle>
              <CardDescription className='text-gray-200'>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Show network status checker if login failed */}
              {loginFailed && (
                <NetworkStatusChecker onRetry={handleRetryConnection} />
              )}

              <form onSubmit={handleSubmit} className='space-y-6'>
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

                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name='password'
                    placeholder='Password'
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className='pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300'
                    disabled={isSubmitting}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className='w-5 h-5' />
                    ) : (
                      <Eye className='w-5 h-5' />
                    )}
                  </button>
                </div>

                <div className='flex items-center justify-between'>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      className='mr-2 accent-purple-500'
                      disabled={isSubmitting}
                    />
                    <span className='text-sm text-gray-300'>Remember me</span>
                  </label>
                  <Link
                    to='/forgot-password'
                    className={`text-sm text-yellow-400 hover:text-yellow-300 ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Forgot password?
                  </Link>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type='submit'
                    size='lg'
                    className='w-full shadow-lg hover:shadow-xl transition-all duration-200 font-semibold'
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn className='mr-2 w-4 h-4' />
                        Sign In
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              <div className='mt-6 text-center'>
                <p className='text-gray-300'>
                  Don't have an account?{' '}
                  <Link
                    to='/get-started'
                    className={`text-purple-300 hover:text-white font-semibold transition-colors duration-200 hover:underline ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Get Started
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
