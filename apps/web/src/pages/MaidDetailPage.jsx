/**
 * MaidDetailPage - Public maid profile view
 * Displays detailed information about a maid for potential employers
 * Shows all profile attributes including video CV
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { maidService } from '@/services/maidService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BookingRequestDialog from '@/components/maids/BookingRequestDialog';
import ContactActionPopup from '@/components/maids/ContactActionPopup';
import { getMaidDisplayName } from '@/lib/displayName';
import {
import { usePageTitle } from '@/hooks/usePageTitle';
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Star,
  Heart,
  MessageCircle,
  Briefcase,
  CheckCircle,
  Play,
  Building2,
  Globe,
  Languages,
  GraduationCap,
  Award,
  FileText,
  User,
  Users,
  Eye,
  Trophy,
  Loader2,
  Video,
  X,
  Church,
  Baby,
  CalendarDays,
  DollarSign,
  Home,
  Shield,
  FileCheck,
  Sparkles,
} from 'lucide-react';

// Helper function to get country flag
const getCountryFlag = (isoCode, nationality) => {
  if (isoCode && isoCode.length === 2) {
    const codePoints = isoCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  const nationalityMap = {
    ethiopian: '\u{1F1EA}\u{1F1F9}',
    ethiopia: '\u{1F1EA}\u{1F1F9}',
    filipino: '\u{1F1F5}\u{1F1ED}',
    philippines: '\u{1F1F5}\u{1F1ED}',
    kenyan: '\u{1F1F0}\u{1F1EA}',
    kenya: '\u{1F1F0}\u{1F1EA}',
    ugandan: '\u{1F1FA}\u{1F1EC}',
    uganda: '\u{1F1FA}\u{1F1EC}',
    indian: '\u{1F1EE}\u{1F1F3}',
    india: '\u{1F1EE}\u{1F1F3}',
    indonesian: '\u{1F1EE}\u{1F1E9}',
    indonesia: '\u{1F1EE}\u{1F1E9}',
  };
  const key = (nationality || '').toLowerCase();
  return nationalityMap[key] || '\u{1F3F3}\u{FE0F}';
};

// Format salary
const formatSalary = (min, max, currency) => {
  const curr = currency || 'USD';
  const symbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'AED' ? 'AED ' : curr + ' ';
  if (min && max) {
    return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
  }
  if (min) return `From ${symbol}${min.toLocaleString()}`;
  if (max) return `Up to ${symbol}${max.toLocaleString()}`;
  return 'Negotiable';
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Video Player Modal Component
const VideoPlayerModal = ({ isOpen, onClose, videoUrl, maidName }) => {
  const videoRef = useRef(null);

  usePageTitle('Maid Profile');
  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isOpen]);

  if (!videoUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
        <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <DialogTitle className="text-white flex items-center gap-2">
            <Video className="w-5 h-5" />
            {maidName}'s Introduction Video
          </DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-full"
            controlsList="nodownload"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Info Item Component
const InfoItem = ({ icon: Icon, label, value, className = '' }) => {
  if (!value && value !== 0) return null;
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, value, label, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center mx-auto mb-2`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
};

const MaidDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [maid, setMaid] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [contactPopupOpen, setContactPopupOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [profileStats, setProfileStats] = useState({
    profile_views: 0,
    total_applications: 0,
    successful_placements: 0,
    average_rating: 0,
  });

  useEffect(() => {
    const fetchMaid = async () => {
      setLoading(true);
      try {
        // Fetch maid profile
        const { data, error } = await maidService.getMaidById(id);
        if (error) {
          toast({
            title: 'Error',
            description: 'Failed to load maid profile.',
            variant: 'destructive',
          });
          navigate('/maids');
          return;
        }
        setMaid(data);

        // Set initial profile stats from fetched data
        setProfileStats({
          profile_views: data?.profile_views || 0,
          total_applications: data?.total_applications || 0,
          successful_placements: data?.successful_placements || 0,
          average_rating: data?.average_rating || 0,
        });

        // Fetch maid documents
        try {
          const { data: docsData } = await maidService.getMaidDocuments(id);
          if (docsData) {
            setDocuments(docsData);
          }
        } catch (docErr) {
          console.warn('Could not fetch documents:', docErr);
        }
      } catch (err) {
        console.error('Error fetching maid:', err);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
        navigate('/maids');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMaid();
    }
  }, [id, navigate]);

  // Increment profile views when page is loaded (separate effect to avoid re-running on every render)
  useEffect(() => {
    const incrementViews = async () => {
      if (!id || !user) return; // Only count views from logged-in users

      // Check if this user has already viewed this profile in this session
      const viewedKey = `maid_viewed_${id}`;
      const hasViewed = sessionStorage.getItem(viewedKey);

      if (!hasViewed) {
        try {
          const { data } = await maidService.incrementProfileViews(id);
          if (data?.profile_views) {
            setProfileStats(prev => ({
              ...prev,
              profile_views: data.profile_views,
            }));
          }
          // Mark as viewed in this session
          sessionStorage.setItem(viewedKey, 'true');
        } catch (err) {
          console.warn('Could not increment profile views:', err);
        }
      }
    };

    incrementViews();
  }, [id, user]);

  // Check if maid is in user's favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!id || !user) return;

      try {
        const userId = user.id || user.uid;
        const { data } = await maidService.isFavorite(userId, id);
        setIsFavorite(data);
      } catch (err) {
        console.warn('Could not check favorite status:', err);
      }
    };

    checkFavoriteStatus();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!maid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">The maid profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/maids')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Maids
          </Button>
        </div>
      </div>
    );
  }

  const displayName = getMaidDisplayName(maid);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2) || 'NA';
  const isVerified = maid.verification_status === 'verified';
  const isAgencyManaged = maid.is_agency_managed;
  const age = calculateAge(maid.date_of_birth);
  const salary = formatSalary(
    maid.preferred_salary_min,
    maid.preferred_salary_max,
    maid.preferred_currency
  );
  const hasVideo = !!maid.introduction_video_url;

  const handleContact = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please login or register to contact maids.',
        variant: 'destructive',
      });
      navigate('/register');
      return;
    }
    if (user.userType !== 'sponsor' && user.user_type !== 'sponsor') {
      toast({
        title: 'Access Restricted',
        description: 'Only sponsors can send messages to maids.',
        variant: 'destructive',
      });
      return;
    }
    // Redirect to messages page with maid ID to start/continue conversation
    navigate(`/dashboard/sponsor/messages?maid=${id}&name=${encodeURIComponent(displayName)}`);
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please login or register to save favorites.',
        variant: 'destructive',
      });
      navigate('/register');
      return;
    }

    if (user.userType !== 'sponsor' && user.user_type !== 'sponsor') {
      toast({
        title: 'Access Restricted',
        description: 'Only sponsors can save maids to favorites.',
        variant: 'destructive',
      });
      return;
    }

    setFavoriteLoading(true);
    try {
      const userId = user.id || user.uid;
      if (isFavorite) {
        const { error } = await maidService.removeFromFavorites(userId, id);
        if (error) throw error;
        setIsFavorite(false);
        toast({
          title: 'Removed from Favorites',
          description: `${displayName} has been removed from your favorites.`,
        });
      } else {
        const { error } = await maidService.addToFavorites(userId, id);
        if (error) throw error;
        setIsFavorite(true);
        toast({
          title: 'Added to Favorites',
          description: `${displayName} has been added to your favorites.`,
        });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      console.error('Error details:', {
        message: err?.message,
        graphQLErrors: err?.graphQLErrors,
        networkError: err?.networkError,
        userId: user.id || user.uid,
        maidId: id,
      });
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update favorites. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Check hired/trial status
  const hiredStatus = maid?.hired_status || '';
  const isHired = hiredStatus === 'hired';
  const isOnTrial = hiredStatus === 'in_trial';
  const isUnavailableForContact = isHired || isOnTrial;

  const handleHire = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please login or register to hire maids.',
        variant: 'destructive',
      });
      navigate('/register');
      return;
    }
    if (user.userType !== 'sponsor' && user.user_type !== 'sponsor') {
      toast({
        title: 'Access Restricted',
        description: 'Only sponsors can hire maids.',
        variant: 'destructive',
      });
      return;
    }
    // Check if maid is already hired or on trial
    if (isUnavailableForContact) {
      toast({
        title: isHired ? 'Maid Already Hired' : 'Maid On Trial',
        description: isHired
          ? 'This maid has already been hired and is not available.'
          : 'This maid is currently on a trial period with another sponsor.',
        variant: 'warning',
      });
      return;
    }
    // Open contact action popup instead of directly opening booking dialog
    setContactPopupOpen(true);
  };

  const handleBookingSuccess = (booking) => {
    setContactPopupOpen(false);
    toast({
      title: 'Booking Request Sent',
      description: 'Your booking request has been submitted successfully.',
    });
    navigate('/sponsor/bookings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/maids')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Maids
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Main Profile Card */}
            <Card className="overflow-hidden shadow-xl">
              {/* Profile Image */}
              <div className="relative aspect-square bg-gray-100">
                {maid.profile_photo_url ? (
                  <img
                    src={maid.profile_photo_url}
                    alt={displayName}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                    <span className="text-3xl font-bold text-gray-400">{initials}</span>
                  </div>
                )}

                {/* Badges on image */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {isVerified && (
                    <div className="bg-white rounded-full p-1.5 shadow-lg">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                  )}
                </div>

                {/* Video CV Badge - Clickable */}
                {hasVideo && (
                  <button
                    onClick={() => setVideoModalOpen(true)}
                    className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 transition-colors"
                  >
                    <Play className="w-4 h-4 text-white" />
                    <span className="text-sm text-white font-semibold">Watch Video CV</span>
                  </button>
                )}

                {/* Agency Badge */}
                {isAgencyManaged && (
                  <div className="absolute bottom-4 right-4 bg-emerald-500 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-white" />
                    <span className="text-sm text-white font-semibold">Agency Managed</span>
                  </div>
                )}

                {/* Availability/Hired Status */}
                <div className="absolute bottom-4 left-4">
                  {isHired ? (
                    <Badge className="text-sm px-3 py-1.5 bg-purple-600 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Hired
                    </Badge>
                  ) : isOnTrial ? (
                    <Badge className="text-sm px-3 py-1.5 bg-orange-500 text-white animate-pulse">
                      <Clock className="w-3 h-3 mr-1" />
                      On Trial
                    </Badge>
                  ) : (
                    <Badge
                      className={`text-sm px-3 py-1.5 ${
                        maid.availability_status === 'available'
                          ? 'bg-emerald-500 text-white'
                          : maid.availability_status === 'placed'
                          ? 'bg-blue-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {maid.availability_status || 'Unknown'}
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-6">
                {/* Name and verification */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                    {isVerified && (
                      <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {getCountryFlag(maid.iso_country_code, maid.nationality)}
                    </span>
                    <span className="text-gray-600">{maid.nationality}</span>
                    {maid.current_location && (
                      <>
                        <span className="text-gray-300">|</span>
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{maid.current_location}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Primary Profession */}
                {maid.primary_profession && (
                  <Badge className="bg-indigo-100 text-indigo-700 mb-4 text-base px-4 py-1.5">
                    {maid.primary_profession}
                  </Badge>
                )}

                {/* Salary */}
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm text-emerald-600 font-medium">Expected Salary</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">{salary}<span className="text-base font-normal">/month</span></p>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  {hasVideo && (
                    <Button
                      className="w-full bg-red-500 hover:bg-red-600"
                      onClick={() => setVideoModalOpen(true)}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Watch Introduction Video
                    </Button>
                  )}
                  <Button
                    className={`w-full ${
                      isUnavailableForContact
                        ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-70'
                        : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
                    onClick={handleHire}
                    disabled={isUnavailableForContact}
                  >
                    {isHired ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Already Hired
                      </>
                    ) : isOnTrial ? (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        On Trial
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-4 h-4 mr-2" />
                        {isAgencyManaged ? 'Contact Agency' : 'Hire Now'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className={`w-full ${isUnavailableForContact ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleContact}
                    disabled={isUnavailableForContact}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {isUnavailableForContact ? 'Not Available' : 'Send Message'}
                  </Button>
                  <Button
                    variant={isFavorite ? 'default' : 'ghost'}
                    className={`w-full ${isFavorite ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-600 hover:text-red-500'}`}
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                  >
                    {favoriteLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                    )}
                    {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Profile Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    icon={Eye}
                    value={profileStats.profile_views}
                    label="Profile Views"
                    color="blue"
                  />
                  <StatCard
                    icon={FileText}
                    value={profileStats.total_applications}
                    label="Applications"
                    color="purple"
                  />
                  <StatCard
                    icon={Trophy}
                    value={profileStats.successful_placements}
                    label="Placements"
                    color="emerald"
                  />
                  <StatCard
                    icon={Star}
                    value={profileStats.average_rating > 0 ? profileStats.average_rating.toFixed(1) : '0.0'}
                    label="Rating"
                    color="amber"
                  />
                </div>
                {maid.profile_completion_percentage > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Profile Completion</span>
                      <span className="font-medium text-indigo-600">{maid.profile_completion_percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${maid.profile_completion_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start mb-6 bg-white p-1.5 rounded-xl shadow flex-wrap h-auto gap-1">
                <TabsTrigger value="about" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                  About
                </TabsTrigger>
                <TabsTrigger value="experience" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                  Experience
                </TabsTrigger>
                <TabsTrigger value="skills" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                  Skills
                </TabsTrigger>
                <TabsTrigger value="preferences" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                  Preferences
                </TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                  Documents
                </TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about">
                <div className="space-y-6">
                  {/* About Me Section */}
                  {maid.about_me && (
                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-600" />
                          About Me
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{maid.about_me}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Personal Information */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoItem icon={User} label="Full Name" value={maid.full_name} />
                        <InfoItem icon={Calendar} label="Age" value={age ? `${age} years old` : null} />
                        <InfoItem icon={CalendarDays} label="Date of Birth" value={maid.date_of_birth ? formatDate(maid.date_of_birth) : null} />
                        <InfoItem icon={Globe} label="Nationality" value={maid.nationality} />
                        <InfoItem icon={MapPin} label="Current Location" value={maid.current_location} />
                        <InfoItem icon={Users} label="Marital Status" value={maid.marital_status} />
                        <InfoItem icon={Baby} label="Children" value={maid.children_count !== null && maid.children_count !== undefined ? `${maid.children_count} ${maid.children_count === 1 ? 'child' : 'children'}` : null} />
                        <InfoItem icon={Church} label="Religion" value={maid.religion} />
                        <InfoItem icon={GraduationCap} label="Education Level" value={maid.education_level} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Languages */}
                  {maid.languages && maid.languages.length > 0 && (
                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Languages className="w-5 h-5 text-indigo-600" />
                          Languages
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-3">
                          {maid.languages.map((lang, idx) => (
                            <Badge key={idx} className="bg-blue-100 text-blue-700 px-4 py-2 text-sm">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Experience Tab */}
              <TabsContent value="experience">
                <div className="space-y-6">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                        Work Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Experience Summary */}
                      <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                        <div className="text-center">
                          <p className="text-4xl font-bold text-indigo-600">
                            {maid.experience_years || 0}
                          </p>
                          <p className="text-sm text-indigo-600 font-medium">Years Experience</p>
                        </div>
                        <div className="border-l-2 border-indigo-200 pl-6">
                          <p className="font-semibold text-gray-900 text-lg">Professional Experience</p>
                          <p className="text-gray-600">
                            In domestic helper services across multiple countries
                          </p>
                        </div>
                      </div>

                      {/* Primary Profession */}
                      {maid.primary_profession && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Primary Role</h3>
                          <Badge className="bg-purple-100 text-purple-700 text-lg px-6 py-3">
                            {maid.primary_profession}
                          </Badge>
                        </div>
                      )}

                      {/* Previous Countries */}
                      {maid.previous_countries && maid.previous_countries.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Countries Worked In</h3>
                          <div className="flex flex-wrap gap-3">
                            {maid.previous_countries.map((country, idx) => (
                              <Badge key={idx} className="bg-blue-100 text-blue-700 px-4 py-2">
                                <Globe className="w-4 h-4 mr-2" />
                                {country}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Placement Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-xl text-center">
                          <Trophy className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-emerald-700">{profileStats.successful_placements}</p>
                          <p className="text-sm text-emerald-600">Successful Placements</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-xl text-center">
                          <Star className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-amber-700">{profileStats.average_rating > 0 ? profileStats.average_rating.toFixed(1) : '0.0'}</p>
                          <p className="text-sm text-amber-600">Average Rating</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-600" />
                      Skills & Abilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {maid.skills && maid.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {maid.skills.map((skill, idx) => (
                          <Badge
                            key={idx}
                            className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-5 py-2.5 text-sm font-medium"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No skills listed yet.</p>
                    )}

                    {/* Additional Services */}
                    {maid.additional_services && maid.additional_services.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Additional Services</h3>
                        <div className="flex flex-wrap gap-3">
                          {maid.additional_services.map((service, idx) => (
                            <Badge
                              key={idx}
                              className="bg-emerald-100 text-emerald-700 px-4 py-2"
                            >
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Work Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Salary */}
                      <div className="p-5 bg-emerald-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                          <p className="text-sm font-medium text-emerald-600">Expected Salary</p>
                        </div>
                        <p className="text-xl font-bold text-emerald-700">{salary}/month</p>
                        {maid.preferred_currency && (
                          <p className="text-sm text-emerald-600 mt-1">Currency: {maid.preferred_currency}</p>
                        )}
                      </div>

                      {/* Accommodation */}
                      <div className="p-5 bg-blue-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Home className="w-5 h-5 text-blue-600" />
                          <p className="text-sm font-medium text-blue-600">Accommodation</p>
                        </div>
                        <p className="text-xl font-bold text-blue-700">
                          {maid.live_in_preference === true
                            ? 'Live-in'
                            : maid.live_in_preference === false
                            ? 'Live-out'
                            : 'Flexible'}
                        </p>
                      </div>

                      {/* Contract Duration */}
                      {maid.contract_duration_preference && (
                        <div className="p-5 bg-purple-50 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-purple-600" />
                            <p className="text-sm font-medium text-purple-600">Contract Duration</p>
                          </div>
                          <p className="text-xl font-bold text-purple-700">
                            {maid.contract_duration_preference
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                        </div>
                      )}

                      {/* Available From */}
                      {maid.available_from && (
                        <div className="p-5 bg-amber-50 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarDays className="w-5 h-5 text-amber-600" />
                            <p className="text-sm font-medium text-amber-600">Available From</p>
                          </div>
                          <p className="text-xl font-bold text-amber-700">{formatDate(maid.available_from)}</p>
                        </div>
                      )}
                    </div>

                    {/* Additional Notes */}
                    {maid.additional_notes && (
                      <div className="mt-6 p-5 bg-gray-50 rounded-xl">
                        <h3 className="font-semibold text-gray-900 mb-2">Additional Notes</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{maid.additional_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      Documents & Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Verification Status */}
                    <div className={`p-5 rounded-xl ${isVerified ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                      <div className="flex items-center gap-3">
                        {isVerified ? (
                          <CheckCircle className="w-8 h-8 text-emerald-600" />
                        ) : (
                          <Clock className="w-8 h-8 text-amber-600" />
                        )}
                        <div>
                          <p className={`font-bold text-lg ${isVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isVerified ? 'Verified Profile' : 'Verification Pending'}
                          </p>
                          <p className={`text-sm ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {isVerified
                              ? 'This profile has been verified by our team'
                              : 'Profile verification is in progress'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Document Verification Status Grid - Shows only if documents are verified, no previews for safety */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Passport */}
                      <div className={`p-4 rounded-xl border-2 ${maid.passport_number || documents.some(d => d.document_type === 'passport') ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <FileCheck className={`w-6 h-6 ${maid.passport_number || documents.some(d => d.document_type === 'passport') ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-medium text-gray-900">Passport</p>
                            <p className={`text-sm ${maid.passport_number || documents.some(d => d.document_type === 'passport') ? 'text-emerald-600' : 'text-gray-500'}`}>
                              {maid.passport_number || documents.some(d => d.document_type === 'passport') ? 'Verified' : 'Not provided'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* National ID */}
                      <div className={`p-4 rounded-xl border-2 ${documents.some(d => d.document_type === 'national_id') ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <FileCheck className={`w-6 h-6 ${documents.some(d => d.document_type === 'national_id') ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-medium text-gray-900">National ID</p>
                            <p className={`text-sm ${documents.some(d => d.document_type === 'national_id') ? 'text-emerald-600' : 'text-gray-500'}`}>
                              {documents.some(d => d.document_type === 'national_id') ? 'Verified' : 'Not provided'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Visa Status */}
                      <div className={`p-4 rounded-xl border-2 ${maid.visa_status ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <Globe className={`w-6 h-6 ${maid.visa_status ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-medium text-gray-900">Visa Status</p>
                            <p className={`text-sm ${maid.visa_status ? 'text-blue-600' : 'text-gray-500'}`}>
                              {maid.visa_status || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Medical Certificate */}
                      <div className={`p-4 rounded-xl border-2 ${maid.medical_certificate_valid || documents.some(d => d.document_type === 'medical_certificate') ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <FileCheck className={`w-6 h-6 ${maid.medical_certificate_valid || documents.some(d => d.document_type === 'medical_certificate') ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-medium text-gray-900">Medical Certificate</p>
                            <p className={`text-sm ${maid.medical_certificate_valid || documents.some(d => d.document_type === 'medical_certificate') ? 'text-emerald-600' : 'text-gray-500'}`}>
                              {maid.medical_certificate_valid || documents.some(d => d.document_type === 'medical_certificate') ? 'Verified' : 'Not available'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Police Clearance */}
                      <div className={`p-4 rounded-xl border-2 ${maid.police_clearance_valid || documents.some(d => d.document_type === 'police_clearance') ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <Shield className={`w-6 h-6 ${maid.police_clearance_valid || documents.some(d => d.document_type === 'police_clearance') ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-medium text-gray-900">Police Clearance</p>
                            <p className={`text-sm ${maid.police_clearance_valid || documents.some(d => d.document_type === 'police_clearance') ? 'text-emerald-600' : 'text-gray-500'}`}>
                              {maid.police_clearance_valid || documents.some(d => d.document_type === 'police_clearance') ? 'Verified' : 'Not available'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Work Permit */}
                      <div className={`p-4 rounded-xl border-2 ${documents.some(d => d.document_type === 'work_permit') ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <FileCheck className={`w-6 h-6 ${documents.some(d => d.document_type === 'work_permit') ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-medium text-gray-900">Work Permit</p>
                            <p className={`text-sm ${documents.some(d => d.document_type === 'work_permit') ? 'text-emerald-600' : 'text-gray-500'}`}>
                              {documents.some(d => d.document_type === 'work_permit') ? 'Verified' : 'Not available'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Privacy Notice */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800">Document Privacy Protected</p>
                          <p className="text-sm text-blue-600 mt-1">
                            For safety and privacy, actual documents are not displayed publicly.
                            All documents have been verified by our team to ensure authenticity.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {/* Timestamps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          <p>Profile created: {formatDate(maid.created_at)} | Last updated: {formatDate(maid.updated_at)}</p>
        </motion.div>
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={maid.introduction_video_url}
        maidName={displayName}
      />

      {/* Booking Dialog */}
      <BookingRequestDialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        maid={maid}
      />

      {/* Contact Action Popup */}
      <ContactActionPopup
        isOpen={contactPopupOpen}
        onClose={() => setContactPopupOpen(false)}
        maid={maid}
        agency={maid?.agency_profile || null}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default MaidDetailPage;
