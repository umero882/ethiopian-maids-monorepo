import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/global/SEO';
import ErrorBoundary from '@/components/ErrorBoundary';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { useMaidDashboardRealtime } from '@/hooks/useDashboardRealtime';
import { useUnreadNotificationCount } from '@/hooks/services';
import {
  LayoutDashboard,
  Calendar,
  User,
  Clock,
  FileText,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Crown,
  Sparkles,
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

// GraphQL Queries
const GET_MAID_PROFILE_BASIC = gql`
  query GetMaidProfileBasic($userId: String!) {
    maid_profiles(where: { _or: [{ id: { _eq: $userId } }, { user_id: { _eq: $userId } }] }, limit: 1) {
      id
      user_id
      full_name
      profile_photo_url
      profile_completion_percentage
      medical_certificate_valid
      police_clearance_valid
    }
  }
`;

const GET_UNREAD_NOTIFICATIONS = gql`
  query GetUnreadNotifications($userId: String!) {
    notifications(where: { user_id: { _eq: $userId }, read: { _eq: false } }) {
      id
    }
  }
`;

const GET_MAID_BOOKINGS = gql`
  query GetMaidBookings($maidId: String!) {
    booking_requests(where: { maid_id: { _eq: $maidId } }) {
      id
      status
    }
  }
`;

const MaidDashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscriptionPlan, loading: subscriptionLoading } = useSubscription();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const mobileSidebarRef = useRef(null);

  // Use real-time subscription for unread notification count
  const { count: unreadNotificationCount } = useUnreadNotificationCount();

  // Check if user is on free plan
  const isFreePlan = !subscriptionLoading && (!subscriptionPlan || subscriptionPlan.toLowerCase() === 'free');

  // Get active section from current path
  const activeSection = useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard/maid') return 'overview';
    const section = path.split('/').pop();
    return section || 'overview';
  }, [location.pathname]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.id) return;

      try {
        // Fetch basic profile info using GraphQL
        const { data: profileData } = await apolloClient.query({
          query: GET_MAID_PROFILE_BASIC,
          variables: { userId: user.id },
          fetchPolicy: 'network-only',
        });

        const maidProfileData = profileData?.maid_profiles?.[0];

        if (maidProfileData) {
          setProfile({
            name: maidProfileData.full_name || user.name || 'User',
            image: maidProfileData.profile_photo_url || '/images/default-avatar.png'
          });
        } else {
          setProfile({
            name: user.name || 'User',
            image: '/images/default-avatar.png'
          });
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
        // Set defaults on error
        setProfile({
          name: user.name || 'User',
          image: '/images/default-avatar.png'
        });
      }
    };

    fetchUserData();
  }, [user]);

  // Focus trap for mobile sidebar accessibility
  useEffect(() => {
    if (!mobileSidebarOpen || !mobileSidebarRef.current) return;

    const sidebar = mobileSidebarRef.current;
    const focusableElements = sidebar.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on open
    firstElement?.focus();

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        setMobileSidebarOpen(false);
      }
    };

    sidebar.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      sidebar.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [mobileSidebarOpen]);

  const hrefForSection = (section) =>
    section === 'overview' ? '/dashboard/maid' : `/dashboard/maid/${section}`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [dashboardStats, setDashboardStats] = useState({
    pendingBookings: 0,
    activeBookings: 0,
    profileCompleteness: 0,
    pendingDocuments: 0,
  });

  // Fetch dashboard stats with useCallback for real-time updates
  const fetchDashboardStats = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      // Fetch bookings using GraphQL
      const { data: bookingsResult } = await apolloClient.query({
        query: GET_MAID_BOOKINGS,
        variables: { maidId: user.id },
        fetchPolicy: 'network-only',
      });

      const bookingsData = bookingsResult?.booking_requests || [];

      // Count pending bookings (status = 'pending')
      const pendingCount = bookingsData.filter(b =>
        b.status === 'pending'
      ).length || 0;

      // Count active/accepted bookings
      const activeCount = bookingsData.filter(b =>
        b.status === 'accepted'
      ).length || 0;

      // Fetch profile completion percentage using GraphQL
      const { data: profileResult } = await apolloClient.query({
        query: GET_MAID_PROFILE_BASIC,
        variables: { userId: user.id },
        fetchPolicy: 'network-only',
      });

      const profileData = profileResult?.maid_profiles?.[0];

      // Calculate pending documents count
      const pendingDocs = [
        !profileData?.medical_certificate_valid,
        !profileData?.police_clearance_valid
      ].filter(Boolean).length;

      setDashboardStats({
        pendingBookings: pendingCount,
        activeBookings: activeCount,
        profileCompleteness: profileData?.profile_completion_percentage || 0,
        pendingDocuments: pendingDocs,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Set up real-time subscriptions
  useMaidDashboardRealtime(user?.id, fetchDashboardStats);

  const navItems = [
    {
      section: 'Main',
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: <LayoutDashboard className='h-5 w-5' />,
          count: 0,
          description: 'View your overview',
        },
        {
          id: 'bookings',
          label: 'My Bookings',
          icon: <Calendar className='h-5 w-5' />,
          count: dashboardStats.pendingBookings,
          description: 'Manage job bookings',
          badge: dashboardStats.pendingBookings > 0 ? 'New' : null,
        },
      ],
    },
    {
      section: 'Profile',
      items: [
        {
          id: 'profile',
          label: 'My Profile',
          icon: <User className='h-5 w-5' />,
          count: 0,
          description: 'Edit your profile',
          badge: dashboardStats.profileCompleteness < 100
            ? `${dashboardStats.profileCompleteness}%`
            : null,
        },
        {
          id: 'availability',
          label: 'Availability',
          icon: <Clock className='h-5 w-5' />,
          count: 0,
          description: 'Set your schedule',
        },
        {
          id: 'documents',
          label: 'Documents',
          icon: <FileText className='h-5 w-5' />,
          count: dashboardStats.pendingDocuments,
          description: 'Upload documents',
          badge: dashboardStats.pendingDocuments > 0
            ? `${dashboardStats.pendingDocuments} pending`
            : null,
        },
      ],
    },
    {
      section: 'Communication',
      items: [
        {
          id: 'messages',
          label: 'Messages',
          icon: <MessageSquare className='h-5 w-5' />,
          count: 0,
          description: 'View and send messages',
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: <Bell className='h-5 w-5' />,
          count: unreadNotificationCount,
          description: 'View notifications',
          badge: unreadNotificationCount > 0 ? `${unreadNotificationCount}` : null,
        },
      ],
    },
    {
      section: 'Account',
      items: [
        {
          id: 'subscriptions',
          label: 'Subscription',
          icon: <CreditCard className='h-5 w-5' />,
          count: 0,
          description: 'Manage subscription',
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings className='h-5 w-5' />,
          count: 0,
          description: 'Account settings',
        },
      ],
    },
  ];

  const seo = useMemo(
    () => ({
      title: 'Maid Dashboard | Ethiopian Maids',
      description: 'Manage your domestic worker profile, bookings, and more.',
      keywords: 'maid dashboard, domestic worker, profile management, job bookings',
    }),
    []
  );

  if (!user) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <p className='text-lg font-medium text-gray-800 mb-4'>Authentication Required</p>
          <p className='text-gray-600 mb-4'>Please log in to access your dashboard.</p>
          <Button onClick={() => navigate('/login')}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  // Redirect if user is not a maid
  if (user && user.userType !== 'maid') {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <p className='text-lg font-medium text-gray-800 mb-4'>Access Denied</p>
          <p className='text-gray-600 mb-4'>This dashboard is only available to maid accounts.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Main Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <SEO {...seo} />
      <div className='flex flex-1'>
        {/* Header */}
        <div className='fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10'>
          <div className='flex items-center'>
            <Link to='/' className='flex items-center'>
              <img
                src='/images/logo/ethiopian-maids-logo.png'
                alt='Ethiopian Maids Logo'
                className='h-10 w-auto mr-3'
              />
              <span className='text-2xl font-bold text-gray-800'>
                Ethiopian Maids
              </span>
            </Link>
          </div>
          <div className='flex items-center gap-4'>
            <p className='text-sm mr-2'>{profile?.name || user?.name || 'User'}</p>
            <Link to='/dashboard/maid/notifications' className='relative'>
              <Bell className='h-5 w-5 text-gray-500 cursor-pointer hover:text-purple-600 transition-colors' />
              {unreadNotificationCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </Link>
            <Avatar className='h-8 w-8'>
              <AvatarImage src={profile?.image} alt={profile?.name} />
              <AvatarFallback>{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Mobile Sidebar Toggle */}
        <button
          className='fixed bottom-4 right-4 md:hidden z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg'
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          {mobileSidebarOpen ? (
            <X className='h-6 w-6' />
          ) : (
            <Menu className='h-6 w-6' />
          )}
        </button>

        {/* Sidebar - Desktop */}
        <div className='hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0'>
          <div className='flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto'>
            <div className='flex items-center justify-center flex-shrink-0 px-4'>
              <Link to='/' className='text-2xl font-bold text-purple-600'>
                Ethiopian Maids
              </Link>
            </div>
            <div className='mt-8 flex-1 flex flex-col justify-between'>
              <div className='space-y-6'>
                {navItems.map((group) => (
                  <div key={group.section}>
                    <div className='px-4 mb-2'>
                      <h2 className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
                        {group.section}
                      </h2>
                    </div>
                    <nav className='px-3 space-y-1'>
                      {group.items.map((item) => (
                        <Link
                          key={item.id}
                          to={hrefForSection(item.id)}
                          title={item.description}
                          className={`group flex items-center justify-between px-3 py-2.5 rounded-lg w-full transition-all duration-200 ${
                            activeSection === item.id
                              ? 'bg-purple-100 text-purple-900 shadow-sm'
                              : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                          }`}
                        >
                          <div className='flex items-center gap-3'>
                            <span
                              className={`transition-colors ${activeSection === item.id ? 'text-purple-600' : 'text-gray-500 group-hover:text-purple-600'}`}
                            >
                              {item.icon}
                            </span>
                            <div className='flex flex-col'>
                              <span className='text-sm font-medium'>
                                {item.label}
                              </span>
                            </div>
                          </div>
                          {item.badge && (
                            <Badge variant={activeSection === item.id ? 'default' : 'secondary'} className={activeSection === item.id ? 'bg-purple-600' : ''}>
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      ))}
                    </nav>
                  </div>
                ))}
              </div>
              <div className='px-3 mt-6 mb-6 space-y-3'>
                {/* Upgrade Banner for Free Users */}
                {isFreePlan && (
                  <div className='bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200'>
                    <div className='flex items-center gap-2 mb-2'>
                      <div className='p-1.5 rounded-full bg-amber-100'>
                        <Crown className='h-4 w-4 text-amber-600' />
                      </div>
                      <p className='text-xs font-semibold text-amber-900 truncate'>Free Account</p>
                    </div>
                    <Button
                      size='sm'
                      onClick={() => navigate('/pricing')}
                      className='w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1 shadow-sm hover:shadow-md transition-all text-xs h-8'
                    >
                      <Sparkles className='h-3.5 w-3.5' />
                      Upgrade
                    </Button>
                  </div>
                )}

                <Button
                  variant='outline'
                  className='w-full justify-start text-gray-700'
                  onClick={handleLogout}
                >
                  <LogOut className='h-4 w-4 mr-2' />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Mobile */}
        {mobileSidebarOpen && (
          <div className='fixed inset-0 flex z-40 md:hidden'>
            <div className='fixed inset-0 bg-gray-600 bg-opacity-75' onClick={() => setMobileSidebarOpen(false)} />
            <div ref={mobileSidebarRef} className='relative flex-1 flex flex-col max-w-xs w-full bg-white'>
              <div className='absolute top-0 right-0 -mr-12 pt-2'>
                <button
                  className='ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <X className='h-6 w-6 text-white' />
                </button>
              </div>
              <div className='flex-1 h-0 pt-5 pb-4 overflow-y-auto'>
                <div className='flex-shrink-0 flex items-center px-4'>
                  <Link to='/' className='text-xl font-bold text-purple-600'>
                    Ethiopian Maids
                  </Link>
                </div>
                <div className='mt-5 px-2 space-y-6'>
                  {navItems.map((group) => (
                    <div key={group.section}>
                      <div className='px-3 mb-2'>
                        <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
                          {group.section}
                        </h3>
                      </div>
                      <nav className='space-y-1'>
                        {group.items.map((item) => (
                          <Link
                            key={item.id}
                            to={hrefForSection(item.id)}
                            className={`group flex items-center justify-between px-3 py-2.5 text-base font-medium rounded-lg transition-all ${
                              activeSection === item.id
                                ? 'bg-purple-100 text-purple-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            onClick={() => setMobileSidebarOpen(false)}
                          >
                            <div className='flex items-center gap-3'>
                              <span className={activeSection === item.id ? 'text-purple-600' : 'text-gray-500'}>
                                {item.icon}
                              </span>
                              {item.label}
                            </div>
                            {item.badge && (
                              <Badge className={activeSection === item.id ? 'bg-purple-600' : 'bg-gray-400'}>
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        ))}
                      </nav>
                    </div>
                  ))}
                </div>
              </div>
              <div className='flex-shrink-0 border-t border-gray-200 p-4 space-y-3'>
                {/* Upgrade Banner for Free Users - Mobile */}
                {isFreePlan && (
                  <div className='bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3'>
                    <div className='flex items-center gap-2 mb-2'>
                      <div className='p-1.5 rounded-full bg-amber-100'>
                        <Crown className='h-4 w-4 text-amber-600' />
                      </div>
                      <p className='text-xs font-semibold text-amber-900'>Free Account</p>
                    </div>
                    <Button
                      size='sm'
                      onClick={() => {
                        navigate('/pricing');
                        setMobileSidebarOpen(false);
                      }}
                      className='w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1 shadow-sm text-xs h-8'
                    >
                      <Sparkles className='h-3.5 w-3.5' />
                      Upgrade
                    </Button>
                  </div>
                )}

                <Button
                  variant='outline'
                  className='w-full justify-start'
                  onClick={handleLogout}
                >
                  <LogOut className='h-4 w-4 mr-2' />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className='md:pl-64 flex flex-col flex-1 min-h-screen'>
          <div className='flex-1 pt-20 pb-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              <ErrorBoundary name="MaidDashboard">
                <Outlet />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaidDashboardLayout;
