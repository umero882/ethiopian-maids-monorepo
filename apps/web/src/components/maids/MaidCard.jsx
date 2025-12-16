import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Heart,
  Play,
  CheckCircle,
  Building2,
  Eye,
  Briefcase,
  Clock,
  User,
} from 'lucide-react';
import { getMaidDisplayName } from '@/lib/displayName';

// Helper function to get country code from nationality
const getCountryCode = (isoCode, nationality) => {
  if (isoCode && isoCode.length === 2) {
    return isoCode.toLowerCase();
  }
  // Fallback mappings for common nationalities
  const nationalityMap = {
    ethiopian: 'et',
    ethiopia: 'et',
    filipino: 'ph',
    philippines: 'ph',
    kenyan: 'ke',
    kenya: 'ke',
    ugandan: 'ug',
    uganda: 'ug',
    indian: 'in',
    india: 'in',
    indonesian: 'id',
    indonesia: 'id',
    'sri lankan': 'lk',
    'sri lanka': 'lk',
    nepalese: 'np',
    nepal: 'np',
    bangladeshi: 'bd',
    bangladesh: 'bd',
    pakistani: 'pk',
    pakistan: 'pk',
    saudi: 'sa',
    'saudi arabia': 'sa',
    'saudi arabian': 'sa',
    emirati: 'ae',
    uae: 'ae',
    'united arab emirates': 'ae',
  };
  const key = (nationality || '').toLowerCase();
  return nationalityMap[key] || null;
};

// Flag image component using flagcdn.com
const FlagImage = ({ countryCode, className = '' }) => {
  if (!countryCode) {
    return <span className={`text-gray-400 ${className}`}>🏳️</span>;
  }
  return (
    <img
      src={`https://flagcdn.com/24x18/${countryCode}.png`}
      srcSet={`https://flagcdn.com/48x36/${countryCode}.png 2x`}
      alt={countryCode.toUpperCase()}
      className={`inline-block ${className}`}
      style={{ width: '24px', height: '18px' }}
    />
  );
};

// Get status color and styles
const getStatusStyles = (status, hiredStatus) => {
  // Check hired status first (takes priority)
  const hiredStatusLower = (hiredStatus || '').toLowerCase();
  if (hiredStatusLower === 'hired') {
    return { bg: 'bg-purple-600/90', text: 'text-white', dotBg: 'bg-white', label: 'Hired' };
  }
  if (hiredStatusLower === 'in_trial') {
    return { bg: 'bg-orange-500/90', text: 'text-white', dotBg: 'bg-white', label: 'On Trial', animate: true };
  }

  const statusLower = (status || '').toLowerCase();
  switch (statusLower) {
    case 'available':
      return { bg: 'bg-emerald-500/90', text: 'text-white', dotBg: 'bg-white', label: 'Available' };
    case 'placed':
      return { bg: 'bg-blue-500/90', text: 'text-white', dotBg: 'bg-white', label: 'Placed' };
    case 'pending':
      return { bg: 'bg-amber-500/90', text: 'text-white', dotBg: 'bg-white', label: 'Pending' };
    case 'unavailable':
      return { bg: 'bg-red-500/90', text: 'text-white', dotBg: 'bg-white', label: 'Unavailable' };
    default:
      return { bg: 'bg-gray-500/90', text: 'text-white', dotBg: 'bg-white', label: status || 'Unknown' };
  }
};

// Format posted date (relative time)
const getPostedDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

// Get preference text
const getPreferenceText = (liveIn, contract) => {
  const parts = [];
  if (contract) {
    parts.push(
      contract
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
    );
  }
  if (liveIn !== undefined) {
    parts.push(liveIn ? 'Live-in' : 'Live-out');
  }
  return parts.join(' + ') || 'Flexible';
};

// Format salary display
const formatSalary = (min, max, currency) => {
  const curr = currency || 'USD';
  const symbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'AED' ? 'AED ' : curr + ' ';
  if (min && max) {
    return `${symbol}${min.toLocaleString()}-${max.toLocaleString()}`;
  }
  if (min) return `${symbol}${min.toLocaleString()}+`;
  if (max) return `${symbol}${max.toLocaleString()}`;
  return 'Negotiable';
};

const MaidCard = ({ maid, index, onContact, onFavorite, onBookNow, user, navigate, isFavorite = false }) => {
  // Get display name - check multiple possible field names
  const displayName = maid.full_name || maid.fullName || maid.name || getMaidDisplayName(maid);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2) || 'NA';

  // Check hired status for contact blocking
  const hiredStatus = maid.hired_status || '';
  const isHired = hiredStatus === 'hired';
  const isOnTrial = hiredStatus === 'in_trial';
  const isUnavailableForContact = isHired || isOnTrial;

  const statusStyles = getStatusStyles(maid.availability_status || maid.availability, hiredStatus);
  const hasVideo = maid.introduction_video_url;
  const isVerified = maid.verified || maid.verification_status === 'verified';
  const isAgencyManaged = maid.agencyManaged || maid.is_agency_managed;
  const experience = maid.experience_years || maid.experience || 0;
  const experienceDisplay = typeof experience === 'number' ? `${experience} yrs` : experience;
  const salary = maid.salaryDisplay || formatSalary(
    maid.preferred_salary_min || maid.salaryRange?.min,
    maid.preferred_salary_max || maid.salaryRange?.max,
    maid.preferred_currency
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group"
    >
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer min-w-[280px]"
        onClick={() => navigate(`/maid/${maid.id}`)}
        role="article"
        aria-labelledby={`maid-${maid.id}-name`}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {maid.image || maid.profile_photo_url ? (
            <>
              <img
                src={maid.image || maid.profile_photo_url}
                alt={`Photo of ${displayName}`}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback placeholder (hidden by default) */}
              <div className="absolute inset-0 items-center justify-center bg-gray-100 hidden flex-col">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                <span className="text-2xl font-bold text-gray-400">{initials}</span>
                <span className="text-sm text-gray-400">No photo</span>
              </div>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                <User className="w-10 h-10 text-gray-400" />
              </div>
              <span className="text-2xl font-bold text-gray-400">{initials}</span>
              <span className="text-sm text-gray-400">No photo</span>
            </div>
          )}

          {/* Favorite Button - Top Left */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(maid);
            }}
            className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 ${
              isFavorite
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-black/40 hover:bg-red-500'
            }`}
            aria-label={isFavorite ? `Remove ${displayName} from favorites` : `Add ${displayName} to favorites`}
          >
            <Heart className={`w-4 h-4 text-white ${isFavorite ? 'fill-white' : ''}`} />
          </button>

          {/* Top Right Badges */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            {isVerified && (
              <div className="bg-white rounded-full p-0.5 shadow-md">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
            )}
            <div
              className={`rounded-md px-1.5 py-1 ${
                hasVideo ? 'bg-red-500' : 'bg-gray-400'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${hasVideo ? 'text-white' : 'text-gray-200'}`} />
            </div>
          </div>

          {/* Status Badge - Bottom Left */}
          <div
            className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${statusStyles.bg} ${statusStyles.animate ? 'animate-pulse' : ''}`}
          >
            <div className={`w-2 h-2 rounded-full ${statusStyles.dotBg}`} />
            <span className={`text-xs font-semibold capitalize ${statusStyles.text}`}>
              {statusStyles.label}
            </span>
          </div>

          {/* Agency Badge - Bottom Right */}
          {isAgencyManaged && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500">
              <Building2 className="w-3 h-3 text-white" />
              <span className="text-xs font-semibold text-white">Agency</span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-5">
          {/* Row 1: Name | Profession */}
          <div className="flex items-center justify-between mb-3">
            <h3
              id={`maid-${maid.id}-name`}
              className="text-base font-semibold text-gray-800 truncate pr-2"
            >
              {displayName}
            </h3>
            <Badge
              className={`flex-shrink-0 ${
                maid.primary_profession
                  ? 'bg-violet-100 text-violet-700 hover:bg-violet-100'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-50'
              } font-medium text-xs px-2 py-0.5`}
            >
              {maid.primary_profession
                ? maid.primary_profession.replace(/_/g, ' ')
                : 'N/A'}
            </Badge>
          </div>

          {/* Row 2: Flag | Experience */}
          <div className="flex items-center justify-between mb-2">
            <FlagImage
              countryCode={getCountryCode(maid.iso_country_code, maid.nationality || maid.country)}
            />
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {experience > 0 ? `${experience}+ yrs exp` : 'New'}
            </span>
          </div>

          {/* Row 3: Location | Accommodation */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
              <span className="text-xs truncate max-w-[130px]">
                {maid.current_location || 'Not specified'}
              </span>
            </div>
            <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
              {maid.live_in_preference === true
                ? 'Live-in'
                : maid.live_in_preference === false
                ? 'Live-out'
                : 'Flexible'}
            </span>
          </div>

          {/* Row 4: Salary | Languages */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-emerald-600">
              {salary}/mo
            </span>
            <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              {maid.languages && maid.languages.length > 0 ? (
                <>
                  {maid.languages.slice(0, 2).join(', ')}
                  {maid.languages.length > 2 && (
                    <span className="text-indigo-500"> +{maid.languages.length - 2}</span>
                  )}
                </>
              ) : (
                'N/A'
              )}
            </span>
          </div>

          {/* Row 5: Skills | Posted */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-cyan-700">
              {maid.skills && maid.skills.length > 0 ? (
                <>
                  {maid.skills.slice(0, 2).join(', ')}
                  {maid.skills.length > 2 && (
                    <span className="text-cyan-500"> +{maid.skills.length - 2}</span>
                  )}
                </>
              ) : (
                'No skills listed'
              )}
            </span>
            <div className="flex items-center gap-1 text-teal-600">
              <Clock className="w-3 h-3" />
              <span className="text-xs font-medium">
                {maid.created_at ? getPostedDate(maid.created_at) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-4 border-t border-gray-100">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/maid/${maid.id}`);
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium h-9"
              size="sm"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              View
            </Button>

            {isAgencyManaged ? (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isUnavailableForContact) {
                    onContact(maid);
                  }
                }}
                variant="outline"
                className={`flex-1 text-xs font-medium h-9 ${
                  isUnavailableForContact
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                size="sm"
                disabled={isUnavailableForContact}
              >
                <Building2 className="w-3.5 h-3.5 mr-1.5" />
                {isHired ? 'Hired' : isOnTrial ? 'On Trial' : 'Contact'}
              </Button>
            ) : (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isUnavailableForContact) {
                    onBookNow(maid);
                  }
                }}
                variant="outline"
                className={`flex-1 text-xs font-medium h-9 ${
                  isUnavailableForContact
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                size="sm"
                disabled={isUnavailableForContact}
              >
                <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                {isHired ? 'Hired' : isOnTrial ? 'On Trial' : 'Hire Now'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MaidCard;
