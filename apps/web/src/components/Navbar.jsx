import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadNotificationCount } from '@/hooks/services';
import {
  Home,
  Users,
  Briefcase,
  Bell,
  UserCircle,
  LogOut,
  Menu,
  X,
  DollarSign,
  LogIn,
  UserPlus,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NavItem = ({ to, icon: Icon, children, onClick, disabled = false, ariaLabel, showText = false, badge = null }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <NavLink
        to={disabled ? '#' : to}
        onClick={(e) => {
          if (disabled) e.preventDefault();
          else if (onClick) onClick(e);
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={({ isActive }) =>
          cn(
            'flex items-center rounded-md text-sm font-medium transition-all duration-200 ease-in-out relative',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
            showText ? 'px-3 py-2' : 'justify-center p-2',
            isActive && !disabled
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-purple-100 hover:text-purple-700',
            disabled && [
              'opacity-60 cursor-not-allowed hover:bg-gray-50 hover:text-gray-500',
              'relative grayscale-[0.5] border border-gray-200 bg-gray-50'
            ]
          )
        }
        aria-disabled={disabled}
        aria-label={ariaLabel || children}
        tabIndex={disabled ? -1 : undefined}
      >
        <div className="flex items-center relative">
          {Icon && <Icon className={cn('h-5 w-5', disabled && 'opacity-70')} />}
          {/* Badge for icon-only mode (e.g., notification count) */}
          {!showText && badge}
          {showText && (
            <>
              <span className={cn('ml-2', disabled ? 'opacity-80' : '')}>{children}</span>
              {disabled && (
                <Lock className="h-3 w-3 ml-auto text-gray-400" aria-hidden="true" />
              )}
            </>
          )}
          {!showText && disabled && (
            <Lock className="h-3 w-3 ml-1 text-gray-400" aria-hidden="true" />
          )}
        </div>
      </NavLink>

      {/* Tooltip with text label on hover (only for icon-only mode) */}
      {!showText && showTooltip && (
        <div className="absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          {disabled ? 'Complete your profile to unlock' : children}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
            <div className="border-4 border-transparent border-b-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authContext = useAuth();
  const { user, logout, loading } = authContext || {};
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Get real-time unread notification count
  const { count: unreadCount } = useUnreadNotificationCount();

  // (Chat FAB moved out of Navbar to ChatFab component)

  // Fetch user avatar from profile
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) {
        setAvatarUrl(null);
        return;
      }

      try {
        // Import Apollo Client and gql for GraphQL queries
        const { apolloClient } = await import('@ethio/api-client');
        const { gql } = await import('@apollo/client');

        if (user.userType === 'sponsor' || user.user_type === 'sponsor') {
          const GET_SPONSOR_AVATAR = gql`
            query GetSponsorAvatar($userId: String!) {
              sponsor_profiles_by_pk(id: $userId) {
                avatar_url
              }
            }
          `;
          const { data } = await apolloClient.query({
            query: GET_SPONSOR_AVATAR,
            variables: { userId: user.id },
            fetchPolicy: 'no-cache',
          });
          setAvatarUrl(data?.sponsor_profiles_by_pk?.avatar_url || null);
        } else if (user.userType === 'maid' || user.user_type === 'maid') {
          const GET_MAID_AVATAR = gql`
            query GetMaidAvatar($userId: String!) {
              maid_profiles_by_pk(id: $userId) {
                profile_photo_url
              }
            }
          `;
          const { data } = await apolloClient.query({
            query: GET_MAID_AVATAR,
            variables: { userId: user.id },
            fetchPolicy: 'no-cache',
          });
          setAvatarUrl(data?.maid_profiles_by_pk?.profile_photo_url || null);
        } else if (user.userType === 'agency' || user.user_type === 'agency') {
          const GET_AGENCY_AVATAR = gql`
            query GetAgencyAvatar($userId: String!) {
              agency_profiles_by_pk(id: $userId) {
                logo_url
              }
            }
          `;
          const { data } = await apolloClient.query({
            query: GET_AGENCY_AVATAR,
            variables: { userId: user.id },
            fetchPolicy: 'no-cache',
          });
          setAvatarUrl(data?.agency_profiles_by_pk?.logo_url || null);
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
        setAvatarUrl(null);
      }
    };

    fetchAvatar();
  }, [user?.id, user?.userType]);

  // Helper functions and computed values
  const isProfileComplete = (() => {
    // Prefer explicit boolean flags in order of common usage across codebase
    const flags = [
      user?.registration_complete,
      user?.profileComplete,
      user?.profile_completed,
      user?.profile?.complete,
    ];
    for (const f of flags) if (typeof f === 'boolean') return f;
    if (typeof user?.profile_completion_percentage === 'number') {
      return user.profile_completion_percentage >= 80; // consider 80%+ as usable
    }
    return false;
  })();
  const profileIncomplete = !!user && !isProfileComplete;
  const isAgency = user?.role === 'agency' || user?.userType === 'agency';

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMobileMenu();
  };

  const commonNavLinks = [
    { to: '/', text: 'Home', icon: Home, requiresProfileComplete: false },
    { to: '/maids', text: 'Find Maids', icon: Users, requiresProfileComplete: false },
    { to: '/jobs', text: 'Jobs', icon: Briefcase, requiresProfileComplete: true },
    { to: '/pricing', text: 'Pricing', icon: DollarSign, requiresProfileComplete: false },
  ];

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 }
  };

  // Don't show loading state for navbar - show nav items immediately
  // Only user menu section should wait for auth

  return (
    <nav className='bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link
              to='/'
              className='flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg px-2 py-1'
              aria-label='Ethio-Maids Home'
            >
              <img
                src='/images/logo/ethiopian-maids-logo.png'
                alt='Ethio-Maids Logo'
                className='h-10 w-auto object-contain'
              />
              <span className='text-xl font-bold text-gray-900'>Ethio-Maids</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center space-x-4'>
            {commonNavLinks.map((link) => (
              <NavItem
                key={link.to}
                to={link.to}
                icon={link.icon}
                disabled={link.requiresProfileComplete && profileIncomplete}
              >
                {link.text}
              </NavItem>
            ))}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className='hidden md:flex items-center space-x-4'>

            {loading ? (
              // Show minimal loading state while auth initializes
              <div className='flex items-center space-x-2'>
                <div className='w-20 h-8 bg-gray-200 rounded animate-pulse'></div>
                <div className='w-24 h-8 bg-gray-200 rounded animate-pulse'></div>
              </div>
            ) : user ? (
              <div className='flex items-center space-x-4'>
                <NavItem
                  to='/notifications'
                  icon={Bell}
                  disabled={profileIncomplete}
                  ariaLabel={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                  badge={unreadCount > 0 && (
                    <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center'>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                >
                  Notifications
                </NavItem>

                {/* User Avatar and Dashboard Link */}
                <Link
                  to='/dashboard'
                  className='flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-purple-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                  aria-label='Go to Dashboard'
                >
                  <Avatar className='h-8 w-8 ring-2 ring-purple-200 hover:ring-purple-400 transition-all'>
                    <AvatarImage src={avatarUrl} alt={user?.name || user?.email || 'User'} />
                    <AvatarFallback className='bg-purple-600 text-white text-sm font-semibold'>
                      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className='hidden lg:inline text-sm font-medium text-gray-700'>
                    {user?.name || 'Dashboard'}
                  </span>
                </Link>

                <Button
                  onClick={handleLogout}
                  variant='ghost'
                  size='sm'
                  className='text-red-600 hover:bg-red-100 hover:text-red-700'
                >
                  <LogOut className='w-4 h-4 mr-2' />
                  Logout
                </Button>
              </div>
            ) : (
              <div className='flex items-center space-x-4'>
                <Button asChild variant='ghost' size='sm'>
                  <Link to='/login'>
                    <LogIn className='w-4 h-4 mr-2' />
                    Login
                  </Link>
                </Button>
                <Button asChild size='sm'>
                  <Link to='/get-started'>
                    <UserPlus className='w-4 h-4 mr-2' />
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>
          <div className='md:hidden flex items-center'>
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant='ghost'
              size='icon'
              className='text-gray-700 hover:text-purple-600 focus:ring-2 focus:ring-purple-500'
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls='mobile-menu'
            >
              {mobileMenuOpen ? (
                <X className='h-7 w-7' aria-hidden='true' />
              ) : (
                <Menu className='h-7 w-7' aria-hidden='true' />
              )}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='md:hidden fixed inset-0 bg-black/20 z-40'
              onClick={closeMobileMenu}
            />

            {/* Mobile menu overlay */}
            <motion.div
              variants={mobileMenuVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              className='md:hidden fixed top-20 left-0 right-0 bg-white shadow-2xl z-50 border-t border-gray-200 max-h-[calc(100vh-5rem)] overflow-y-auto'
            >
            <div className='p-4 space-y-1'>
              {commonNavLinks.map((link) => (
                <NavItem
                  key={link.to}
                  to={link.to}
                  icon={link.icon}
                  onClick={closeMobileMenu}
                  disabled={link.requiresProfileComplete && profileIncomplete}
                  showText={true}
                >
                  {link.text}
                </NavItem>
              ))}
              {user ? (
                <>
                  {/* User Profile Section */}
                  <Link
                    to='/dashboard'
                    onClick={closeMobileMenu}
                    className='flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 transition-colors border border-purple-100 mb-4'
                  >
                    <Avatar className='h-12 w-12 ring-2 ring-purple-200'>
                      <AvatarImage src={avatarUrl} alt={user?.name || user?.email || 'User'} />
                      <AvatarFallback className='bg-purple-600 text-white text-lg font-semibold'>
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                      <p className='font-semibold text-gray-900'>{user?.name || user?.email || 'User'}</p>
                      <p className='text-sm text-gray-500 capitalize'>{user?.userType || 'User'}</p>
                    </div>
                    <UserCircle className='h-5 w-5 text-gray-400' />
                  </Link>

                  <NavItem
                    to='/notifications'
                    icon={Bell}
                    onClick={closeMobileMenu}
                    disabled={profileIncomplete}
                    showText={true}
                  >
                    Notifications
                  </NavItem>
                  <Button
                    onClick={handleLogout}
                    variant='ghost'
                    size='sm'
                    className='w-full justify-start text-red-600 hover:bg-red-100 hover:text-red-700 mt-2'
                  >
                    <LogOut className='w-5 h-5 mr-2' />
                    Logout
                  </Button>
                </>
              ) : (
                <div className='space-y-3 pt-4 border-t border-gray-200'>
                  <Button
                    asChild
                    variant='outline'
                    className='w-full justify-center border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200'
                    onClick={closeMobileMenu}
                  >
                    <Link to='/login' className='flex items-center space-x-2'>
                      <LogIn className='w-4 h-4' />
                      <span>Login to Account</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size='lg'
                    className='w-full justify-center shadow-md hover:shadow-lg transition-all duration-200 py-3 px-6'
                    onClick={closeMobileMenu}
                  >
                    <Link to='/get-started' className='flex items-center space-x-2'>
                      <UserPlus className='w-5 h-5' />
                      <span className='font-medium text-base'>Get Started Free</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat FAB has been extracted to ChatFab (bottom-right) */}
    </nav>
  );
};

export default Navbar;
