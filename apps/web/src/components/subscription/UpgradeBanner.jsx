/**
 * UpgradeBanner Component
 *
 * A reusable upgrade banner/button component with consistent styling across the platform.
 * Supports 3 variants: full, compact, and inline.
 *
 * Usage:
 * <UpgradeBanner variant="full" />
 * <UpgradeBanner variant="compact" />
 * <UpgradeBanner variant="inline" title="Unlock Feature" description="Upgrade to access" />
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const UpgradeBanner = ({
  variant = 'full', // 'full' | 'compact' | 'inline'
  title = 'Free Account',
  description = 'Upgrade to Pro for unlimited features',
  buttonText = 'Upgrade',
  redirectPath = '/pricing',
  className = '',
  showIcon = true,
  onUpgradeClick = null,
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      navigate(redirectPath);
    }
  };

  // Full variant - Used at top of dashboard pages
  if (variant === 'full') {
    return (
      <div className={cn(
        'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm',
        'animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {showIcon && (
              <div className="p-2.5 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 shadow-inner">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-amber-900">{title}</p>
              <p className="text-xs text-amber-700 mt-0.5">{description}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1.5 shadow-md hover:shadow-lg transition-all duration-200 group"
          >
            <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
            {buttonText}
            <ArrowRight className="h-3.5 w-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
          </Button>
        </div>
      </div>
    );
  }

  // Compact variant - Used in sidebars
  if (variant === 'compact') {
    return (
      <div className={cn(
        'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3',
        'hover:shadow-md transition-shadow duration-200',
        className
      )}>
        <div className="flex items-center gap-2 mb-2">
          {showIcon && (
            <div className="p-1.5 rounded-full bg-amber-100">
              <Crown className="h-4 w-4 text-amber-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-900 truncate">{title}</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1 shadow-sm hover:shadow-md transition-all text-xs h-8"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {buttonText}
        </Button>
      </div>
    );
  }

  // Inline variant - Used within content areas
  if (variant === 'inline') {
    return (
      <div className={cn(
        'inline-flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg px-4 py-2',
        className
      )}>
        {showIcon && (
          <div className="p-1.5 rounded-full bg-amber-100">
            <Crown className="h-4 w-4 text-amber-600" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs font-medium text-amber-900">{title}</p>
          <p className="text-xs text-amber-700">{description}</p>
        </div>
        <Button
          size="sm"
          onClick={handleUpgrade}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1 shadow-sm text-xs h-7 px-3"
        >
          <Sparkles className="h-3 w-3" />
          {buttonText}
        </Button>
      </div>
    );
  }

  // Button only variant
  return (
    <Button
      size="sm"
      onClick={handleUpgrade}
      className={cn(
        'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-1.5 shadow-md hover:shadow-lg transition-all',
        className
      )}
    >
      <Sparkles className="h-4 w-4" />
      {buttonText}
    </Button>
  );
};

// Pre-configured variants for common use cases
export const UpgradeBannerFull = (props) => <UpgradeBanner variant="full" {...props} />;
export const UpgradeBannerCompact = (props) => <UpgradeBanner variant="compact" {...props} />;
export const UpgradeBannerInline = (props) => <UpgradeBanner variant="inline" {...props} />;
export const UpgradeButton = (props) => <UpgradeBanner variant="button" {...props} />;

export default UpgradeBanner;
