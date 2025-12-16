import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { useAgencyDashboardRealtime } from '@/hooks/useDashboardRealtime';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  Heart,
  Building2,
  MessageSquare,
  Calendar,
  FileCheck,
  CreditCard,
  TrendingUp,
  BarChart3,
  HelpCircle,
  Settings,
  Wallet,
  User,
  Crown,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import UpgradePromptModal from '@/components/UpgradePromptModal';

export const Sidebar = ({ className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscriptionPlan, loading: subscriptionLoading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check if user is on free plan
  const isFreePlan = !subscriptionLoading && (!subscriptionPlan || subscriptionPlan.toLowerCase() === 'free');
  const [dashboardStats, setDashboardStats] = useState({
    totalMaids: 0,
    activeMaids: 0,
    pendingMaids: 0,
    totalJobs: 0,
    activeJobs: 0,
    newApplicants: 0,
    unreadMessages: 0,
  });

  // GraphQL query for agency dashboard stats
  // Note: agency_jobs uses uuid for agency_id, but we have String Firebase UIDs
  // So we query jobs through the agency_profiles relationship instead
  const AGENCY_STATS_QUERY = gql`
    query AgencyDashboardStats($agencyId: String!) {
      maid_profiles(where: { agency_id: { _eq: $agencyId } }) {
        id
        verification_status
        availability_status
      }
      agency_profiles_by_pk(id: $agencyId) {
        id
        active_listings
        active_maids
        total_maids
      }
      notifications_aggregate(
        where: {
          user_id: { _eq: $agencyId }
          read: { _eq: false }
        }
      ) {
        aggregate {
          count
        }
      }
    }
  `;

  // Fetch agency dashboard stats with useCallback for real-time updates
  const fetchAgencyStats = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      const { data, errors } = await apolloClient.query({
        query: AGENCY_STATS_QUERY,
        variables: { agencyId: user.id },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        console.error('Error fetching agency stats:', errors);
        return;
      }

      const maidsData = data?.maid_profiles || [];
      const agencyProfile = data?.agency_profiles_by_pk;
      const unreadCount = data?.notifications_aggregate?.aggregate?.count || 0;

      // Use maid_profiles for accurate counts
      const totalMaids = maidsData.length || agencyProfile?.total_maids || 0;
      const activeMaids = maidsData.filter(m => m.availability_status === 'available').length || agencyProfile?.active_maids || 0;
      const pendingMaids = maidsData.filter(m => m.verification_status === 'pending_verification').length;

      // Use active_listings from agency_profile for jobs count
      const activeJobs = agencyProfile?.active_listings || 0;

      setDashboardStats({
        totalMaids,
        activeMaids,
        pendingMaids,
        totalJobs: activeJobs,
        activeJobs,
        newApplicants: 0,
        unreadMessages: unreadCount,
      });
    } catch (error) {
      console.error('Error fetching agency stats:', error);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchAgencyStats();
  }, [fetchAgencyStats]);

  // Set up real-time subscriptions
  useAgencyDashboardRealtime(user?.id, fetchAgencyStats);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard/agency', icon: LayoutDashboard },
    { name: 'Profile', href: '/dashboard/agency/profile', icon: User },
    {
      name: 'Maids',
      href: '/dashboard/agency/maids',
      icon: Users,
      badge: dashboardStats.pendingMaids > 0 ? `${dashboardStats.pendingMaids} pending` : null,
      count: dashboardStats.totalMaids,
    },
    {
      name: 'Jobs',
      href: '/dashboard/agency/jobs',
      icon: Briefcase,
      count: dashboardStats.activeJobs,
    },
    {
      name: 'Applicants & Matches',
      href: '/dashboard/agency/applicants',
      icon: UserCheck,
      badge: dashboardStats.newApplicants > 0 ? 'New' : null,
    },
    { name: 'Shortlists', href: '/dashboard/agency/shortlists', icon: Heart },
    { name: 'Sponsors (CRM)', href: '/dashboard/agency/sponsors', icon: Building2 },
    {
      name: 'Messages',
      href: '/dashboard/agency/messages',
      icon: MessageSquare,
      badge: dashboardStats.unreadMessages > 0 ? `${dashboardStats.unreadMessages}` : null,
    },
    { name: 'Calendar & Tasks', href: '/dashboard/agency/calendar', icon: Calendar },
    { name: 'Documents & Compliance', href: '/dashboard/agency/documents', icon: FileCheck },
    { name: 'Billing', href: '/dashboard/agency/billing', icon: CreditCard },
    { name: 'Placement Fees', href: '/dashboard/agency/placement-fees', icon: Wallet },
    { name: 'Analytics', href: '/dashboard/agency/analytics', icon: BarChart3 },
    { name: 'Support & Disputes', href: '/dashboard/agency/support', icon: HelpCircle },
    { name: 'Settings & Team', href: '/dashboard/agency/settings', icon: Settings },
  ];

  return (
    <div className={cn("w-64 bg-white shadow-lg border-r border-gray-200", className)}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {user?.logo || user?.logoFilePreview ? (
              <img
                src={user.logoFilePreview || user.logo}
                alt="Agency Logo"
                className="w-12 h-12 object-cover rounded-full border-2 border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {user?.agencyName ? user.agencyName : 'Agency Dashboard'}
              </h2>
              <p className="text-xs text-gray-500">Ethio Maids Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard/agency'
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);

              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive
                            ? "text-indigo-500"
                            : "text-gray-400 group-hover:text-gray-500"
                        )}
                      />
                      {item.name}
                    </div>
                    {item.badge && (
                      <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs",
                          isActive ? 'bg-indigo-600' : 'bg-gray-200 text-gray-700'
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          {/* Upgrade Banner for Free Users */}
          {isFreePlan && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-full bg-amber-100">
                  <Crown className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-xs font-semibold text-amber-900 truncate">Free Account</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowUpgradeModal(true)}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1 shadow-sm hover:shadow-md transition-all text-xs h-8"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Upgrade
              </Button>
            </div>
          )}

          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-lg text-white">
            <p className="text-sm font-medium">Need Help?</p>
            <p className="text-xs opacity-90 mt-1">
              Contact our support team for assistance
            </p>
            <a href="/dashboard/agency/support" className="mt-2 inline-block text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30 transition-colors">
              Get Support
            </a>
          </div>
        </div>
      </div>

      {/* Upgrade Modal with agency-specific benefits */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userType="agency"
      />
    </div>
  );
};
