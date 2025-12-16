/**
 * Agency Maids Page
 *
 * Browse and manage maids with filtering and sorting.
 * Synced with mobile app implementation - card-based design.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAgencyMaids } from '@/hooks/useAgencyMaids';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getMaidDisplayName } from '@/lib/displayName';
import {
  FilePlus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  User,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  FileText,
  X,
  Upload,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  MessageCircle,
  Flag,
  DollarSign,
  Sparkles,
  ShieldCheck,
  MoreVertical,
  Heart,
  Globe,
  Building2,
} from 'lucide-react';

// ============================================
// Constants - Synced with Mobile App
// ============================================

const NATIONALITIES = [
  { label: 'All Nationalities', value: 'all' },
  { label: 'Ethiopian', value: 'Ethiopian' },
  { label: 'Filipino', value: 'Filipino' },
  { label: 'Indonesian', value: 'Indonesian' },
  { label: 'Sri Lankan', value: 'Sri Lankan' },
  { label: 'Indian', value: 'Indian' },
  { label: 'Kenyan', value: 'Kenyan' },
  { label: 'Ugandan', value: 'Ugandan' },
];

const EXPERIENCE_LEVELS = [
  { label: 'Any Experience', value: 'all' },
  { label: '0-1 years', value: '0-1' },
  { label: '1-3 years', value: '1-3' },
  { label: '3-5 years', value: '3-5' },
  { label: '5+ years', value: '5+' },
];

const AVAILABILITY_OPTIONS = [
  { label: 'Any Status', value: 'all' },
  { label: 'Available Now', value: 'available' },
  { label: 'Available Soon', value: 'available_soon' },
  { label: 'Placed', value: 'placed' },
];

const SORT_OPTIONS = [
  { label: 'Best Match', value: 'bestMatch', icon: Sparkles },
  { label: 'Rating', value: 'rating', icon: Star },
  { label: 'Experience', value: 'experience', icon: Briefcase },
  { label: 'Newest', value: 'newest', icon: Clock },
];

// ============================================
// Helper Functions
// ============================================

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'M';
  try {
    return (
      name
        .trim()
        .split(' ')
        .filter((part) => part && part.length > 0)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2) || 'M'
    );
  } catch (error) {
    return 'M';
  }
};

const getPrimaryImageUrl = (maid) => {
  if (!maid || typeof maid !== 'object') return null;

  // Debug: log what we're receiving
  console.log('[getPrimaryImageUrl] Maid:', maid.full_name || maid.name, 'profile_photo_url:', maid.profile_photo_url);

  if (maid.images && Array.isArray(maid.images) && maid.images.length > 0) {
    const primaryImage = maid.images.find(
      (img) => img && typeof img === 'object' && img.is_primary === true
    );
    if (primaryImage?.file_url?.trim()) return primaryImage.file_url;
    if (maid.images[0]?.file_url?.trim()) return maid.images[0].file_url;
  }

  // Validate that profile_photo_url is a proper URL (starts with http)
  if (maid.profile_photo_url?.trim()) {
    const url = maid.profile_photo_url.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    } else {
      console.warn('[getPrimaryImageUrl] Invalid profile_photo_url (not a URL):', url);
      return null;
    }
  }
  if (maid.profileImageUrl?.trim()) return maid.profileImageUrl;
  if (maid.image?.trim()) return maid.image;
  return null;
};

const getMaidCountry = (maid) => {
  if (!maid) return 'Unknown';
  return maid.nationality || maid.country || 'Unknown';
};

const isVerifiedMaid = (maid) => {
  return maid?.verification_status === 'verified';
};

// Country to currency mapping for GCC + Ethiopia
const countryCurrencyMap = {
  'United Arab Emirates': 'AED',
  'UAE': 'AED',
  'Saudi Arabia': 'SAR',
  'Qatar': 'QAR',
  'Kuwait': 'KWD',
  'Bahrain': 'BHD',
  'Oman': 'OMR',
  'Ethiopia': 'ETB',
};

const formatSalary = (min, max, currency, currentCountry) => {
  // Determine currency symbol - use provided currency, or derive from country
  let currencySymbol = currency;
  if (!currencySymbol && currentCountry) {
    currencySymbol = countryCurrencyMap[currentCountry] || 'USD';
  }
  if (!currencySymbol) {
    currencySymbol = 'USD';
  }
  // Use $ for USD, otherwise use the currency code
  const displaySymbol = currencySymbol === 'USD' ? '$' : currencySymbol + ' ';

  // Handle duplicate values (min === max)
  if (min && max && min === max) {
    return `${displaySymbol}${min.toLocaleString()}`;
  }
  if (min && max) {
    return `${displaySymbol}${min.toLocaleString()} - ${displaySymbol}${max.toLocaleString()}`;
  }
  if (min) return `From ${displaySymbol}${min.toLocaleString()}`;
  if (max) return `Up to ${displaySymbol}${max.toLocaleString()}`;
  return 'Negotiable';
};

// Best Match Scoring Algorithm (synced with mobile)
const calculateBestMatchScore = (maid) => {
  let score = 0;
  // Rating scores higher (weight: 2)
  score += (maid.average_rating || 0) * 2;
  // Experience scores (capped at 10)
  score += Math.min(maid.experience_years || maid.experience || 0, 10);
  // Verified users score higher (+5)
  if (isVerifiedMaid(maid)) score += 5;
  // Profile completion scores
  score += (maid.profile_completion_percentage || 0) / 20;
  return score;
};

// ============================================
// Maid Card Component - Synced with Mobile
// ============================================

const MaidCard = ({ maid, onView, onEdit, onDelete }) => {
  const imageUrl = getPrimaryImageUrl(maid);
  const displayName = getMaidDisplayName(maid);
  const country = getMaidCountry(maid);
  const experienceYears = maid.experience_years || maid.experience || 0;
  const [imageError, setImageError] = React.useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Image Container */}
      <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-400">
              {getInitials(displayName)}
            </span>
          </div>
        )}

        {/* Verified Badge - Top Right */}
        {isVerifiedMaid(maid) && (
          <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        )}

        {/* Rating Badge - Top Left */}
        {maid.average_rating > 0 && (
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold">{maid.average_rating?.toFixed(1)}</span>
          </div>
        )}

        {/* Experience Badge - Bottom Left */}
        {experienceYears > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md">
            <span className="text-xs font-semibold">{experienceYears}+ yrs</span>
          </div>
        )}

        {/* Availability Badge - Bottom Right */}
        {maid.availability_status === 'available' && (
          <div className="absolute bottom-2 right-2 bg-green-500/90 text-white px-2 py-1 rounded-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-semibold">Available</span>
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onView(maid)}
            className="shadow-lg"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEdit(maid.id)}
            className="shadow-lg"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Info Section */}
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-gray-900 truncate">{displayName}</h3>
          {/* Agency Badge - Always show in agency dashboard */}
          <Badge className="bg-purple-100 text-purple-700 border border-purple-200 text-xs px-1.5 py-0.5 flex items-center gap-1 shrink-0">
            <Building2 className="w-3 h-3" />
            Agency
          </Badge>
        </div>

        {/* Nationality */}
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
          <Flag className="w-3 h-3" />
          <span className="truncate">{country}</span>
        </div>

        {/* Location */}
        {maid.current_location && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{maid.current_location}</span>
          </div>
        )}

        {/* Salary */}
        <p className="text-green-600 font-bold text-sm mt-2 mb-2">
          {formatSalary(
            maid.preferred_salary_min,
            maid.preferred_salary_max,
            maid.preferred_currency,
            maid.current_location || maid.currentCountry
          )}/mo
        </p>

        {/* Skills */}
        {maid.skills && maid.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {maid.skills.slice(0, 2).map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs bg-gray-100">
                {skill}
              </Badge>
            ))}
            {maid.skills.length > 2 && (
              <span className="text-xs text-gray-400">+{maid.skills.length - 2}</span>
            )}
          </div>
        )}

        {/* Languages */}
        {maid.languages && maid.languages.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MessageCircle className="w-3 h-3" />
            <span className="truncate">
              {maid.languages.slice(0, 2).join(', ')}
              {maid.languages.length > 2 && ` +${maid.languages.length - 2}`}
            </span>
          </div>
        )}

        {/* Managed by Agency Note - Always show in agency dashboard */}
        <div className="flex items-center gap-1 mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
          <Building2 className="w-3 h-3" />
          <span>Managed by your agency</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(maid)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(maid.id)}
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(maid)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// Filter Chip Component
// ============================================

const FilterChip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
      active
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
);

// ============================================
// Sort Chip Component
// ============================================

const SortChip = ({ label, icon: Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
      active
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

// ============================================
// Main Component
// ============================================

const AgencyMaidsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hook data
  const {
    maids: maidListings,
    loading,
    error: hookError,
    deleteMaid: deleteMaidUseCase,
    refresh,
  } = useAgencyMaids();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Filters state (synced with mobile)
  const [filters, setFilters] = useState({
    nationality: 'all',
    experience: 'all',
    availability: 'all',
    verifiedOnly: false,
  });

  // Sort state
  const [sortBy, setSortBy] = useState('bestMatch');

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMaid, setSelectedMaid] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [maidToDelete, setMaidToDelete] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Show toast for hook errors
  useEffect(() => {
    if (hookError) {
      toast({
        title: 'Error loading maid listings',
        description: hookError,
        variant: 'destructive',
      });
    }
  }, [hookError]);

  // Filter and sort maids
  const filteredAndSortedMaids = useMemo(() => {
    let list = Array.isArray(maidListings) ? [...maidListings] : [];

    // Search filter
    if (debouncedTerm.trim()) {
      const term = debouncedTerm.toLowerCase();
      list = list.filter((maid) => {
        const name = getMaidDisplayName(maid)?.toLowerCase() || '';
        const nationality = getMaidCountry(maid)?.toLowerCase() || '';
        const location = maid.current_location?.toLowerCase() || '';
        const skills = maid.skills?.join(' ')?.toLowerCase() || '';
        return (
          name.includes(term) ||
          nationality.includes(term) ||
          location.includes(term) ||
          skills.includes(term)
        );
      });
    }

    // Nationality filter
    if (filters.nationality !== 'all') {
      list = list.filter((maid) => getMaidCountry(maid) === filters.nationality);
    }

    // Experience filter
    if (filters.experience !== 'all') {
      list = list.filter((maid) => {
        const exp = maid.experience_years || maid.experience || 0;
        switch (filters.experience) {
          case '0-1': return exp <= 1;
          case '1-3': return exp >= 1 && exp <= 3;
          case '3-5': return exp >= 3 && exp <= 5;
          case '5+': return exp >= 5;
          default: return true;
        }
      });
    }

    // Availability filter
    if (filters.availability !== 'all') {
      list = list.filter((maid) => {
        const status = maid.availability_status || maid.status || '';
        return status.toLowerCase() === filters.availability.toLowerCase();
      });
    }

    // Verified only filter
    if (filters.verifiedOnly) {
      list = list.filter((maid) => isVerifiedMaid(maid));
    }

    // Sorting
    switch (sortBy) {
      case 'bestMatch':
        list.sort((a, b) => calculateBestMatchScore(b) - calculateBestMatchScore(a));
        break;
      case 'rating':
        list.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'experience':
        list.sort((a, b) =>
          (b.experience_years || b.experience || 0) - (a.experience_years || a.experience || 0)
        );
        break;
      case 'newest':
        list.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    return list;
  }, [maidListings, debouncedTerm, filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMaids.length / itemsPerPage);
  const paginatedMaids = filteredAndSortedMaids.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, debouncedTerm, sortBy]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.nationality !== 'all') count++;
    if (filters.experience !== 'all') count++;
    if (filters.availability !== 'all') count++;
    if (filters.verifiedOnly) count++;
    return count;
  }, [filters]);

  // Reset filters
  const resetFilters = () => {
    setFilters({
      nationality: 'all',
      experience: 'all',
      availability: 'all',
      verifiedOnly: false,
    });
    setSortBy('bestMatch');
    setSearchTerm('');
    setDebouncedTerm('');
  };

  // Action handlers
  const handleViewMaid = (maid) => {
    setSelectedMaid(maid);
    setDetailDrawerOpen(true);
  };

  const handleEditMaid = (maidId) => {
    navigate(`/dashboard/agency/maids/${maidId}/edit`);
  };

  const handleDeleteMaid = (maid) => {
    setMaidToDelete(maid);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMaid = async () => {
    if (!maidToDelete) return;
    try {
      const success = await deleteMaidUseCase(
        maidToDelete.id,
        'Removed from agency dashboard',
        false
      );
      if (success) {
        toast({
          title: 'Maid removed successfully',
          description: 'The maid has been archived from your listings.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error removing maid',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setMaidToDelete(null);
    }
  };

  const handleRefresh = async () => {
    await refresh();
    toast({
      title: 'Refreshed',
      description: `${maidListings?.length || 0} maids loaded.`,
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredAndSortedMaids.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no maids to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Name', 'Country', 'Status', 'Experience', 'Skills', 'Salary Range'];
    const csvData = filteredAndSortedMaids.map((maid) => [
      getMaidDisplayName(maid),
      getMaidCountry(maid),
      maid.availability_status || maid.status || '',
      `${maid.experience_years || maid.experience || 0} years`,
      maid.skills ? maid.skills.join('; ') : '',
      formatSalary(maid.preferred_salary_min, maid.preferred_salary_max, maid.preferred_currency, maid.current_location || maid.currentCountry),
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `agency-maids-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export successful',
      description: `${filteredAndSortedMaids.length} maids exported to CSV.`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-10">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-gray-600">Loading maid listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Maid Listings
            <span className="ml-2 text-xl text-gray-500">({maidListings?.length || 0})</span>
          </h1>
          <p className="text-gray-500 mt-1">Browse and manage your maid profiles</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={filteredAndSortedMaids.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/agency/maids/bulk-upload">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <Link to="/dashboard/agency/maids/add">
              <FilePlus className="mr-2 h-4 w-4" />
              Add New Maid
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by name, nationality, location, or skills..."
            className="pl-10 h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setDebouncedTerm(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          className={`h-12 px-6 ${activeFilterCount > 0 ? 'bg-indigo-600' : ''}`}
          onClick={() => setShowFilters(true)}
        >
          <Filter className="mr-2 h-5 w-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-white text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Sort Options - Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {SORT_OPTIONS.map((option) => (
          <SortChip
            key={option.value}
            label={option.label}
            icon={option.icon}
            active={sortBy === option.value}
            onClick={() => setSortBy(option.value)}
          />
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredAndSortedMaids.length} {filteredAndSortedMaids.length === 1 ? 'maid' : 'maids'} available
          {sortBy === 'bestMatch' && (
            <span className="ml-2 text-purple-600 font-semibold">• AI Matched</span>
          )}
        </p>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-gray-500">
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.nationality !== 'all' && (
            <Badge variant="secondary" className="pr-1">
              {filters.nationality}
              <button
                onClick={() => setFilters({ ...filters, nationality: 'all' })}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.experience !== 'all' && (
            <Badge variant="secondary" className="pr-1">
              {EXPERIENCE_LEVELS.find(e => e.value === filters.experience)?.label}
              <button
                onClick={() => setFilters({ ...filters, experience: 'all' })}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.availability !== 'all' && (
            <Badge variant="secondary" className="pr-1">
              {AVAILABILITY_OPTIONS.find(a => a.value === filters.availability)?.label}
              <button
                onClick={() => setFilters({ ...filters, availability: 'all' })}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.verifiedOnly && (
            <Badge variant="secondary" className="pr-1">
              Verified Only
              <button
                onClick={() => setFilters({ ...filters, verifiedOnly: false })}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Maid Grid */}
      {filteredAndSortedMaids.length === 0 ? (
        <div className="text-center py-16">
          <User className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No maids found</h3>
          <p className="text-gray-500 mb-6">
            {maidListings?.length === 0
              ? 'No maid profiles have been added yet.'
              : 'Try adjusting your search or filters.'}
          </p>
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={resetFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
          {maidListings?.length === 0 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button asChild variant="outline">
                <Link to="/dashboard/agency/maids/bulk-upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Link>
              </Button>
              <Button asChild>
                <Link to="/dashboard/agency/maids/add">
                  <FilePlus className="mr-2 h-4 w-4" />
                  Add Your First Maid
                </Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedMaids.map((maid) => (
              <MaidCard
                key={maid.id}
                maid={maid}
                onView={handleViewMaid}
                onEdit={handleEditMaid}
                onDelete={handleDeleteMaid}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Filter Modal */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Filter Maids</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Nationality Filter */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Nationality</Label>
              <div className="flex flex-wrap gap-2">
                {NATIONALITIES.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    active={filters.nationality === option.value}
                    onClick={() => setFilters({ ...filters, nationality: option.value })}
                  />
                ))}
              </div>
            </div>

            {/* Experience Filter */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Experience</Label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    active={filters.experience === option.value}
                    onClick={() => setFilters({ ...filters, experience: option.value })}
                  />
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Availability</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    active={filters.availability === option.value}
                    onClick={() => setFilters({ ...filters, availability: option.value })}
                  />
                ))}
              </div>
            </div>

            {/* Verified Only Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <span className="font-medium">Verified Profiles Only</span>
              </div>
              <Switch
                checked={filters.verifiedOnly}
                onCheckedChange={(checked) => setFilters({ ...filters, verifiedOnly: checked })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetFilters} className="flex-1">
              Reset
            </Button>
            <Button onClick={() => setShowFilters(false)} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Maid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{' '}
              <span className="font-semibold">
                {maidToDelete ? getMaidDisplayName(maidToDelete) : 'this maid'}
              </span>{' '}
              from your listings. This action can be undone from the archive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMaid}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Drawer */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedMaid ? getMaidDisplayName(selectedMaid) : 'Maid Profile'}
            </SheetTitle>
            <SheetDescription>
              View detailed maid information
            </SheetDescription>
          </SheetHeader>

          {selectedMaid && (
            <div className="mt-6 space-y-6">
              {/* Profile Image */}
              <div className="text-center">
                <div className="relative inline-block">
                  <Avatar className="w-28 h-28 border-4 border-gray-100">
                    {getPrimaryImageUrl(selectedMaid) ? (
                      <AvatarImage
                        src={getPrimaryImageUrl(selectedMaid)}
                        alt={getMaidDisplayName(selectedMaid)}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-bold text-2xl">
                        {getInitials(getMaidDisplayName(selectedMaid))}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {isVerifiedMaid(selectedMaid) && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-4">
                  {getMaidDisplayName(selectedMaid)}
                </h3>
                <div className="flex items-center justify-center gap-2 mt-2 text-gray-600">
                  <Flag className="w-4 h-4" />
                  <span>{getMaidCountry(selectedMaid)}</span>
                </div>
                {selectedMaid.availability_status === 'available' && (
                  <Badge className="mt-2 bg-green-100 text-green-700">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    Available
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedMaid.experience_years || selectedMaid.experience || 0}
                  </p>
                  <p className="text-xs text-gray-500">Years Exp.</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedMaid.average_rating?.toFixed(1) || '-'}
                  </p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">
                    ${selectedMaid.preferred_salary_min || '-'}
                  </p>
                  <p className="text-xs text-gray-500">Min. Salary</p>
                </div>
              </div>

              {/* Skills */}
              {selectedMaid.skills && selectedMaid.skills.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-2 block">Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedMaid.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {selectedMaid.languages && selectedMaid.languages.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-2 block">Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedMaid.languages.map((lang, idx) => (
                      <Badge key={idx} variant="outline">{lang}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              {selectedMaid.current_location && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-2 block">Current Location</Label>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedMaid.current_location}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => navigate(`/dashboard/agency/maids/${selectedMaid.id}`)}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Full Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleEditMaid(selectedMaid.id)}
                  className="flex-1"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AgencyMaidsPage;
