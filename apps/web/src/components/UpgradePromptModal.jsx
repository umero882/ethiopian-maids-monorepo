/**
 * Upgrade Prompt Modal Component
 *
 * Shows detailed upgrade benefits and pricing when users click upgrade.
 * Supports user-type-specific features and pricing for agency, maid, and sponsor.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Crown,
  Users,
  TrendingUp,
  Upload,
  Shield,
  Bell,
  Sparkles,
  Zap,
  ArrowRight,
  X,
  Eye,
  Briefcase,
  MessageSquare,
  Star,
  Search,
  Heart,
  Filter,
  Bot,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// User-type-specific features
const FEATURES_BY_USER_TYPE = {
  agency: [
    {
      icon: Users,
      title: '25-Unlimited Listings',
      description: 'Publish more maids & jobs',
      color: 'text-blue-400',
    },
    {
      icon: MessageSquare,
      title: '50-Unlimited Messages',
      description: 'Connect with sponsors directly',
      color: 'text-green-400',
    },
    {
      icon: TrendingUp,
      title: 'Analytics Dashboard',
      description: 'Track performance & trends',
      color: 'text-purple-400',
    },
    {
      icon: Upload,
      title: 'Bulk Upload',
      description: 'Import multiple profiles',
      color: 'text-yellow-400',
    },
    {
      icon: Shield,
      title: 'Verification Badge',
      description: 'Build trust & credibility',
      color: 'text-blue-300',
    },
    {
      icon: Sparkles,
      title: 'Priority Support',
      description: '24-hour response time',
      color: 'text-pink-400',
    },
  ],
  maid: [
    {
      icon: Eye,
      title: '500+ Profile Views',
      description: 'Get seen by more sponsors',
      color: 'text-blue-400',
    },
    {
      icon: Briefcase,
      title: '25+ Job Applications',
      description: 'Apply to more opportunities',
      color: 'text-green-400',
    },
    {
      icon: MessageSquare,
      title: 'Direct Messaging',
      description: 'Chat instantly with sponsors',
      color: 'text-purple-400',
    },
    {
      icon: Star,
      title: 'Featured Placement',
      description: 'Appear at top of search',
      color: 'text-yellow-400',
    },
    {
      icon: Shield,
      title: 'Verification Badge',
      description: 'Stand out with trust badge',
      color: 'text-blue-300',
    },
    {
      icon: Sparkles,
      title: 'Priority Support',
      description: 'Get help faster (24hr)',
      color: 'text-pink-400',
    },
  ],
  sponsor: [
    {
      icon: Briefcase,
      title: '5+ Job Postings',
      description: 'Post more opportunities',
      color: 'text-blue-400',
    },
    {
      icon: Search,
      title: '250+ Searches',
      description: 'Find the perfect match',
      color: 'text-green-400',
    },
    {
      icon: Heart,
      title: '50+ Saved Candidates',
      description: 'Build your shortlist',
      color: 'text-purple-400',
    },
    {
      icon: MessageSquare,
      title: 'Direct Messaging',
      description: 'Contact maids instantly',
      color: 'text-yellow-400',
    },
    {
      icon: Filter,
      title: 'Advanced Filters',
      description: 'Find specific skills',
      color: 'text-blue-300',
    },
    {
      icon: Bot,
      title: 'AI Matching',
      description: 'Let AI find candidates',
      color: 'text-pink-400',
    },
  ],
};

// User-type-specific pricing
const PRICING_BY_USER_TYPE = {
  agency: { price: 299, currency: 'AED' },
  maid: { price: 79, currency: 'AED' },
  sponsor: { price: 199, currency: 'AED' },
};

// User-type-specific default messages
const DEFAULT_MESSAGES_BY_USER_TYPE = {
  agency: {
    title: 'Upgrade to Professional',
    message: 'Take your agency to the next level with powerful tools and unlimited access',
  },
  maid: {
    title: 'Upgrade to Professional',
    message: 'Get more visibility, apply to more jobs, and connect directly with sponsors',
  },
  sponsor: {
    title: 'Upgrade to Professional',
    message: 'Find the perfect candidate faster with advanced search and AI matching',
  },
};

const UpgradePromptModal = ({
  isOpen,
  onClose,
  userType = 'agency', // 'agency' | 'maid' | 'sponsor'
  title,
  message,
}) => {
  const navigate = useNavigate();

  // Get features and pricing for the current user type (fallback to agency)
  const features = FEATURES_BY_USER_TYPE[userType] || FEATURES_BY_USER_TYPE.agency;
  const pricing = PRICING_BY_USER_TYPE[userType] || PRICING_BY_USER_TYPE.agency;
  const defaults = DEFAULT_MESSAGES_BY_USER_TYPE[userType] || DEFAULT_MESSAGES_BY_USER_TYPE.agency;

  // Use provided title/message or defaults based on user type
  const displayTitle = title || defaults.title;
  const displayMessage = message || defaults.message;

  const handleUpgrade = () => {
    navigate('/pricing');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        <div className="relative z-10 p-6">
          {/* Header */}
          <DialogHeader className="space-y-3 mb-6">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-semibold text-white">UPGRADE TO PROFESSIONAL</span>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-white text-center">
              {displayTitle}
            </DialogTitle>
            <p className="text-blue-100 text-center text-sm">
              {displayMessage}
            </p>
          </DialogHeader>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20"
              >
                <feature.icon className={`h-5 w-5 ${feature.color} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className="text-white font-medium text-sm">{feature.title}</p>
                  <p className="text-blue-100 text-xs">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing & CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-center sm:text-left">
              <p className="text-white/80 text-xs font-medium mb-1">Starting from</p>
              <div className="flex items-baseline gap-1 justify-center sm:justify-start">
                <span className="text-3xl font-bold text-white">{pricing.currency} {pricing.price}</span>
                <span className="text-blue-100 text-sm">/month</span>
              </div>
              <p className="text-white/60 text-xs mt-1">Cancel anytime</p>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-2">
              <Button
                size="lg"
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 py-6 text-base shadow-2xl hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Upgrade Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-white/70 text-xs">
                7-day money-back guarantee
              </p>
            </div>
          </div>

          {/* Maybe Later */}
          <div className="text-center mt-4">
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePromptModal;
